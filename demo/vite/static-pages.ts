import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import type { RouteMeta } from '../src/routes.ts';
import type { Plugin } from 'vite';

/**
 * GitHub Pages serves files, not routes.
 *
 * In every build mode this fills the `%SITE_…%` placeholders of index.html
 * from src/site.ts. After a production build it also writes one index.html
 * per route, each with its own title, description, canonical URL and social
 * tags, plus 404.html (the app shell, so unknown paths still reach the in-app
 * not-found page), sitemap.xml and a copy of the repository's llms.txt.
 */

export interface SiteData {
  siteName: string;
  siteUrl: string;
  fontsHref: string;
  routes: RouteMeta[];
  /** The repository's llms.txt, published next to the pages when it exists. */
  llmsPath: string;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function pageUrl(siteUrl: string, path: string): string {
  return path === '/' ? `${siteUrl}/` : `${siteUrl}${path}/`;
}

function withMeta(html: string, route: RouteMeta, siteUrl: string): string {
  const title = escapeAttribute(route.title);
  const description = escapeAttribute(route.description);
  const url = pageUrl(siteUrl, route.path);
  const content = (name: string) =>
    new RegExp(`(<meta\\s+(?:name|property)="${name}"\\s+content=")[^"]*(")`);

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(content('description'), `$1${description}$2`)
    .replace(content('og:title'), `$1${title}$2`)
    .replace(content('og:description'), `$1${description}$2`)
    .replace(content('og:url'), `$1${url}$2`)
    .replace(content('twitter:title'), `$1${title}$2`)
    .replace(content('twitter:description'), `$1${description}$2`)
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${url}$2`);
}

function sitemap(routes: RouteMeta[], siteUrl: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes
    .map(
      (route) =>
        `  <url>\n    <loc>${pageUrl(siteUrl, route.path)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function staticPages(site: SiteData): Plugin {
  let outDir = '';
  let isBuild = false;

  return {
    name: 'cybercore-static-pages',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
      isBuild = config.command === 'build';
    },
    transformIndexHtml(html) {
      const home = site.routes.find((route) => route.path === '/');
      if (!home) {
        throw new Error('routes.ts has no "/" route to fill index.html from');
      }
      return html
        .replaceAll('%SITE_URL%', site.siteUrl)
        .replaceAll('%SITE_NAME%', escapeAttribute(site.siteName))
        .replaceAll('%SITE_TITLE%', escapeAttribute(home.title))
        .replaceAll('%SITE_DESCRIPTION%', escapeAttribute(home.description))
        .replaceAll('%FONTS_HREF%', escapeAttribute(site.fontsHref));
    },
    closeBundle() {
      if (!isBuild) {
        return;
      }
      const shell = readFileSync(resolve(outDir, 'index.html'), 'utf8');

      for (const route of site.routes) {
        if (route.path === '/') {
          continue;
        }
        const file = resolve(outDir, `.${route.path}`, 'index.html');
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, withMeta(shell, route, site.siteUrl));
      }

      const notFound = shell
        .replace(/<title>[^<]*<\/title>/, `<title>Page not found | ${site.siteName}</title>`)
        .replace(/(<meta\s+name="robots"\s+content=")[^"]*(")/, '$1noindex$2');
      writeFileSync(resolve(outDir, '404.html'), notFound);
      writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap(site.routes, site.siteUrl));
      if (existsSync(site.llmsPath)) {
        // llm.txt is the address the previous site used; llms.txt is the convention.
        copyFileSync(site.llmsPath, resolve(outDir, 'llms.txt'));
        copyFileSync(site.llmsPath, resolve(outDir, 'llm.txt'));
      }
    },
  };
}
