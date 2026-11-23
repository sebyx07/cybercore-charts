# Hygiene checkup

Weekly checkup, Sundays 13:00 UTC, OFFERED and off: the `hygiene` entry in
`.dz/maintainer/maintainer.yml` is commented out, and uncommenting it is the opt-in. It is the
developerz.ai platform's standard hygiene checkup, adapted to a zero-dependency SVG chart library:
a deep read for the defects tests never show. A read-only scout: you read files only, no shell,
network or database, so a finding whose harm depends on a size you cannot see (gzipped bytes in a
bundle, the cost of drawing 10,000 points) is marked `measure first: yes`, never guessed. Read
`CLAUDE.md` and `src/CLAUDE.md` first: their invariants define what a defect is here.

## What to look for

1. **Leaks.** Something a chart creates that `destroy()` does not release: a listener outside the
   delegated root, a `ResizeObserver`, a timer, a raw `requestAnimationFrame` (frames go through
   `nextFrame()`), a tooltip or data-table node; an adapter that leaves a chart alive after
   unmount or teardown.
2. **Import safety.** `window`, `document`, `matchMedia`, `ResizeObserver` or
   `requestAnimationFrame` reached at module scope, in a static initialiser or in a default
   parameter; an import-time side effect; the core entry importing `react`, `@glimmer/*`,
   `@ember/*` or `ember-modifier`.
3. **Ids and tokens.** A literal id in SVG markup, or one not built with `this.ref()` and read
   with `this.url()`; a literal colour, font or radius in a chart where `themeColor`,
   `seriesColor` or `uiColors` has the token; a `var(--token)` with no fallback.
4. **Access and motion.** A data mark not registered with `addItem()`; a chart whose
   `getTableData()` misses a series; meaning carried by colour alone; text from data set as
   markup; animation that does not go through `shouldAnimate()`; a decorative layer without
   `aria-hidden="true"`.
5. **Math and data edges.** A scale, tick or path helper in `src/utils/math.ts` that divides by a
   range that can be zero, or lets `NaN`, `null` or `Infinity` reach a `d`, `x`, `y`, `width` or
   `transform`; work repeated per point that could be done once per render.
6. **Reuse.** A chart re-implementing what `BaseChart` or `src/utils/` already has (an SVG
   builder, a formatter, a legend, effect definitions); chart logic in `src/react/` or
   `src/ember/` that belongs in `src/adapters/chart-binding.ts`. Name both the copy and the
   original.
7. **Documentation drift.** In `README.md`, `llms.txt`, `docs/`, `CLAUDE.md`, `CONTRIBUTING.md`
   and the demo's data files: a path that no longer exists, a command naming a script the
   repository does not define, an option, export or default the sources no longer have. Quote both
   the doc line and the source.
8. **Code quality.** A file far beyond the others' size; dead code (an export nothing documents
   or tests, a helper with no caller, a script nothing runs).

## Rows

One per area above; a handoff reports one failing row.

- `leak`: leaks
- `import-safety`: import safety
- `ids-tokens`: ids and tokens
- `access-motion`: access and motion
- `math-edges`: math and data edges
- `reuse`: reuse
- `doc-drift`: documentation drift
- `quality`: code quality

## How to judge

- Confirm before you claim: read the chart and the base-class method it calls. A pattern is a
  finding only once you have seen that the code path runs.
- Rank by blast radius: what breaks users' pages first (a crash on import or on edge data, a
  shared id, a leak, a doc naming an option that does not exist), reuse and quality last.
- Skip tests, fixtures, generated files, `dist/`, `demo/dist/` and `node_modules/`. Skip CI
  configuration and `.dz/`: a handoff naming one is refused whole.
- One handoff per row: every defect in an area goes in it, worst first.
- A finding whose fix would remove, rename or retype an export, an option, an event, a class
  member, a `cyber-chart*` class or a custom property, or change a default, is breaking: report
  it, do not file it.

## Every finding

Besides the checkup rules' fields, each handoff carries these; one over any limit is dropped whole:

- **work**: one sentence naming the defect and the fix, at most 300 characters.
- **why**: a concrete failure scenario, what triggers it and what breaks, at most 300 characters.
- **evidence**: at most 10 lines of at most 280 characters each. Up to 8 lines `path:line: the
  code`, one per site; with more sites, a 9th line "and N more sites like it in <directories>".
  The last line starts `measure first:`, `no` with the reason or `yes` with what to measure and
  how (`npm run build`, then `npm run check:size`).
- **paths**: at most 20 files.
- **anchor**: the row id, then the worst file or symbol, at most 120 characters.
- **metric**: the number the fix moves, at most 200 characters.

## Report

For each of the eight areas: what you read and whether it was clean. Name any area you could not
cover, and why.
