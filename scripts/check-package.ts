// Proves the npm package works as a user installs it. Run after `npm run build`.
//
//   npm run check:package
//
// 1. Checks package.json: no runtime dependencies, every peer dependency optional.
// 2. `npm pack`, then checks the tarball: every required file and every `exports` target is in
//    it, and nothing outside the published allowlist (sources, demo, tests, configs) leaked in;
//    the React entry starts with the 'use client' directive (Next.js App Router).
// 3. Installs the tarball into an empty temporary project, next to the optional peers at the
//    versions this repo develops against, and uses it from there:
//    - `import` and `require` of "." and "./react" in Node (createChart, the React components),
//      `VERSION` equal to package.json "version";
//    - the UMD bundle in a bare global scope (window.CyberCharts);
//    - "./ember", "./styles" and "./package.json" resolve;
//    - a TypeScript consumer type-checks against every entry, as ESM and as CommonJS under
//      `moduleResolution: nodenext`, and under `moduleResolution: bundler`.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

interface PackResult {
  filename: string;
  size: number;
  unpackedSize: number;
  entryCount: number;
  files: { path: string }[];
}

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  exports: Record<string, unknown>;
}

const ROOT = resolve(import.meta.dirname, '..');
const REQUIRED = [
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'dist/cybercore-charts.esm.js',
  'dist/cybercore-charts.cjs',
  'dist/cybercore-charts.umd.js',
  'dist/cybercore-charts.umd.min.js',
  'dist/index.d.ts',
  'dist/index.d.cts',
  'dist/react/index.js',
  'dist/react/index.cjs',
  'dist/react/index.d.ts',
  'dist/react/index.d.cts',
  'dist/ember/index.js',
  'dist/ember/index.d.ts',
  'src/styles/cyber-charts.scss',
];
const ALLOWED = [
  /^package\.json$/,
  /^README\.md$/,
  /^CHANGELOG\.md$/,
  /^LICENSE$/,
  /^dist\//,
  /^src\/styles\/[^/]+\.scss$/,
];
const FORBIDDEN = [/\.test\.[cm]?[jt]sx?$/, /(^|\/)node_modules\//, /(^|\/)\.DS_Store$/];
// Optional peers installed next to the tarball, at the versions in devDependencies.
const CONSUMER_PEERS = ['react', 'react-dom', '@types/react', 'ember-modifier', 'ember-source'];

const errors: string[] = [];
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const tsc = join(ROOT, 'node_modules/typescript/bin/tsc');

function run(command: string, args: string[], cwd: string): string {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function failure(error: unknown): string {
  const { stdout, stderr, message } = error as {
    stdout?: string;
    stderr?: string;
    message?: string;
  };
  return [stdout, stderr].filter(Boolean).join('\n').trim() || String(message ?? error);
}

// Every file path an exports entry can point at, however deeply its conditions nest.
function exportTargets(target: unknown): string[] {
  if (typeof target === 'string') {
    return [target];
  }
  if (target && typeof target === 'object') {
    return Object.values(target).flatMap(exportTargets);
  }
  return [];
}

if (!existsSync(join(ROOT, 'dist/cybercore-charts.umd.min.js'))) {
  console.error('✗ dist/ is not built. Build it first: npm run build');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as PackageJson;

// 1. package.json.
if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
  errors.push(`runtime dependencies are not allowed: ${Object.keys(pkg.dependencies).join(', ')}`);
}
for (const peer of Object.keys(pkg.peerDependencies)) {
  if (!pkg.peerDependenciesMeta?.[peer]?.optional) {
    errors.push(`peer dependency ${peer} must be optional (peerDependenciesMeta)`);
  }
}

const work = mkdtempSync(join(tmpdir(), 'cybercore-charts-package-'));
try {
  // 2. The tarball.
  const [pack] = JSON.parse(
    run(npm, ['pack', '--json', '--ignore-scripts', '--pack-destination', work], ROOT)
  ) as PackResult[];
  if (!pack) {
    throw new Error('npm pack printed no result');
  }
  const files = new Set(pack.files.map((f) => f.path));
  console.log(
    `${pack.filename}: ${pack.entryCount} files, ${(pack.size / 1024).toFixed(1)} KB packed, ` +
      `${(pack.unpackedSize / 1024).toFixed(1)} KB unpacked`
  );

  for (const path of REQUIRED) {
    if (!files.has(path)) {
      errors.push(`missing from the tarball: ${path} (package.json "files", or the build)`);
    }
  }
  for (const path of files) {
    if (!ALLOWED.some((re) => re.test(path)) || FORBIDDEN.some((re) => re.test(path))) {
      errors.push(`should not be published: ${path} (tighten package.json "files")`);
    }
  }
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    for (const file of exportTargets(target)) {
      if (!files.has(file.replace(/^\.\//, ''))) {
        errors.push(`exports["${subpath}"] points at ${file}, which is not in the tarball`);
      }
    }
  }

  for (const file of ['dist/react/index.js', 'dist/react/index.cjs']) {
    if (!readFileSync(join(ROOT, file), 'utf8').startsWith('"use client";')) {
      errors.push(`${file} must start with the "use client" directive (vite.config.ts banner)`);
    }
  }

  // 3. A consumer project.
  const app = join(work, 'app');
  mkdirSync(app);
  writeFileSync(
    join(app, 'package.json'),
    JSON.stringify({ name: 'consumer', private: true, type: 'module' })
  );
  const peers = CONSUMER_PEERS.map((name) => `${name}@${pkg.devDependencies[name]}`);
  run(
    npm,
    [
      'install',
      '--no-audit',
      '--no-fund',
      '--ignore-scripts',
      '--prefer-offline',
      join(work, pack.filename),
      ...peers,
    ],
    app
  );

  const probes: Record<string, string> = {
    'import "." and "./react"': `
      const core = await import('${pkg.name}');
      if (typeof core.createChart !== 'function') throw new Error('createChart is not a function');
      if (typeof core.LineChart !== 'function') throw new Error('LineChart is not a class');
      if (core.VERSION !== '${pkg.version}') throw new Error('VERSION is ' + core.VERSION + ', package.json says ${pkg.version}');
      const react = await import('${pkg.name}/react');
      if (!react.CyberLineChart) throw new Error('CyberLineChart is missing');
    `,
    'require "." and "./react"': `
      const { createRequire } = await import('node:module');
      const require = createRequire(process.cwd() + '/index.cjs');
      const core = require('${pkg.name}');
      if (typeof core.createChart !== 'function') throw new Error('createChart is not a function');
      if (core.VERSION !== '${pkg.version}') throw new Error('VERSION is ' + core.VERSION);
      if (!require('${pkg.name}/react').CyberLineChart) throw new Error('CyberLineChart is missing');
    `,
    'resolve "./ember", "./styles", "./package.json"': `
      for (const s of ['${pkg.name}/ember', '${pkg.name}/styles', '${pkg.name}/package.json']) {
        import.meta.resolve(s);
      }
    `,
  };
  for (const [name, code] of Object.entries(probes)) {
    try {
      run(process.execPath, ['--input-type=module', '-e', code], app);
      console.log(`✓ ${name}`);
    } catch (error) {
      errors.push(`${name} failed:\n${failure(error)}`);
    }
  }

  // The CDN bundle in a <script>-like global scope, no module system.
  const umdPath = join(app, 'node_modules', pkg.name, 'dist/cybercore-charts.umd.min.js');
  const sandbox: { window?: unknown; self?: unknown; CyberCharts?: Record<string, unknown> } = {};
  sandbox.window = sandbox.self = sandbox;
  try {
    runInNewContext(readFileSync(umdPath, 'utf8'), sandbox, { filename: umdPath });
    if (typeof sandbox.CyberCharts?.createChart !== 'function') {
      throw new Error('window.CyberCharts.createChart is not a function');
    }
    console.log('✓ UMD bundle defines window.CyberCharts');
  } catch (error) {
    errors.push(`UMD bundle: ${failure(error)}`);
  }

  // A TypeScript consumer of every entry. Our declarations are checked strictly
  // (skipLibCheck: false) under nodenext, as ESM and as CommonJS. ember-source's own types do
  // not pass skipLibCheck: false, so "./ember" is checked from the consumer side only, under
  // bundler resolution.
  const usage = `
    const chart: LineChart | null = null;
    const options: LineChartOptions = { data: [{ x: 0, y: 1 }] };
    const make: typeof createChart = createChart;
    const component: unknown = CyberLineChart;
    export { chart, options, make, component };
  `;
  const imports = `import { createChart, LineChart, type LineChartOptions } from '${pkg.name}';
    import { CyberLineChart } from '${pkg.name}/react';`;
  writeFileSync(join(app, 'esm.mts'), `${imports}\n${usage}`);
  writeFileSync(
    join(app, 'cjs.cts'),
    `import core = require('${pkg.name}');
    import react = require('${pkg.name}/react');
    const { createChart, LineChart } = core;
    type LineChart = InstanceType<typeof LineChart>;
    type LineChartOptions = core.LineChartOptions;
    const { CyberLineChart } = react;
    ${usage}`
  );
  writeFileSync(
    join(app, 'bundler.ts'),
    `${imports}
    import { cyberChart } from '${pkg.name}/ember';
    export const modifier: unknown = cyberChart;
    ${usage}`
  );
  const compilerOptions = { strict: true, noEmit: true, lib: ['ES2022', 'DOM', 'DOM.Iterable'] };
  const tsconfigs = {
    nodenext: {
      compilerOptions: {
        ...compilerOptions,
        module: 'nodenext',
        moduleResolution: 'nodenext',
        skipLibCheck: false,
        types: [],
      },
      files: ['esm.mts', 'cjs.cts'],
    },
    bundler: {
      compilerOptions: {
        ...compilerOptions,
        module: 'preserve',
        moduleResolution: 'bundler',
        skipLibCheck: true,
        types: ['ember-source/types'],
      },
      files: ['bundler.ts'],
    },
  };
  for (const [name, config] of Object.entries(tsconfigs)) {
    writeFileSync(join(app, `tsconfig.${name}.json`), JSON.stringify(config));
    try {
      run(process.execPath, [tsc, '-p', `tsconfig.${name}.json`], app);
      console.log(`✓ a TypeScript consumer type-checks (${name})`);
    } catch (error) {
      errors.push(`TypeScript consumer (${name}):\n${failure(error)}`);
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error(`\n✗ package check failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  process.exit(1);
}
console.log('package check: ok');
