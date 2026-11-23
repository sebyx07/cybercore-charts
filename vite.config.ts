// Library build, in three modes (`npm run build` runs them all; each writes into dist/):
//
//   vite build                  ESM + CJS for the core and the React adapter, ESM for the Ember
//                               adapter (Ember is ESM-only). Shared code lands in one chunk, so
//                               the adapters use the same chart classes as the core. Empties dist/.
//   vite build --mode umd       dist/cybercore-charts.umd.js, global `CyberCharts`, for <script>.
//   vite build --mode umd-min   the same, minified: the CDN file (`unpkg`/`jsdelivr` field).
//
// Declarations come from scripts/build-types.ts (rolldown-plugin-dts cannot bundle declarations
// inside a CJS output). The package has no runtime dependencies: react, react-dom, ember-source
// and ember-modifier are optional peers and never bundled.
import { resolve } from 'node:path';

import { defineConfig, type Plugin, type UserConfig } from 'vite';

const src = (path: string) => resolve(import.meta.dirname, 'src', path);

const PEERS = [/^react(\/|$)/, /^react-dom(\/|$)/, /^@ember\//, /^ember-modifier(\/|$)/];

// The Ember adapter is published as ESM only: drop its CommonJS entry chunk.
const esmOnlyEmber: Plugin = {
  name: 'cybercore:esm-only-ember',
  generateBundle(options, bundle) {
    if (options.format !== 'cjs') {
      return;
    }
    for (const fileName of Object.keys(bundle)) {
      if (fileName.startsWith('ember/')) {
        delete bundle[fileName];
      }
    }
  },
};

const library: UserConfig = {
  plugins: [esmOnlyEmber],
  build: {
    lib: {
      entry: {
        index: src('index.ts'),
        'react/index': src('react/index.ts'),
        'ember/index': src('ember/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entry) => {
        const ext = format === 'es' ? 'js' : 'cjs';
        if (entry === 'index') {
          return format === 'es' ? 'cybercore-charts.esm.js' : 'cybercore-charts.cjs';
        }
        return `${entry}.${ext}`;
      },
    },
    rolldownOptions: {
      external: PEERS,
      output: {
        exports: 'named',
        // Next.js App Router imports the React components from Server Components: the directive
        // marks the entry as a client boundary. Only the entry file, so the shared chunk stays neutral.
        banner: (chunk) => (chunk.isEntry && chunk.name === 'react/index' ? "'use client';" : ''),
      },
    },
    // Published unminified: readable as is, and consumers' bundlers map their own output.
    sourcemap: false,
    minify: false,
    target: 'es2022',
  },
};

const umd = (minified: boolean): UserConfig => ({
  build: {
    emptyOutDir: false,
    lib: {
      entry: src('cdn.ts'),
      name: 'CyberCharts',
      formats: ['umd'],
      fileName: () => `cybercore-charts.umd${minified ? '.min' : ''}.js`,
    },
    rolldownOptions: { output: { exports: 'default' } },
    // Only the minified CDN file needs a map to be debuggable.
    sourcemap: minified,
    minify: minified,
    target: 'es2020',
  },
});

export default defineConfig(({ mode }) => {
  switch (mode) {
    case 'umd':
      return umd(false);
    case 'umd-min':
      return umd(true);
    default:
      return library;
  }
});
