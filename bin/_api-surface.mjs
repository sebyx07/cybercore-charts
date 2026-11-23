#!/usr/bin/env node
// The public TypeScript API of a cybercore-charts package directory, one fact per line.
// Run by bin/api-diff; not part of the published package.
//
//   node bin/_api-surface.mjs --list <package-root>      print the surface
//   node bin/_api-surface.mjs <old-root> <new-root>      compare; exit 1 when the new one breaks callers
//
// A fact is `<entry> | <kind> <name>[.<member>] | <signature>`:
//   entry      a key of package.json "exports" (".", "./react", …) or "umd" (the CyberCharts global)
//   signature  what the type checker prints for it
// The entry's `types` file is read; when the package does not contain it (cybercore-charts 0.2.0
// shipped without its .d.ts files) the matching source under src/ is read instead.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const ts = createRequire(import.meta.url)('typescript');

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const INPUT_TYPE = /(Options|Config|Props|Args)$/;
const PRINT = ts.TypeFormatFlags.NoTruncation;

function typesTarget(target) {
  if (typeof target === 'string') return /\.(d\.ts|d\.mts|ts|tsx)$/.test(target) ? target : null;
  if (!target || typeof target !== 'object') return null;
  return target.types ?? typesTarget(target.import ?? target.default ?? target.require);
}

// The file to read for an entry: its declared types, else the source it was built from.
function entryFile(root, declared, notes, label) {
  const candidates = [declared];
  if (declared) {
    const source = declared.replace(/^(\.\/)?dist\//, 'src/').replace(/\.d\.ts$/, '');
    candidates.push(`${source}.ts`, `${source}.tsx`);
  }
  for (const candidate of candidates.filter(Boolean)) {
    const file = path.join(root, candidate);
    if (fs.existsSync(file)) {
      if (candidate !== declared) {
        notes.push(`${label}: ${declared} is not in the package; read ${candidate} instead`);
      }
      return file;
    }
  }
  return null;
}

function entriesOf(root, notes) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const facts = [];
  const entries = [];
  const exportsMap =
    pkg.exports && typeof pkg.exports === 'object' ? pkg.exports : { '.': pkg.exports ?? pkg.main };
  for (const [subpath, target] of Object.entries(exportsMap)) {
    // One fact per condition at any depth ("import", "require", "types"), so a new one is an
    // addition and a dropped one a removal.
    const conditions = new Set();
    const collect = (value) => {
      if (!value || typeof value !== 'object') return;
      for (const [condition, nested] of Object.entries(value)) {
        conditions.add(condition);
        collect(nested);
      }
    };
    collect(target);
    facts.push(`package.json | exports ${subpath} | entry`);
    for (const condition of conditions) {
      facts.push(`package.json | exports ${subpath} [${condition}] | condition`);
    }
    const declared = typesTarget(target) ?? (subpath === '.' ? pkg.types : null);
    if (!declared) continue;
    const file = entryFile(root, declared, notes, `entry ${subpath}`);
    if (file) entries.push({ label: subpath, file });
    else notes.push(`entry ${subpath}: neither ${declared} nor its source is in the package`);
  }
  const umd = entryFile(root, './dist/cdn.d.ts', [], 'umd');
  if (umd) entries.push({ label: 'umd', file: umd, umd: true });
  return { facts, entries };
}

