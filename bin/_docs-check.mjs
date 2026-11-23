#!/usr/bin/env node
// Docs truth check, run by bin/docs-check: what README.md and llms.txt say about the API must be
// true of the sources (src/types.ts and the entry points that export it).
//
//   node bin/_docs-check.mjs <doc>…
//
// 1. Every fenced js/ts/jsx/tsx block (and every <script> in an html block) is type-checked
//    against src/: an import the package does not export, an option or prop that is not in its
//    options type, a value outside its union ('cyber' as a theme), a method a chart does not
//    have, a wrong argument list. A block that does not parse fails too.
// 2. `cybercore-charts/<subpath>` must be a package.json "exports" key; `…/dist/<file>` must be a
//    file package.json names (or the build produced).
// 3. hbs/gts blocks: every named argument of the `cyberChart` modifier is an option of the
//    chart it names, or one of the modifier's callbacks.
// 4. CSS custom properties (in css/scss/html blocks, and `--name` code spans) are read or set
//    somewhere under src/.
// 5. Prose: a code span that is a camelCase or PascalCase identifier (`showArea`, `createChart()`),
//    a `chart.method()` / `CyberCharts.x.y` path, or the first cell of an options/props/methods/
//    events table, names something the package exports or a member of an exported type.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const ts = createRequire(import.meta.url)('typescript');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rel = (file) => path.relative(ROOT, file);
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

// Diagnostics that mean "the docs name something the API does not have". Unknown identifiers
// (TS2304: a snippet's own `newData`, `handler`) and implicit-any noise are not in the list.
const API_ERRORS = new Set([
  2305, 2724, 2307, 2353, 2561, 2339, 2551, 2322, 2345, 2554, 2555, 2769, 2559, 2741, 2739, 2740,
  2693, 2613, 2614, 2351, 2349, 2558, 2820,
]);
const TABLE_OF_NAMES = /option|prop|method|event|arg|export|member|function|field/i;

// ---------------------------------------------------------------------------------------------
// package.json: which specifiers exist, and which source file each typed entry is built from
// ---------------------------------------------------------------------------------------------
const exportsMap =
  pkg.exports && typeof pkg.exports === 'object' ? pkg.exports : { '.': pkg.exports ?? pkg.main };
