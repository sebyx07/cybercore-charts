---
description: Sweep one area of cybercore-charts for defects — run the detectors below, fix each with a failing test first, ship one goal-scoped pull request. Use for bug sweep, find bugs, fix everything in, QA pass.
argument-hint: <the area or goal to sweep, e.g. "donut" or "tooltips">
---

Sweep `$ARGUMENTS` for defects. A clean area reported clean is a success: never invent a defect to have something to ship, never fix what is not broken. Read `CLAUDE.md` and `src/CLAUDE.md` first; their invariants bind every fix.

## Steps

1. Read the area (the chart or helper, `BaseChart` methods it calls, its adapters, its demo playground), then run each detector below over it. Read the code that does the thing, not only a file that mentions it.
2. For each defect: write the failing test first (vitest, in the matching file under `tests/`) and watch it fail, then fix the cause.
3. A defect class that recurred is fixed as a class: a lint rule, a test or a guard that makes the next one fail, in the same change.
4. Prove it with `bin/check` (exit 75 = environment missing, run `bin/setup`). Visible changes also get `npm run build:demo && npm run test:visual` and before/after screenshots at 1440 and 390 (the `verify-change` skill). Red is not a pull request: fix the cause, never silence the check.
5. Ship one goal-scoped pull request for the area, every defect in it with its test, and a `CHANGELOG.md` `## [Unreleased]` line for what users see. A defect outside the area is its own pull request, named in the body.
6. The body lists each defect: the options and data that broke it, the test that pins it, the fix.

A fix that removes, renames or retypes an export, option, event or class member, changes a default, adds a runtime dependency or raises a browser, Node or peer floor is breaking: report it and stop for the owner.

## What to hunt — run the detector, do not just read

| Class | Detector |
| --- | --- |
| Edge data reaches the markup | render with `[]`, one point, all-equal values, a zero total, `NaN`, `null`, `Infinity`; assert the SVG has no `NaN` and nothing throws |
| Ids shared between instances | render two charts in one document; every `id` differs and every `url(#…)` resolves inside its own SVG |
| Import touches the DOM | `npx vitest run tests/ssr.test.ts`, then read module scope, static initialisers and default parameters of the area |
| `destroy()` leaves something behind | create, interact, resize, destroy; count listeners, observers, queued frames and nodes left in the container and the body |
| Mark the keyboard cannot reach | Tab into the chart, arrow through it; a mark drawn without `addItem()` is skipped, and its tooltip never opens |
| No text alternative | the root's `<title>` and `<desc>`, the hidden data table rows against the data, a gauge's `role="meter"` values |
| Colour that ignores the theme | grep the area for a hex, `rgb(` or font literal outside `src/utils/colors.ts`; set `data-theme` on an ancestor and look |
| Motion that ignores the preference | emulate `prefers-reduced-motion: reduce` and `[data-motion="reduce"]`; the final state draws at once |
| Data parsed as markup | a label, tooltip or series name containing `<img onerror>`; it appears as text; a colour from data passes `safeColor` |
| Option an adapter cannot reach | the React wrapper's typed key list and the Ember modifier's options map against the chart's options type |
| Breaks at 390 px | the playground at 390 wide: clipped labels, a legend over the plot, text outside the SVG |
| A doc, example or `llms.txt` line the code no longer matches | `bin/docs-check`, then read the sentence against `src/types.ts` |
| Public API changed by accident | `bin/api-diff` |
| Guard that proves nothing | break the guarded thing; if the test stays green, the test is the bug |
| Missing test | an option, export or event the area ships that no test exercises |
