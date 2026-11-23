import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { ROUTES } from './src/routes.ts';
import { FONTS_HREF, SITE_NAME, SITE_URL } from './src/site.ts';
import { cybercoreCss } from './vite/cybercore-css.ts';
import { staticPages } from './vite/static-pages.ts';

const root = import.meta.dirname;

// The site's chrome is cybercore-css as published on npm. CYBERCORE_CSS points
// the build at another stylesheet instead, to try an unreleased build:
//   CYBERCORE_CSS=../cybercore-css/dist/cybercore.css npm run dev:demo
const cybercoreCssPath = process.env.CYBERCORE_CSS
  ? resolve(process.cwd(), process.env.CYBERCORE_CSS)
  : fileURLToPath(import.meta.resolve('cybercore-css'));

export default defineConfig({
  plugins: [
    react(),
    cybercoreCss(cybercoreCssPath),
    staticPages({
      siteName: SITE_NAME,
      siteUrl: SITE_URL,
      fontsHref: FONTS_HREF,
      routes: ROUTES,
      llmsPath: resolve(root, '../llms.txt'),
    }),
  ],
  root,
  base: '/cybercore-charts/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: [
      { find: '@cybercore-charts', replacement: resolve(root, '../src') },
      { find: /^cybercore-css$/, replacement: cybercoreCssPath },
    ],
  },
});
