# Contributing to CYBERCORE CHARTS

Bug reports, ideas and pull requests are welcome, including small ones: a
one-line fix to a path calculation is a real contribution. AI-assisted
contributions are welcome too; the same checks apply.

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md). Security
problems go to [SECURITY.md](SECURITY.md), not to a public issue.

## Setup

You need Node (the version in `.nvmrc`, or newer) and npm.

```bash
git clone https://github.com/YOUR_USERNAME/cybercore-charts.git
cd cybercore-charts
bin/setup          # installs dependencies (npm ci)
bin/dev            # demo site with hot reload: http://127.0.0.1:5173/cybercore-charts/
```

Edit a file under `src/` and the demo updates at once.

## Before you open a pull request

```bash
bin/check          # the same gate CI runs: guards, lint, formatting, types, tests, build, docs
```

`bin/check fast` is the quick version while you iterate, and `bin/check --help`
lists what each mode runs. If something fails, the last lines name the failing
command and how to rerun only that step. `npm run lint:fix` and `npm run format`
fix most style complaints for you. Exit code 75 means your environment is
missing something (run `bin/setup`), not that your change is wrong.

Prefer plain npm? `npm ci`, then `npm run lint && npm test && npm run build`
covers most of it.

Stuck on a failing check you cannot make sense of? Open the pull request anyway
as a draft and say where you are stuck. The maintainer can help finish it.

## What a good change looks like

The full rules, with the reasons, are in [`src/CLAUDE.md`](src/CLAUDE.md). The
short version:

1. **Zero runtime dependencies.** The package installs nothing. Scale, path and
   colour math lives in `src/utils/`; write the few lines instead of adding a
   package.
2. **SVG only, safe to import anywhere.** Charts draw SVG, no canvas. Nothing
   touches `window` or `document` when the package is imported, so it loads in
   Node and during server rendering.
3. **Names are forever.** An export, an option, an event name, a `cyber-chart`
   class or a custom property that has shipped is public API: add new ones, do
   not rename or remove existing ones. A new option is optional, and its default
   keeps existing charts unchanged. `bin/api-diff` shows what a change adds,
   removes or retypes against the published package.
4. **Unique ids.** Every `id` a chart writes into its SVG (gradients, filters,
   clip paths) is unique to that chart instance, so two charts on a page never
   share one. Try your change on a page with several charts.
5. **Accessible by default.** A chart keeps its `role="img"` and accessible
   name, never relies on colour alone, and draws its final state at once under
   `prefers-reduced-motion: reduce`.
6. **Themed through tokens.** Colours come from the theme and from
   `var(--token, fallback)`, so charts follow a
   [cybercore-css](https://github.com/sebyx07/cybercore-css) theme when it is
   loaded and look the same without it.
7. **Cleans up.** Whatever a chart creates (listeners, observers, timers,
   tooltip elements) is removed by `destroy()`.

For a new option, chart or export, also add:

- a test in `tests/` of what it does (empty data, a single point and equal
  values included),
- the prop in the React and Ember adapters (`src/react/`, `src/ember/`),
- an example in the demo (`demo/src/`),
- a line in [`llms.txt`](llms.txt) (the reference AI tools read),
- a line under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md).

Missing one of these on a first contribution is fine: say so and the maintainer
adds it.

Code samples in `README.md` and `llms.txt` are type-checked against the sources
by `bin/docs-check`, so write them as real code (`data: sales`, not
`data: [...]`).

## Adding a chart type

A chart is a class that extends the exported `BaseChart`. The base class owns
the container, the SVG root, per-instance ids, events, keyboard access, the
accessible name and data table, the tooltip, resizing and cleanup; your class
draws. In short:

1. In the constructor: `super(container, options, { width, height })`, then
   `createRoot()`, `createDefinitions()`, `render()` and `syncResponsive()`.
2. In `render()`: draw into the chart area, register every data mark with
   `addItem({ element, label, enter, leave, activate })` (that is what makes it
   reachable by keyboard and gives it a tooltip through
   `showTooltip(content, anchor, event)`), and finish with
   `updateAccessibility(name, summary)`.
3. Build every id with `this.ref(name)` and reference it with `this.url(name)`.
4. Return the data as rows from `getTableData()` for the screen-reader table.
5. Register the chart: export it from `src/index.ts`, add it to `createChart`
   and its type maps, to `src/cdn.ts`, to the Ember modifier's maps, and give it
   a React wrapper.

The full description, with the reasons, is in [`src/CLAUDE.md`](src/CLAUDE.md);
`src/charts/GaugeChart.ts` is a compact example. Charts written against 0.2.0's
`BaseChart` (`createTooltip`, `setupResponsive`, `showTooltip(content, x, y)`)
need the changes listed in the [changelog](CHANGELOG.md).

## Pull requests

1. Branch from `main`; one concern per pull request.
2. Commit messages follow
   [Conventional Commits](https://www.conventionalcommits.org) where you can
   (`fix: clamp the gauge needle`, `feat: add stacked bars`). It is not a reason
   to reject a pull request.
3. For a visible change, add a before/after screenshot.
4. Keep it a draft until it is ready for review.

## How pull requests get merged

This repository is maintained by [developerz.ai](https://developerz.ai). Its
agent reviews every pull request, may ask for changes, and merges every pull
request (contributors, members, bots) once you mark it ready for review and the
`CI OK` check passes. The policy is in
[`.dz/maintainer/maintainer.yml`](.dz/maintainer/maintainer.yml). Good to know:

- On your first pull request, GitHub waits for a maintainer to approve the CI
  run. No check results yet means it is waiting for that, not that something is
  broken.
- Commit with an email linked to your GitHub account so the contribution is
  credited to you.
- Changes to CI, release and publishing automation (`.github/`, `bin/`, `.dz/`,
  `.claude/`, and the `version`, `scripts`, `files` and `exports` of
  `package.json`) are made by the owner only. Leave them out of your pull
  request so the rest can merge.
- Breaking changes (removing or renaming an export or an option, changing a
  default, raising the browser or Node floor) are the owner's decision: open an
  issue first.

You do not need to do anything for a release. Releases are cut by merging a
version bump; your change ships in the next one and you are credited in the
changelog and the README.

## Reporting bugs and asking for features

Use the issue forms. For a bug, the most useful thing is the smallest options
and data that show it, the `cybercore-charts` version, and where it runs
(browser, framework, server rendering). A screenshot helps for anything visual.

## Working with AI coding agents

[`CLAUDE.md`](CLAUDE.md) holds the agent instructions (`AGENTS.md` points at the
same file): commands, layout, invariants, how to verify a change. Skills and
reviewer agents live in `.claude/`.

## License

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE).