// Private members, and members a type inherits from someone else's package (the hundreds of
// HTML attributes a React props type extends): neither is this library's API.
function isHidden(symbol) {
  const name = symbol.getName();
  if (name.startsWith('#') || name.startsWith('__')) return true;
  const declarations = symbol.declarations ?? [];
  if (
    declarations.length > 0 &&
    declarations.every((d) => /\/node_modules\//.test(d.getSourceFile().fileName))
  ) {
    return true;
  }
  return declarations.some((d) => ts.getCombinedModifierFlags(d) & ts.ModifierFlags.Private);
}

function memberPrefix(symbol) {
  const isProtected = (symbol.declarations ?? []).some(
    (d) => ts.getCombinedModifierFlags(d) & ts.ModifierFlags.Protected
  );
  return isProtected ? 'protected ' : '';
}

function surface(root, notes = []) {
  const { facts, entries } = entriesOf(root, notes);
  const options = {
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    experimentalDecorators: true,
    types: [],
  };
  // A downloaded tarball has no node_modules: resolve its peer types (react) from this checkout.
  const host = ts.createCompilerHost(options);
  const fromCheckout = path.join(REPO, 'package.json');
  host.resolveModuleNames = (names, containingFile) =>
    names.map(
      (name) =>
        ts.resolveModuleName(name, containingFile, options, host).resolvedModule ??
        ts.resolveModuleName(name, fromCheckout, options, host).resolvedModule
    );
  const program = ts.createProgram(
    entries.map((e) => e.file),
    options,
    host
  );
  const checker = program.getTypeChecker();
  // `import("../types").ChartTheme` and `ChartTheme` are the same type seen from two files.
  // The checker orders a union by internal type id, which differs between a .d.ts and its
  // source: sort runs of string literals, and a signature that is one top-level union.
  const sortUnion = (text) => {
    const parts = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < text.length; i += 1) {
      if ('([{<'.includes(text[i])) depth += 1;
      else if (')]}>'.includes(text[i]) && text[i - 1] !== '=') depth -= 1;
      else if (depth === 0 && text.startsWith(' | ', i)) {
        parts.push(text.slice(start, i));
        start = i + 3;
      }
    }
    parts.push(text.slice(start));
    return parts.sort().join(' | ');
  };
  const plain = (text) =>
    sortUnion(
      text
        .replace(/import\("[^"]+"\)\./g, '')
        .replace(/"[^"]*"(?: \| "[^"]*")+/g, (run) => run.split(' | ').sort().join(' | '))
    );
  const print = (type, at, flags = PRINT) => plain(checker.typeToString(type, at, flags));
  const printSignatures = (signatures, at) =>
    signatures.map((s) => plain(checker.signatureToString(s, at, PRINT))).join(' & ');

  const members = (entry, kind, owner, type, at) => {
    for (const prop of checker.getPropertiesOfType(type)) {
      if (isHidden(prop) || prop.getName() === 'prototype') continue;
      const optional = prop.flags & ts.SymbolFlags.Optional ? '?' : '';
      const propType = checker.getTypeOfSymbolAtLocation(prop, at);
      facts.push(
        `${entry} | ${kind} ${owner}.${prop.getName()}${optional} | ${memberPrefix(prop)}${print(propType, at)}`
      );
    }
  };

  for (const entry of entries) {
    const sourceFile = program.getSourceFile(entry.file);
    const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
    if (!moduleSymbol) {
      notes.push(`entry ${entry.label}: ${entry.file} exports nothing`);
      continue;
    }
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      const symbol =
        exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      const name = exported.getName();
      const at = symbol.declarations?.[0] ?? sourceFile;

      if (entry.umd) {
        if (name === 'default')
          members(
            'umd',
            'global',
            'CyberCharts',
            checker.getTypeOfSymbolAtLocation(symbol, at),
            at
          );
        continue;
      }
      if (symbol.flags & ts.SymbolFlags.Class) {
        const statics = checker.getTypeOfSymbolAtLocation(symbol, at);
        const signatures = statics.getConstructSignatures();
        facts.push(`${entry.label} | class ${name} | ${printSignatures(signatures, at)}`);
        members(entry.label, 'class', name, checker.getDeclaredTypeOfSymbol(symbol), at);
        members(entry.label, 'static', name, statics, at);
      } else if (symbol.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias)) {
        const type = checker.getDeclaredTypeOfSymbol(symbol);
        const isObject =
          !(type.flags & ts.TypeFlags.Union) && checker.getPropertiesOfType(type).length > 0;
        if (isObject) {
          facts.push(`${entry.label} | type ${name} | object`);
          members(entry.label, 'type', name, type, at);
        } else {
          facts.push(
            `${entry.label} | type ${name} | ${print(type, at, PRINT | ts.TypeFormatFlags.InTypeAlias)}`
          );
        }
      } else if (symbol.flags & ts.SymbolFlags.Function) {
        const type = checker.getTypeOfSymbolAtLocation(symbol, at);
        facts.push(
          `${entry.label} | function ${name} | ${printSignatures(type.getCallSignatures(), at)}`
        );
      } else {
        // A release changes the VERSION literal; its type is what callers depend on.
        const type = checker.getBaseTypeOfLiteralType(
          checker.getTypeOfSymbolAtLocation(symbol, at)
        );
        facts.push(`${entry.label} | const ${name} | ${print(type, at)}`);
      }
    }
  }
  return [...new Set(facts)].sort();
}

