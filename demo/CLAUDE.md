# demo/ — the documentation site and playgrounds

React + Vite + TypeScript, deployed to GitHub Pages at https://sebyx07.github.io/cybercore-charts/ by `.github/workflows/deploy.yml` on every merge that touches `demo/` or `src/`. It is not part of the npm package: nothing here ships to users of the library.

The site exists to show the charts exactly as they ship, let people change options and data live, and hand them code they can paste.

## Commands

```bash
bin/dev                      # http://127.0.0.1:5173/cybercore-charts/ , hot reload (edits under src/ too)
PORT=5199 bin/dev --detach   # background, for browser tools; bin/stop ends it
CYBERCORE_CSS=../cybercore-css/dist/cybercore.css bin/dev   # try an unreleased cybercore-css build
npm run build:demo           # production build into demo/dist (one HTML file per route)
npm run preview              # serve demo/dist as Pages would
npm run build:demo && npm run test:visual          # screenshots against the baselines (Docker)
npm run build:demo && npm run test:visual:update   # accept an intended visual change
bin/check files demo/src/<file>                    # eslint + prettier + related tests for one file
```

## Routes

`/` (home), `/charts` (index), `/charts/line`, `/charts/bar`, `/charts/donut`, `/charts/gauge`, `/charts/sparkline` (playgrounds), `/dashboard`, `/docs`, all under the `/cybercore-charts/` base. Real paths (BrowserRouter), one prerendered HTML file each. Links of the old hash-routed site (`#/line-charts`) are redirected by `legacyPath` in `src/routes.ts`.

## Layout

```
index.html              shell; %SITE_…% placeholders are filled from src/site.ts at build time
vite.config.ts          base /cybercore-charts/ ; aliases @cybercore-charts → ../src and cybercore-css
vite/cybercore-css.ts   reads the cybercore-css build in use → virtual:cybercore-css (its themes)
vite/static-pages.ts    after the build: one index.html per route, 404.html, sitemap.xml, llms.txt
src/site.ts             THE source for everything people copy: URLs, install line, CDN snippet
src/routes.ts           the route table as data (titles, descriptions); app, prerender and sitemap share it
src/data/cdn.json       the published version and its SRI hash (written by scripts/sync-cdn.mjs)
src/data/snippets.ts    hand-written code samples of the home page and the docs
src/data/samples.ts     seeded sample data
src/playgrounds/        one definition per chart: its controls (option, default, help text) and data
src/lib/snippets.ts     turns a playground's current options into vanilla, React and Ember code
src/pages/              Home, ChartIndex, ChartPage (playground), Dashboard, Docs, NotFound, OgCard
src/components/         Layout, Controls, DataEditor, CodeTabs, ThemeSwitcher, TelemetryDeck, …
src/styles/site.scss    the site's own styles: `site-*` classes reading cybercore-css tokens
public/                 favicon, og.png (rendered by scripts/make-og.mjs), robots.txt
```

## Rules (these bite before any symptom appears)

- **Use the library as a user would.** Charts on the site are the public React components and classes, imported through the `@cybercore-charts` alias to `src/`. Never reach into a chart's internals or patch its output here: a demo-only fix hides the bug from everyone who installs the package.
- **A playground control is the option's documentation.** Each control in `src/playgrounds/` names a real option path, its real default and a help line; the options table and the generated code come from the same definition. A new library option gets a control in the same pull request, and a changed default changes here too.
- **Generated code must run as shown.** `src/lib/snippets.ts` prints vanilla, React and Ember versions from the live options. Hand-written samples live in `src/data/snippets.ts`. Either kind uses only exports and options that exist; the same facts are in `README.md` and `llms.txt`, where `bin/docs-check` type-checks them.
- **Copyable facts come from `src/site.ts`.** Never type a CDN URL, a version or an SRI hash into a page. After a release reaches npm, `node demo/scripts/sync-cdn.mjs` rewrites `src/data/cdn.json`; a hand-edited hash makes browsers refuse the script on every page that pasted the snippet.
- **The chrome is cybercore-css as published.** It is a devDependency, imported unmodified. Site styles are `site-*` classes that read its tokens; never define or patch a `cyber-*` class here. The theme switcher sets `data-theme` on `<html>`, and the charts follow because they read the same tokens: do not pass colours to charts to "match" the theme.
- **Every chart on the site has an `ariaLabel`** that says what it shows, and every control has a label. People copy these.
- **Live data respects reduced motion.** The feeds are seeded and paused under `prefers-reduced-motion`, which is also what keeps the visual tests deterministic. Do not add unseeded randomness or timers that ignore it.
- **Routes are declared once.** Add a page to `src/routes.ts`; the prerender, the sitemap and the document title follow. Links go through the router so the base path is applied.
- **A new or changed page changes a screenshot.** `tests/visual/charts.spec.ts` shoots every page; an intended change needs its baseline re-rendered in the pinned image (`npm run test:visual:update`) in the same pull request, and the pull request says so. A cybercore-css bump restyles every page: re-render then too.
- **React is fine here, and only here.** Keep it light: no state library, no CSS-in-JS, no component kit.

## Checks before a pull request

`bin/check` covers lint, types and the demo build. Then look at it: 1440 and 390 wide, keyboard through the changed page, `prefers-reduced-motion` emulated; the `visual-a11y-reviewer` agent does this pass. The README screenshots (`assets/hero.png`, `assets/dashboard.png`) are captures of `/` and `/dashboard` at 1440 wide: retake them when those pages change visibly.
