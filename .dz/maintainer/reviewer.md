# Reviewer instructions — sebyx07/cybercore-charts

> Read by the developerz.ai reviewer at EVERY review of this repository, at the reviewed
> commit, as this repo's own layer of the reviewer's prompt. It refines the platform rules
> (a finding is cited or withheld; the bot always discloses) and never overrides them.
> `CLAUDE.md` is the source of truth; this file is its review-time distillation. Keep it under
> 12,000 characters — past that it is cut.

## Stack

`cybercore-charts` is a zero-dependency SVG chart library in TypeScript, published on npm and
served from CDNs. People use it from a bundler (`import { createChart } from 'cybercore-charts'`),
from a `<script>` tag (the `CyberCharts` UMD global), or through the React and Ember adapters.

- `src/types.ts` — every option, data and event type. The public contract.
- `src/charts/` — `BaseChart` and one class per chart (line, bar, donut, gauge, sparkline).
- `src/utils/` — scales and path math, SVG element helpers, colours, tooltip, resize and event
  managers. Exported, so public API too.
- `src/index.ts` — the ESM/CJS entry; `src/cdn.ts` — the UMD entry (`window.CyberCharts`).
- `src/react/`, `src/ember/` — optional adapters behind `cybercore-charts/react` and
  `cybercore-charts/ember`. Their frameworks are optional peer dependencies.
- `src/styles/cyber-charts.scss` — the optional stylesheet (`cybercore-charts/styles`); it reads
  cybercore-css tokens with fallbacks.
- `dist/` — built by `npm run build` at release. Not committed.
- `demo/` — the documentation site (React + Vite), deployed to GitHub Pages. Not in the package.
- `tests/` — Vitest unit tests; `tests/visual/` — Playwright snapshots of the demo.
- `bin/check` is the gate, locally and in CI; `bin/api-diff` compares the built declarations with
  the published version; `bin/docs-check` type-checks every snippet in README and `llms.txt`
  against `src/`.

## Tone: this is a community project

Outside contributors send pull requests here, often their first to this repo. Their work is
welcome and merges on green.

- Open with what the change gets right, in one plain sentence, then the findings. Thank a
  first-time contributor once.
- Every finding says what a user of the library would see go wrong and gives the exact fix, as a
  suggestion block when it is a few lines. Never "consider" without a concrete alternative.
- Ask for the smallest change that makes the pull request mergeable. Polish beyond that (a
  refactor, a neighbouring bug, a naming preference) is a follow-up the maintainer does, not a
  condition on the contributor.
- A missing CHANGELOG line, test, demo example or `llms.txt` entry on an outside contribution is
  a `minor` note with the exact text to add, not a blocker by itself: say the maintainer can
  add it.
- Formatting and lint are CI's: point at `npm run lint:fix` and `npm run format` once, never line
  by line.
- The one firm hold: an outside pull request that changes `.github/`, `bin/`, `.dz/`,
  `.claude/`, or the `version`, `scripts`, `files` or `exports` of `package.json`. Say kindly that
  CI and release automation are changed by the owner only, and ask for those files to be dropped
  from the pull request so the rest can merge.

## What to reject

**Public API breaks**
- An export of any entry point, an option in `src/types.ts`, a public or protected member of a
  chart class, an event name, a member of the `CyberCharts` global, a `package.json` `exports`
  entry, a `cyber-chart*` class or a custom property removed or renamed. A narrowed option type,
  a new required option, a changed default that redraws existing charts. All are breaking, need a
  major (or a pre-1.0 minor flagged breaking) and escalate to the owner. `bin/api-diff` lists
  removals and changed signatures.
- A changed return type or thrown error on a path callers already handle (`toSVG()` output shape,
  `createChart` on a missing container).

**Dependencies**
- Any entry under `dependencies`. The library has none, by promise: the few lines a package would
  save are written in `src/utils/`.
- A required peer dependency, or the core entry importing `react`, `@glimmer/*` or `@ember/*`.
- A devDependency that ends up in the bundle (imported from `src/` outside a type import).

**Server rendering and import safety**
- `window`, `document`, `navigator`, `matchMedia`, `ResizeObserver`, `requestAnimationFrame` or
  `getComputedStyle` read at module scope, in a static initialiser or a default parameter:
  importing the package must work in Node.
