// Size budget: fails when a published bundle grows past its gzip budget. Run after
// `npm run build`.
//
//   npm run check:size
//
// - ESM: dist/cybercore-charts.esm.js plus every chunk it imports, i.e. what a bundler pulls
//   in for `import … from 'cybercore-charts'` before tree-shaking (unminified, as published).
// - UMD: dist/cybercore-charts.umd.min.js, the CDN file.
//
// Raising a budget is a deliberate, reviewed change to this file: say in the pull request what
// the extra bytes buy.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const DIST = resolve(import.meta.dirname, '../dist');
const BUDGETS = [
  { name: 'ESM', entry: 'cybercore-charts.esm.js', gzipBudget: 40 * 1024 },
  { name: 'UMD', entry: 'cybercore-charts.umd.min.js', gzipBudget: 22 * 1024 },
];

// Relative static imports of a built ES module: `from "./x.js"` and bare `import "./x.js"`.
const IMPORT = /(?:\bfrom|\bimport)\s*["'](\.{1,2}\/[^"']+)["']/g;

function moduleGraph(entry: string): string[] {
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) {
      return;
    }
    seen.add(file);
    for (const [, specifier] of readFileSync(file, 'utf8').matchAll(IMPORT)) {
      visit(resolve(dirname(file), specifier));
    }
  };
  visit(entry);
  return [...seen];
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
let failed = false;

for (const { name, entry, gzipBudget } of BUDGETS) {
  const file = resolve(DIST, entry);
  if (!existsSync(file)) {
    console.error(`✗ dist/${entry} is missing. Build it first: npm run build`);
    process.exit(1);
  }
  const files = entry.endsWith('.umd.min.js') ? [file] : moduleGraph(file);
  const code = Buffer.concat(files.map((f) => readFileSync(f)));
  const gzip = gzipSync(code, { level: 9 }).length;
  const brotli = brotliCompressSync(code, {
    params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY },
  }).length;

  console.log(
    `${name} (${files.map((f) => relative(DIST, f)).join(' + ')}): ${kb(code.length)} raw, ` +
      `${kb(gzip)} gzip, ${kb(brotli)} brotli ` +
      `(gzip budget ${kb(gzipBudget)}, ${Math.round((gzip / gzipBudget) * 100)}% used)`
  );
  if (gzip > gzipBudget) {
    failed = true;
    console.error(
      `✗ ${name} gzip size ${kb(gzip)} is over the ${kb(gzipBudget)} budget by ${kb(gzip - gzipBudget)}. ` +
        'Remove what the bytes are not worth, or raise the budget in scripts/check-size.ts ' +
        'and justify it in the pull request.'
    );
  }
}

if (failed) {
  process.exit(1);
}
