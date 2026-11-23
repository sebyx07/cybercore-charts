---
name: add-chart
description: Use when adding a chart type, an option, an event, an exported helper or an adapter prop to cybercore-charts, or when a contributor's pull request adds one and needs finishing (types, test, adapters, demo, docs, changelog).
---

# Add a chart, an option, an event or an export

Read `src/CLAUDE.md` first (rendering rules, ids, server safety, accessibility, tokens): it holds the rules this checklist only points at. Mirror the nearest existing chart before writing a new pattern.

A name is public API from the release that ships it: an option, an export, an event, a class, a custom property. Choose it once.

## The places a change lives

| # | What | Where |
|---|---|---|
| 1 | The type: an optional option with a TSDoc line stating its default | `src/types.ts` |
| 2 | The behaviour | `src/charts/<Chart>.ts` (shared code in `src/charts/BaseChart.ts` or `src/utils/` only at its second caller) |
| 3 | The export, for a new chart, type or helper | `src/index.ts`; for a chart also `createChart` and its type maps, and `src/cdn.ts` (the `CyberCharts` global) |
| 4 | The adapters: the option reaches the core as a prop and as an `@arg` | `src/react/`, `src/ember/` |
| 5 | A test of what it does | `tests/` (mirror the nearest test of the same chart) |
| 6 | A runnable example | the demo, `demo/src/` (read `demo/CLAUDE.md`) |
| 7 | The reference for people and for AI tools | `README.md` when it changes what a newcomer needs; always `llms.txt` |
| 8 | The changelog | `CHANGELOG.md`, under `## [Unreleased]` → `### Added` |

## Rules of the change itself

1. **Additive.** A new option is optional and its default draws exactly what the chart drew before. A new required option, a renamed option or a changed default is breaking: stop and ask.
2. **No dependency.** Scale, path, colour and easing math lives in `src/utils/`. Write the few lines.
3. **Import-safe.** No `window`, `document`, `matchMedia` or `ResizeObserver` at module scope; guard them at run time on any path `toSVG()` or server rendering reaches.
4. **Ids are per instance.** Every gradient, filter, clip path or mask id comes from the chart's own id source, never a constant, and its `url(#…)` reference uses the same value.
5. **Accessible.** The root `<svg>` keeps `role="img"` and its name; a new visual element that carries information has a text equivalent (a label, the tooltip, the summary), and colour is never the only difference between two series.
6. **Themed.** Colours come from the theme helpers and `var(--token, fallback)`; no literal that a cybercore-css theme should have changed.
7. **Motion.** Anything animated is skipped when `animate` is false and under `prefers-reduced-motion: reduce`, and the final state is drawn at once.
8. **Cleans up.** Whatever the option adds (a listener, a timer, an observer, a DOM node) is removed in `destroy()`.
9. **Edge data.** Empty array, one point, all-equal values, negatives, a zero total: no exception, no `NaN` in the markup. Put these in the test.

## Prove it

```bash
bin/check files src/types.ts src/charts/<Chart>.ts tests/<file>.test.ts
bin/api-diff            # the new names under "added", nothing removed, changed or newly required
bin/docs-check          # README and llms.txt name only what exists, and their snippets type-check
bin/check               # before the pull request
```

Then look at it, on a page with more than one chart: the `verify-change` skill, § What the unit suite cannot see.