const namedFiles = new Set();
const collectFiles = (value) => {
  if (typeof value === 'string') namedFiles.add(value.replace(/^\.\//, ''));
  else if (value && typeof value === 'object') Object.values(value).forEach(collectFiles);
};
[pkg.main, pkg.module, pkg.types, pkg.browser, pkg.unpkg, pkg.jsdelivr, exportsMap].forEach(
  collectFiles
);

function typesTarget(target) {
  if (typeof target === 'string') return /\.(d\.ts|ts|tsx)$/.test(target) ? target : null;
  if (!target || typeof target !== 'object') return null;
  return target.types ?? typesTarget(target.import ?? target.default ?? target.require);
}
function sourceOf(declared) {
  const base = declared
    .replace(/^(\.\/)?dist\//, 'src/')
    .replace(/\.d\.ts$/, '')
    .replace(/\.tsx?$/, '');
  return [`${base}.ts`, `${base}.tsx`].map((f) => path.join(ROOT, f)).find((f) => fs.existsSync(f));
}
const entrySource = new Map(); // "cybercore-charts/react" -> /abs/src/react/index.ts
const distToSpecifier = new Map(); // "dist/react/index.js" -> "cybercore-charts/react"
for (const [subpath, target] of Object.entries(exportsMap)) {
  const specifier = pkg.name + subpath.slice(1);
  const declared = typesTarget(target) ?? (subpath === '.' ? pkg.types : null);
  const source = declared && sourceOf(declared);
  if (source) entrySource.set(specifier, source);
  const files = new Set();
  const collect = (v) =>
    typeof v === 'string'
      ? files.add(v.replace(/^\.\//, ''))
      : v && Object.values(v).forEach(collect);
  collect(target);
  for (const file of files) distToSpecifier.set(file, specifier);
}
const subpathExists = (specifier) => {
  const subpath = `.${specifier.slice(pkg.name.length)}`;
  return Object.keys(exportsMap).some((key) =>
    key.includes('*')
      ? new RegExp(`^${key.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace('*', '.+')}$`).test(
          subpath
        )
      : key === subpath
  );
};
const cdnSource = path.join(ROOT, 'src/cdn.ts');
const hasUmd = fs.existsSync(cdnSource);

// ---------------------------------------------------------------------------------------------
// Read the docs: fenced blocks, and prose with the blocks blanked out
// ---------------------------------------------------------------------------------------------
const failures = [];
const fail = (file, line, message) => failures.push({ file, line, message });

function readDoc(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const blocks = [];
  const prose = [];
  let open = null;
  lines.forEach((text, index) => {
    const fence = /^\s*(```+|~~~+)\s*([A-Za-z0-9_+-]*)/.exec(text);
    if (open) {
      if (
        fence &&
        fence[1][0] === open.fence[0] &&
        fence[1].length >= open.fence.length &&
        !fence[2]
      ) {
        blocks.push(open);
        open = null;
      } else {
        open.lines.push(text);
      }
      prose.push('');
    } else if (fence) {
      open = { fence: fence[1], lang: fence[2].toLowerCase(), start: index + 2, lines: [] };
      prose.push('');
    } else {
      prose.push(text);
    }
  });
  if (open) fail(file, open.start - 1, 'code fence is never closed');
  return { blocks, prose };
}

const SCRIPT_LANG = {
  js: 'ts',
  javascript: 'ts',
  mjs: 'ts',
  ts: 'ts',
  typescript: 'ts',
  jsx: 'tsx',
  tsx: 'tsx',
};
const virtual = new Map(); // virtual file name -> { text, doc, start }
let snippetCount = 0;
const addSnippet = (doc, start, ext, text) => {
  // `export {}` makes each snippet its own module, so two blocks may both declare `chart`.
  const name = path.join(ROOT, `__docs__/${path.basename(doc)}.${start}.${ext}`);
  virtual.set(name, { text: `${text}\nexport {};\n`, doc, start });
  snippetCount += 1;
};

const docs = process.argv.slice(2).map((file) => path.resolve(file));
if (docs.length === 0) {
  console.error('usage: node bin/_docs-check.mjs <doc>…');
  process.exit(2);
}
const parsed = new Map();
for (const doc of docs) {
  const { blocks, prose } = readDoc(doc);
  parsed.set(doc, { blocks, prose });
  for (const block of blocks) {
    const ext = SCRIPT_LANG[block.lang];
    if (ext) addSnippet(doc, block.start, ext, block.lines.join('\n'));
    if (block.lang === 'html') {
      // Keep line numbers: blank everything that is not inside a <script>.
      const html = block.lines.join('\n');
      const script = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
      for (let m = script.exec(html); m; m = script.exec(html)) {
        if (/\bsrc=/.test(m[1]) || /type="(?!module|text\/javascript)/.test(m[1])) continue;
        const before = html.slice(0, m.index + m[0].indexOf('>') + 1).split('\n').length - 1;
        addSnippet(doc, block.start + before, 'ts', m[2]);
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------
// One program: the real entry points plus every snippet
// ---------------------------------------------------------------------------------------------
const options = {
  noEmit: true,
  skipLibCheck: true,
  strict: false,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  experimentalDecorators: true,
  types: [],
};
const globalsFile = path.join(ROOT, '__docs__/globals.d.ts');
if (hasUmd) {
  virtual.set(globalsFile, {
    text: `import type Umd from ${JSON.stringify(cdnSource.replace(/\.ts$/, ''))};\ndeclare global {\n  const CyberCharts: typeof Umd;\n  interface Window { CyberCharts: typeof Umd }\n}\nexport {};\n`,
  });
}
const host = ts.createCompilerHost(options);
const realFileExists = host.fileExists.bind(host);
const realReadFile = host.readFile.bind(host);
const realGetSourceFile = host.getSourceFile.bind(host);
host.fileExists = (file) => virtual.has(file) || realFileExists(file);
host.readFile = (file) => virtual.get(file)?.text ?? realReadFile(file);
host.getSourceFile = (file, languageVersion, ...rest) =>
  virtual.has(file)
    ? ts.createSourceFile(file, virtual.get(file).text, languageVersion, true)
    : realGetSourceFile(file, languageVersion, ...rest);

// "https://cdn.jsdelivr.net/npm/cybercore-charts@1.2.3/dist/x.js" -> the entry that file belongs to.
function specifierOfUrl(name) {
  const match = new RegExp(`^https?://[^/]+/(?:npm/)?${pkg.name}(?:@[^/]+)?(/.*)?$`).exec(name);
  if (!match) return null;
  const rest = (match[1] ?? '').replace(/^\//, '').replace(/\/?\+esm$/, '');
  if (rest === '') return pkg.name;
  return distToSpecifier.get(rest) ?? null;
}
host.resolveModuleNames = (names, containingFile) =>
  names.map((name) => {
    const specifier = /^https?:/.test(name) ? specifierOfUrl(name) : name;
    const source = specifier && entrySource.get(specifier);
    if (source)
      return {
        resolvedFileName: source,
        extension: path.extname(source),
        isExternalLibraryImport: false,
      };
    if (specifier === pkg.name || specifier?.startsWith(`${pkg.name}/`) || /^https?:/.test(name))
      return undefined;
    return ts.resolveModuleName(name, containingFile, options, host).resolvedModule;
  });

const entryFiles = [...new Set(entrySource.values())];
const emberIndex = path.join(ROOT, 'src/ember/index.ts');
if (fs.existsSync(emberIndex) && !entryFiles.includes(emberIndex)) entryFiles.push(emberIndex);
if (hasUmd) entryFiles.push(cdnSource);
const program = ts.createProgram([...entryFiles, ...virtual.keys()], options, host);
const checker = program.getTypeChecker();

for (const [file, snippet] of virtual) {
  if (!snippet.doc) continue;
  const sourceFile = program.getSourceFile(file);
  const diagnostics = [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile).filter((d) => API_ERRORS.has(d.code)),
  ];
  for (const diagnostic of diagnostics) {
    const line = sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line;
    const message = ts
      .flattenDiagnosticMessageText(diagnostic.messageText, ' ')
      .replace(/\s+/g, ' ');
    fail(snippet.doc, snippet.start + line, `TS${diagnostic.code}: ${message}`);
  }
}

// ---------------------------------------------------------------------------------------------
// Names the package has: exports, members of exported types, union literals, the UMD global
// ---------------------------------------------------------------------------------------------
const known = new Set();
const exportedTypes = new Map(); // "CyberLineChartArgs" -> Type
const ownDeclaration = (symbol) =>
  (symbol.declarations ?? []).some((d) => !/\/node_modules\//.test(d.getSourceFile().fileName));
function addMembers(type, depth = 0) {
  for (const part of type.isUnion() ? type.types : [type]) {
    if (part.isStringLiteral()) known.add(part.value);
    for (const prop of checker.getPropertiesOfType(part)) {
      if (!ownDeclaration(prop)) continue;
      known.add(prop.getName());
      if (depth < 2 && prop.valueDeclaration)
        addMembers(checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration), depth + 1);
    }
  }
}
for (const file of entryFiles) {
  const sourceFile = program.getSourceFile(file);
  const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) continue;
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const symbol =
      exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const at = symbol.declarations?.[0] ?? sourceFile;
    if (exported.getName() !== 'default') known.add(exported.getName());
    if (
      symbol.flags &
      (ts.SymbolFlags.Class | ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias)
    ) {
      const declared = checker.getDeclaredTypeOfSymbol(symbol);
      exportedTypes.set(exported.getName(), declared);
      addMembers(declared);
    }
    if (symbol.flags & ts.SymbolFlags.Value)
      addMembers(checker.getTypeOfSymbolAtLocation(symbol, at));
  }
}
if (hasUmd) known.add('CyberCharts');

// Names that are the platform's or React's, not this library's: never a finding.
const foreign = new Set();
const anySnippet = program.getSourceFile([...virtual.keys()][0] ?? entryFiles[0]);
for (const symbol of checker.getSymbolsInScope(
  anySnippet,
  ts.SymbolFlags.Value | ts.SymbolFlags.Type | ts.SymbolFlags.Namespace
)) {
  foreign.add(symbol.getName());
}
const react = ts.resolveModuleName(
  'react',
  path.join(ROOT, 'package.json'),
  options,
  host
).resolvedModule;
if (react) {
  const reactProgram = ts.createProgram([react.resolvedFileName], options, host);
  const reactFile = reactProgram.getSourceFile(react.resolvedFileName);
  const reactSymbol = reactFile && reactProgram.getTypeChecker().getSymbolAtLocation(reactFile);
  if (reactSymbol)
    for (const s of reactProgram.getTypeChecker().getExportsOfModule(reactSymbol))
      foreign.add(s.getName());
}

// Custom properties the sources read or set.
const customProperties = new Set();
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|scss|css|hbs)$/.test(entry.name)) {
      // `var(--x`, `--x: value`, '--x' in a string; never the `--modifier` of a BEM class name.
      const text = fs.readFileSync(full, 'utf8');
      for (const m of text.matchAll(
        /(?<![A-Za-z0-9_&-])(--[a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?=\s*[:,)]|['"`])/g
      )) {
        customProperties.add(m[1]);
      }
    }
  }
};
walk(path.join(ROOT, 'src'));
const propertyFamilies = new Set([...customProperties].map((p) => p.split('-')[2]));

// ---------------------------------------------------------------------------------------------
// Non-script checks, per doc
// ---------------------------------------------------------------------------------------------
const distExists = fs.existsSync(path.join(ROOT, 'dist'));
let nameCount = 0;
for (const [doc, { blocks, prose }] of parsed) {
  const everyLine = fs.readFileSync(doc, 'utf8').split('\n');

  everyLine.forEach((text, index) => {
    // 2. Subpaths and dist files.
    for (const m of text.matchAll(
      new RegExp(`['"\`(/]${pkg.name}(@[^/\\s'"\`)]+)?/(dist/[A-Za-z0-9._/-]+[A-Za-z0-9])`, 'g')
    )) {
      if (!namedFiles.has(m[2]) && !(distExists && fs.existsSync(path.join(ROOT, m[2])))) {
        fail(
          doc,
          index + 1,
          `${m[2]} is not a file package.json names${distExists ? ' and the build did not produce it' : ''}`
        );
      }
    }
    for (const m of text.matchAll(new RegExp(`['"\`](${pkg.name}/[A-Za-z0-9._/-]+)['"\`]`, 'g'))) {
      if (!subpathExists(m[1])) fail(doc, index + 1, `'${m[1]}' is not in package.json "exports"`);
    }
  });

  for (const block of blocks) {
    // 3. Ember templates: {{cyberChart "line" data=@points …}} (cyber-chart in classic templates).
    if (['hbs', 'handlebars', 'gts', 'gjs'].includes(block.lang)) {
      const text = block.lines.join('\n');
      const optionsMap = exportedTypes.get('CyberChartOptionsMap');
      const callbacks = exportedTypes.get('CyberChartCallbacks');
      for (const use of text.matchAll(
        /\{\{\s*(?:cyberChart|cyber-chart)\s+"([^"]*)"([^}]*)\}\}/g
      )) {
        const line = block.start + text.slice(0, use.index).split('\n').length - 1;
        const chart = optionsMap && checker.getPropertyOfType(optionsMap, use[1]);
        if (!chart) {
          fail(doc, line, `the cyberChart modifier has no chart type "${use[1]}"`);
          continue;
        }
        const names = new Set(
          [checker.getTypeOfSymbol(chart), callbacks]
            .filter(Boolean)
            .flatMap((type) => checker.getPropertiesOfType(type).map((p) => p.getName()))
        );
        for (const arg of use[2].matchAll(/(?:^|\s)([A-Za-z0-9_]+)=/g)) {
          nameCount += 1;
          if (!names.has(arg[1])) {
            fail(
              doc,
              line,
              `cyberChart "${use[1]}" has no ${arg[1]}= argument (not an option of that chart, not a callback)`
            );
          }
        }
      }
    }
    // 4. Custom properties in style code.
    if (['css', 'scss', 'html'].includes(block.lang)) {
      block.lines.forEach((text, offset) => {
        for (const m of text.matchAll(/(--[a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?=\s*[:,)])/g)) {
          nameCount += 1;
          if (!customProperties.has(m[1]))
            fail(doc, block.start + offset, `${m[1]} is not a custom property src/ reads or sets`);
        }
      });
    }
  }

  // 5. Prose.
  let tableOfNames = false;
  prose.forEach((text, index) => {
    const line = index + 1;
    const cells = /^\s*\|/.test(text) ? text.split('|').slice(1) : null;
    if (!cells) tableOfNames = false;
    else if (/^\s*\|[\s:|-]+\|\s*$/.test(text))
      tableOfNames = TABLE_OF_NAMES.test(prose[index - 1].split('|')[1] ?? '');
    const firstCell = cells && tableOfNames ? /^\s*`([^`]+)`/.exec(cells[0])?.[1] : null;

    for (const m of text.matchAll(/`([^`]+)`/g)) {
      const span = m[1].trim();
      if (/^--[a-z][a-z0-9-]*[a-z0-9]$/.test(span)) {
        if (!propertyFamilies.has(span.split('-')[2])) continue; // a CLI flag, not a token
        nameCount += 1;
        if (!customProperties.has(span))
          fail(doc, line, `\`${span}\` is not a custom property src/ reads or sets`);
        continue;
      }
      const dotted = /^([A-Za-z_$][\w$]*)((?:\.[A-Za-z_$][\w$]*)+)(\(.*\))?$/.exec(span);
      if (dotted) {
        const [head, ...rest] = [dotted[1], ...dotted[2].slice(1).split('.')];
        if (head !== 'chart' && !known.has(head)) continue; // `package.json`, `event.data`
        nameCount += 1;
        for (const segment of rest) {
          if (segment === 'current' || segment === 'prototype') continue;
          if (!known.has(segment))
            fail(doc, line, `\`${span}\`: \`${segment}\` is not a member the package has`);
        }
        continue;
      }
      const single = /^([A-Za-z_$][\w$]*)(\(.*\))?\??$/.exec(span);
      if (!single) continue;
      const name = single[1];
      const mixedCase = /[a-z]/.test(name) && /[A-Z]/.test(name.slice(1));
      const pascal = /^[A-Z][a-z]/.test(name);
      if (!(mixedCase || pascal || span === firstCell)) continue;
      if (foreign.has(name)) continue;
      nameCount += 1;
      if (!known.has(name))
        fail(doc, line, `\`${span}\` is not an export, option, method or event the package has`);
    }
  });
}

// ---------------------------------------------------------------------------------------------
if (failures.length > 0) {
  failures.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  let current = '';
  for (const failure of failures) {
    if (failure.file !== current) {
      current = failure.file;
      console.log(`✗ ${rel(current)} says what the package does not have:`);
    }
    console.log(`    ${rel(failure.file)}:${failure.line}  ${failure.message}`);
  }
  console.log(
    `\n${failures.length} finding(s) in ${new Set(failures.map((f) => f.file)).size} file(s).`
  );
  process.exit(1);
}
console.log(
  `${docs.length} file(s): ${snippetCount} snippet(s) type-checked against src/, ${nameCount} named option(s), member(s) and token(s) found, ${known.size} names known`
);
