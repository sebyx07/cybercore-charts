# cybercore-charts

Zero-dependency SVG chart library with a cyberpunk look: line/area, bar, donut/pie, gauge, sparkline. TypeScript; React and Ember adapters; npm `cybercore-charts`, served by jsDelivr and unpkg (`CyberCharts` UMD global), demo at https://sebyx07.github.io/cybercore-charts/. Public repo, default branch `main`, maintained by the developerz.ai agent (`.dz/`). Companion: cybercore-css, whose tokens the charts read.

## Response rules

- Execute. No preamble. Lead with the action or the answer; disagree once, with the reason, when the request is wrong.
- Read the code before claiming anything about it. Report what you verified, never what you assume.
- Terse. Commands, paths, option and token names stay exact.

## Coding rules

- Smallest change that solves the problem correctly. No abstraction before its second caller, no dead code, no shims.
- Mirror the nearest existing chart before writing a new pattern.
- A new option, export or chart gets a test of what it does. A bug fix starts with the failing test.
- Red gate → fix the cause. Never an `eslint-disable`, `@ts-expect-error`, `any`, skipped test, raised size budget or removed guard to get to green.
- Outside contributors are welcome here: finish their pull request rather than redo it, keep their authorship, thank them by handle.

## Invariants (the product's promises)

1. **Zero runtime dependencies.** `dependencies` stays empty; React, Ember and `ember-modifier` are optional peers used only by `src/react/` and `src/ember/`. Scale, path, colour and formatting code lives in `src/utils/`. Guard: `bin/repo-guards`.
2. **SSR-safe.** Importing any entry touches no `window`, `document`, `matchMedia` or `ResizeObserver` (module scope, static initialisers, default parameters included) and has no side effect. Creating a chart without a DOM throws a readable "requires a DOM" error. Guard: `tests/ssr.test.ts`.
3. **Unique SVG ids per instance.** Every id in a chart's SVG comes from `this.ref(name)`, every reference from `this.url(name)`. A literal id makes two charts on a page share a gradient, filter or clip path.
4. **Accessible by default.** `<title>` and `<desc>` on the root (generated when not given), a hidden data table, one keyboard tab stop per chart with arrow-key navigation, no colour-only meaning, a series palette that survives colour blindness, no motion under `prefers-reduced-motion: reduce` or `[data-motion="reduce"]`, higher contrast under `prefers-contrast: more` or `[data-contrast="high"]`. Guard: `tests/a11y.test.ts`.
5. **Tokens from cybercore-css, with fallbacks.** Every colour and the font are `var(--token, fallback)` from `src/utils/theme.ts`: charts follow a cybercore-css theme live (scoped `[data-theme]` included) and render the same neon palette without it. The stylesheet (`src/styles/`) is optional. Guard: `tests/theme.test.ts`.
6. **Public API stability.** Exports of every entry, options and events in `src/types.ts`, public and protected class members (`BaseChart` is exported for subclassing), the `CyberCharts` global, `package.json` `exports`, `cyber-chart*` classes and custom properties: add, never rename, remove, narrow or make required; a default that redraws existing charts is a change too. Guard: `bin/api-diff`.
7. **Output is SVG, and data is text.** No canvas. Labels and tooltips from data are set as text, never parsed as HTML; colours from data pass `safeColor`.
8. **Size budget.** Gzipped ESM and UMD bundles stay under the budgets in `scripts/check-size.ts`.

Breaking 6, or raising the browser, Node or peer floor, is the owner's decision: stop and ask.

## The loop

| Tier | Command | Runs | When |
|---|---|---|---|
| tightest | `bin/check files <paths>` | eslint and prettier on those files, vitest on the tests that import them | after each edit; the only tier allowed when agents share the checkout |
| fast | `bin/check fast` | repo guards, lint, typecheck, unit tests | after a slice works |
| full | `bin/check` | repo guards, lint, format, typecheck, tests, build, size budget, package check (pack, install, import every entry), demo build, docs truth check. What CI's `check` job runs | once, before the PR |

Exit 0 green · **75 environment missing, nothing was graded** (run `bin/setup`, never "fix" the code) · anything else a check failed, and the last lines name the failing command and how to rerun it. Never trust a piped exit code (`bin/check | tail` reports `tail`). CI adds three jobs `bin/check` does not run: workflow lint, `npm audit`, visual regression (Docker).

## Commands

```bash
bin/setup                      # Node from .nvmrc (mise or nvm) + npm ci. Idempotent
bin/dev                        # demo site with hot reload, http://127.0.0.1:5173/cybercore-charts/
PORT=5199 bin/dev --detach     # background server for browser tools; bin/stop ends it
bin/check [fast|files <paths>] # the gate; --help lists each tier's steps
bin/api-diff [version]         # public API removed/changed/added vs the published package
bin/docs-check                 # README and llms.txt: snippets type-check against src/, named options exist
bin/repo-guards                # CI parity, agent-surface scan, CLAUDE.md size, package invariants
npm run build                  # dist/: ESM, CJS, .d.ts, UMD and UMD min
npx vitest run tests/charts.test.ts   # one file (-t "<name>" for one test)
npm run lint:fix && npm run format    # autofix
npm run build:demo && npm run test:visual   # screenshots vs baselines (Docker)
```

No `.env`, no services, no secrets: nothing to configure.

## Layout

