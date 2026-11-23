// Bundles the TypeScript declarations for every package entry (rolldown-plugin-dts, tsc
// generator): one self-contained declaration tree per module format, so `import` and
// `require` consumers each get types in their own module kind under any moduleResolution.
//
//   node scripts/build-types.ts      (part of `npm run build:lib`)
//
// dist/index.d.ts, dist/react/index.d.ts, dist/ember/index.d.ts   ESM ("import" condition)
// dist/index.d.cts, dist/react/index.d.cts                        CJS ("require" condition)
import { resolve } from 'node:path';

import { build } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');

interface Target {
  input: Record<string, string>;
  tsconfig: string;
  extension: 'd.ts' | 'd.cts';
}

const core = { index: 'src/index.ts', 'react/index': 'src/react/index.ts' };
const targets: Target[] = [
  // tsconfig.ember.json adds the @ember/* types; one build, so all three entries share a chunk.
  {
    input: { ...core, 'ember/index': 'src/ember/index.ts' },
    tsconfig: 'tsconfig.ember.json',
    extension: 'd.ts',
  },
  // "./ember" is ESM only.
  { input: core, tsconfig: 'tsconfig.json', extension: 'd.cts' },
];

for (const { input, tsconfig, extension } of targets) {
  await build({
    cwd: ROOT,
    input: Object.fromEntries(
      Object.entries(input).map(([name, file]) => [name, resolve(ROOT, file)])
    ),
    external: [/^react(\/|$)/, /^react-dom(\/|$)/, /^@ember\//, /^ember-modifier(\/|$)/],
    plugins: [dts({ dtsOnly: true, tsconfig: resolve(ROOT, tsconfig) })],
    output: {
      dir: DIST,
      format: 'es',
      entryFileNames: `[name].${extension}`,
      chunkFileNames: `_types/[name]-[hash].${extension}`,
    },
    logLevel: 'warn',
  });
  console.log(
    `✓ ${Object.keys(input)
      .map((name) => `dist/${name}.${extension}`)
      .join(', ')}`
  );
}