function toMap(facts) {
  const map = new Map();
  for (const fact of facts) {
    // The signature is the third field and may itself contain ` | ` (a union).
    const cut = fact.indexOf(' | ', fact.indexOf(' | ') + 3);
    map.set(fact.slice(0, cut), fact.slice(cut + 3));
  }
  return map;
}

// `type LineChartOptions.data` (no `?`) on an input type: every existing caller lacks it.
function isRequiredInput(key) {
  const match = / \| type ([A-Za-z0-9_]+)\.([^.]+)$/.exec(key);
  return Boolean(match && INPUT_TYPE.test(match[1]) && !match[2].endsWith('?'));
}

function compare(oldRoot, newRoot) {
  const notes = [];
  const missing = [];
  const before = toMap(surface(oldRoot, notes));
  const after = toMap(surface(newRoot, missing));
  if (missing.length > 0) {
    // This build would be published without the declarations package.json promises.
    for (const note of missing) console.log(`✗ this build: ${note}`);
    console.log('\nThe build did not produce the types package.json names: fix the build first.');
    process.exit(1);
  }
  const removed = [];
  const changed = [];
  const required = [];
  const added = [];
  for (const [key, signature] of before) {
    const optionalTwin = key.endsWith('?') ? key.slice(0, -1) : `${key}?`;
    if (after.has(key)) {
      if (after.get(key) !== signature)
        changed.push(`${key}\n        was: ${signature}\n        now: ${after.get(key)}`);
    } else if (after.has(optionalTwin)) {
      const nowRequired = key.endsWith('?');
      changed.push(
        `${key}\n        now ${nowRequired ? 'required' : 'optional'}: ${after.get(optionalTwin)}`
      );
    } else {
      removed.push(key);
    }
  }
  for (const key of after.keys()) {
    const optionalTwin = key.endsWith('?') ? key.slice(0, -1) : `${key}?`;
    if (before.has(key) || before.has(optionalTwin)) continue;
    // A member of a type that is itself new cannot break an existing caller.
    const owner = key.replace(/\.[^.]+$/, '');
    if (isRequiredInput(key) && before.has(owner)) required.push(key);
    else added.push(key);
  }

  const section = (title, items, mark) => {
    if (items.length === 0) return;
    console.log(`\n${title}`);
    for (const item of items) console.log(`    ${mark} ${item}`);
  };
  for (const note of notes) console.log(`note: ${note}`);
  console.log(`\npublic API: ${before.size} facts published, ${after.size} in this build`);
  section('REMOVED (breaking):', removed, '-');
  section(
    'CHANGED (breaking unless it only widens what callers may pass, or narrows what they receive):',
    changed,
    '~'
  );
  section(
    'NEW REQUIRED MEMBER of an input type (breaking: existing calls lack it):',
    required,
    '!'
  );
  section('added:', added, '+');
  return removed.length + changed.length + required.length;
}

const args = process.argv.slice(2);
if (args[0] === '--list' && args.length === 2) {
  const notes = [];
  for (const fact of surface(path.resolve(args[1]), notes)) console.log(fact);
  for (const note of notes) console.error(`note: ${note}`);
} else if (args.length === 2) {
  const breaking = compare(path.resolve(args[0]), path.resolve(args[1]));
  console.log(`\n${breaking} breaking or to-review difference(s).`);
  process.exit(breaking > 0 ? 1 : 0);
} else {
  console.error('usage: node bin/_api-surface.mjs --list <package-root> | <old-root> <new-root>');
  process.exit(2);
}