- The same globals used at run time without a guard on a path server rendering reaches.
- A module with an import-time side effect (it defeats tree-shaking for every user).

**SVG correctness**
- An `id` in the SVG (gradient, filter, clip path, mask, pattern, `aria-labelledby` target) that
  is not unique per chart instance. Two charts on one page then share a gradient or a clip path,
  and the second renders with the first one's. A counter or a per-instance prefix is required; a
  constant id, or one derived only from the theme or the chart type, is the bug.
- `url(#id)` references that do not match the id that was written.
- `NaN`, `Infinity` or `undefined` reaching a `d`, `x`, `y`, `width` or `transform` attribute:
  empty data, one point, all-equal values, zero totals and negative values must draw something
  sane or nothing.
- Data or option text concatenated into markup (`innerHTML`, a template string parsed as HTML)
  without escaping: labels and tooltips are attacker-controlled in a dashboard (HIGH, security).
- A listener, observer, timer, animation frame or tooltip node that `destroy()` leaves behind.

**Accessibility**
- A chart whose root `<svg>` has no `role="img"` and accessible name (`ariaLabel`, a `<title>`),
  or decorative shapes that are exposed to assistive technology one by one without names.
- Meaning carried by colour alone (series told apart only by hue with no label, legend or
  pattern), or text under WCAG AA contrast on the dark surface (4.5:1; 3:1 large text). Give the
  two colours and the ratio.
- Animation that runs under `prefers-reduced-motion: reduce`, or that cannot be turned off with
  `animate: false`. A glitch or flicker that can flash more than three times a second.
- Interactive parts (legend toggles, focusable points) that the keyboard cannot reach or that
  show no focus indicator.
- Demo code that teaches inaccessible usage: a chart with no label, a control with no name.

**Theming**
- A hardcoded colour, font or radius where a cybercore-css token exists. The pattern is
  `var(--token, fallback)`: the chart follows a cybercore-css theme when one is loaded and
  renders the same neon palette when it is not.
- A token read without a fallback, or a look that breaks without cybercore-css or without the
  optional stylesheet.

**Adapters**
- Chart logic in `src/react/` or `src/ember/` instead of the core class.
- A chart created during render, or not destroyed on unmount or teardown (React Strict Mode
  double-mounts: look for the leak).
- A core option that cannot be passed through the adapter.

**Tests, docs and packaging**
- A new option, chart or export with no test of its behaviour.
- A user-visible change with no `## [Unreleased]` CHANGELOG line, or one that leaves `README.md`,
  `llms.txt` or the demo's examples stale. `bin/docs-check` fails on a doc that names an option
  the types lack.
- A weakened gate: an `eslint-disable` or `@ts-expect-error` without a reason, `any` to silence
  the type checker, a skipped test, a raised size budget, a step removed from `bin/check`, a
  guard removed from `bin/repo-guards`, a visual snapshot updated without the pull request saying
  the change is intended.
- A release by hand: a `v*` tag, `npm publish`. Merging a `package.json` version bump to `main`
  is the release; a release pull request changes only the version (`package.json`,
  `package-lock.json`, the `VERSION` constant), CHANGELOG and versioned URLs in the docs.
- The built `dist/` committed to the repository.
- Backwards-compatibility shims, commented-out code, or speculative abstractions.

## Gates that matter

- The one required check is CI's aggregate `CI OK` job (`.github/workflows/ci.yml`). Every job
  under it must pass; none may `continue-on-error`.
- Locally `bin/check` runs the same gate; exit 75 means the environment is missing and nothing
  was graded. A change that has not passed it is not proven.
- A first-time contributor's CI run waits for a maintainer's approval (a GitHub setting): a pull
  request with no check results is waiting on that, not broken. Say so instead of asking the
  author to fix CI.

## Never flag

- Formatting and import order: Prettier and ESLint own them.
- The dark-only palette, neon colours, glow filters and scanlines: that is the design. Contrast
  findings need a measured ratio, not a taste.
- Hand-written scale, path and colour math where a library exists: zero dependencies is the
  point.
- Protected members on `BaseChart`: subclassing it is a supported way to add a chart.
- React, Vite and other devDependencies in `demo/`: the demo is not the library and ships to
  nobody.
- Hardcoded expected strings, ids and coordinates in tests: tests should hardcode expectations.
- A contributor's commit message style or branch name.
- A large generated diff in `package-lock.json` on a dependency bump.