```
src/types.ts            every option, data and event type: the public contract
src/index.ts            ESM/CJS entry (charts, createChart, helpers, VERSION)
src/cdn.ts              UMD entry: the CyberCharts global
src/charts/             BaseChart + LineChart, BarChart, DonutChart, GaugeChart, Sparkline
src/utils/              math, svg, theme (token map), colors, a11y, format, tooltip/resize/event managers
src/adapters/           chart-binding: the lifecycle both framework adapters drive
src/react/              Cyber* components and hooks → cybercore-charts/react
src/ember/              the cyberChart modifier → cybercore-charts/ember
src/styles/             optional stylesheet, shipped as SCSS → cybercore-charts/styles
dist/                   build output, NOT committed, built at release
tests/                  vitest: charts, behaviour, a11y, theme, ssr, utils, adapters, react, ember
tests/visual/           Playwright screenshots of the demo
demo/                   documentation site and playgrounds (React + Vite), GitHub Pages; not in the package
scripts/                build-types, check-size, check-package, visual.sh, changelog-notes.sh
bin/                    setup, dev, stop, check, repo-guards, api-diff, docs-check
docs/                   idea/ (intent, direction draft), standards/ (rule → guard)
.github/                ci.yml, release.yml, deploy.yml, dependabot, issue and PR forms
.dz/                    developerz.ai maintainer policy, reviewer prompt, scheduled briefs
llms.txt                API reference for AI tools that use the library
```

## Release

Merging a `package.json` version bump to `main` is the release: `release.yml` proves the commit, publishes to npm (trusted publishing), then tags and creates the GitHub release from `CHANGELOG.md`. The weekly `release-due` checkup opens that pull request; procedure: `RELEASE.md`. The demo deploys on every merge.

## Preventive rules (these bite before any symptom appears)

- **One chart in a test hides id collisions.** Render two instances and assert their ids differ whenever you add a gradient, filter, clip path or mask.
- **`role="img"` hides focusable children.** `updateAccessibility()` switches the root to `role="group"` when marks are focusable; do not set the role yourself.
- **Marks are registered, not wired.** Interaction is delegated on the root: call `addItem()` per mark instead of adding listeners, or keyboard users and `destroy()` both miss it.
- **A literal colour ignores the theme.** Use `themeColor`, `seriesColor`, `uiColors`; a new role gets a token with a fallback there, never a hex in a chart.
- **Edge data reaches the path string.** Empty, one point, equal values, zero total, `NaN`, `null`, `Infinity`: test the shape when you touch math, and assert the markup has no `NaN`.
- **Entry animation is requested, not assumed.** `requestEntryAnimation()` in `update()`, `takeEntryAnimation()` in `render()`, frames through `nextFrame()`; a raw `requestAnimationFrame` outlives `destroy()`.
- **Adapters hold no chart logic.** A new option reaches React through the wrapper's typed key list (a missing key fails the type check) and Ember through the modifier's options map.
- **A new chart is five registrations**: `src/index.ts` export, `createChart` and its three type maps, `src/cdn.ts`, the Ember modifier's maps, a React wrapper.
- **Versions move together.** `package.json`, `VERSION` in `src/index.ts`, and every `cybercore-charts@x.y.z` in `README.md` and `llms.txt` (guard: `bin/repo-guards`). The demo's CDN snippet and SRI hash come from `demo/src/data/cdn.json`, rewritten by `node demo/scripts/sync-cdn.mjs` after a release is on npm.
- **The tarball is checked, not trusted.** 0.1.0 to 0.2.0 were published without their ESM, CJS and type files. `npm run check:package` installs the packed tarball and imports every entry; never remove it from the gate.
- **Docs are part of the change.** An option, export or usage change updates `llms.txt`, `README.md` when a newcomer needs it, the demo, and `CHANGELOG.md` `## [Unreleased]`, in the same pull request. Snippets in both docs are type-checked by `bin/docs-check`: write real code, no `[...]` placeholders.
- **Agent-read files are code.** `CLAUDE.md`, `.claude/`, `.dz/`, `.mcp.json`, `llms.txt`: no HTML comments, no invisible characters; this file stays under 12,000 characters (`bin/repo-guards`).

## Never

- **No git worktrees.** No `git worktree add`, no `isolation: worktree`. One checkout; parallel agents get disjoint file sets, run only `bin/check files <their paths>`, and do no git at all. The coordinator owns git.
- **Stage by path.** `git add <paths>`, never `-A` or `.`. Never `git stash`, never force-push `main`.
- **Never publish or tag by hand.** No `npm publish`, `npm version` with a tag, `git tag`, `gh release create`. Release = merge the version bump. A published version is never republished.
- **Never commit `dist/`**, a secret, or an npm token (publishing is OIDC).
- **No runtime dependency, no required peer, no canvas, no network request** from the library.
- **No removed, renamed or retyped export, option, event or class member**, changed default or raised floor without the owner.
- **No weakened gate**: see Coding rules.

## PR conventions

Branch `<type>/<slug>` off `main`. Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`). One concern per PR; a `.github/` change never shares a PR with code; outside contributors' changes to `.github/`, `bin/`, `.dz/`, `.claude/` are owner-only. Visible change → before/after screenshots at 1440 and 390. User-visible change → a `CHANGELOG.md` `## [Unreleased]` line (credit contributors by handle). Required check: `CI OK` (verify the ruleset: `gh api repos/sebyx07/cybercore-charts/rulesets`). Skills: `verify-change`, `add-chart`. Commands: `/release`, `/bug-sweep`. Agent: `visual-a11y-reviewer`.

## Where to look (load on demand)

- Rendering rules (ids, SSR, accessibility, tokens, motion, data edge cases), extending `BaseChart` → `src/CLAUDE.md`
- Demo site: routes, playgrounds, snippet rules → `demo/CLAUDE.md`
- Workflows, pinning, release lane → `.github/CLAUDE.md`, `RELEASE.md`
- Maintainer policy, review rules, scheduled checkups → `.dz/README.md`
- Product intent and direction (draft) → `docs/idea/`, index `docs/README.md`
- What users are told: `README.md`, `llms.txt`, `CONTRIBUTING.md`
