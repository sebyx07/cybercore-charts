# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). While the version is
below 1.0, a minor release may contain breaking changes; they are listed under
**Changed** and marked **Breaking**.

Releases are cut by merging a `package.json` version bump: see
[RELEASE.md](RELEASE.md). Each section below becomes that version's GitHub
Release notes.

## [Unreleased]

## [0.3.0] - 2026-11-23

### Added

- **Accessibility, on by default.** Every chart has a `<title>` and a `<desc>`
  (`ariaLabel`, and the new `description` option; a summary of the data is
  generated when you give none), a visually hidden data table for screen readers
  (`dataTable`, default `true`, up to 500 rows), and keyboard access
  (`keyboard`, default `true`): one tab stop per chart, arrow keys, Home and End
  between data marks, Enter or Space to activate, Escape to dismiss the tooltip.
  The gauge is exposed as a meter.
- **Theming through cybercore-css tokens.** Every colour is a
  `var(--token, fallback)`: with
  [cybercore-css](https://github.com/sebyx07/cybercore-css) on the page, charts
  follow its palette live, including a `data-theme` set on any ancestor; without
  it they render the built-in neon palette. New theme `'accent'` follows
  `--color-accent`.
- **Preferences.** Reduced motion from the operating system or a
  `data-motion="reduce"` ancestor; higher contrast from the operating system or
  `data-contrast="high"`.
- A series palette ordered to stay distinguishable with the common forms of
  colour blindness (`SERIES_PALETTE`, `seriesColor`).
- `locale` option: numbers and dates in labels, tooltips and descriptions are
  formatted for a BCP 47 locale.
- Date x values get a time scale; the y axis follows the data with rounded
  ticks.
- `ariaLabel`, `description` and `locale` on sparklines.
- **Ember:** the `cyberChart` modifier,
  `import { cyberChart } from 'cybercore-charts/ember'`, for Ember 5 and later.
  One modifier covers every chart.
- **React:** a CommonJS build of `cybercore-charts/react`; the `ChartHandle`
  type for refs.
- **React:** the `cybercore-charts/react` entry starts with a `'use client'`
  directive, so its components can be imported from Next.js App Router server
  components without a client wrapper.
- `cybercore-charts/umd` resolves to the minified browser bundle; `unpkg` and
  `jsdelivr` fields point CDNs at it.
- New exports: `themeColor`, `seriesColor`, `SERIES_PALETTE`, `uiColors`,
  `safeColor`, `prefersReducedMotion`, `prefersHighContrast`, `formatNumber`,
  `formatDate`, `fitLabel`, `createDataTable`, `MAX_TABLE_ROWS`,
  `simplifyIndices`, `simplifyPath`, `downsamplePoints`, `cssEasing`, and the
  types `ChartItem`, `LegendEntry`, `ChartDataTable`, `ThemeShade`.
- For subclasses of `BaseChart`: `createRoot`, `ref` and `url` (instance-scoped
  ids), `addItem`, `updateAccessibility`, `getTableData`, `nextFrame`,
  `refresh`, `renderLegend`.

### Changed

- **Breaking:** the default `theme` is `'accent'` instead of `'cyan'`. Without
  cybercore-css the colour is the same cyan; with it, charts now follow the
  page's accent. Pass `theme: 'cyan'` to pin the old behaviour.
- **Breaking (subclasses of `BaseChart` only):** `createTooltip`,
  `tooltipElement`, `setupResponsive` and `resizeObserver` are gone; the tooltip
  and resize tracking live in the protected `tooltipManager` and
  `responsiveManager`. `showTooltip` takes `(content, anchor, event?)` instead
  of `(content, x, y)`. See [`src/CLAUDE.md`](src/CLAUDE.md) for the new
  extension path.
- **Breaking (Ember):** the `<CyberLineChart>`-style Glimmer components and the
  `cyber-chart` class-based modifier in `src/ember/` are replaced by the
  `cyberChart` modifier. The old ones were never reachable through the package's
  `exports`.
- **Breaking (packaging):** the package ships `dist/` and `src/styles/` only;
  the TypeScript sources and `examples/` are no longer in the tarball. Import
  from `cybercore-charts`, `cybercore-charts/react`, `cybercore-charts/ember` or
  `cybercore-charts/styles`.
- React components create the chart after mount and update it in place when
  props change; under Strict Mode nothing leaks. `useChart` and
  `useChartInstance` accept any chart class with the same lifecycle.
- Creating a chart where there is no DOM (server rendering) throws an error that
  says so ("requires a DOM") instead of a `ReferenceError`. Importing the
  package in Node is safe.
- Large series are faster: 10,000 points and more are downsampled before drawing
  and entry animations are capped. Tooltips are created on first use.
- React and React DOM 18 or later, Ember 5 or later and `ember-modifier` 4 or
  later are the supported peers, all optional.
- The project is maintained by [developerz.ai](https://developerz.ai): pull
  requests are reviewed and merged by its agent once CI is green. See
  [CONTRIBUTING.md](CONTRIBUTING.md).
- Releases are published from CI with npm trusted publishing and provenance when
  the version in `package.json` changes on `main`. The package is no longer
  mirrored to GitHub Packages.

### Fixed

- **The npm package now contains its entry points.** Versions 0.1.0, 0.1.1 and
  0.2.0 were published with only `dist/cybercore-charts.umd.min.js`: the ES
  module, the CommonJS build and the type declarations that `package.json`
  pointed to were missing, so `import 'cybercore-charts'` and
  `cybercore-charts/react` could not be resolved from npm. Only the CDN
  `<script>` worked. The build now produces every file `package.json` names, and
  CI installs the packed tarball and imports each entry before a release.
- Two charts on one page no longer share gradients, filters or clip paths: every
  id inside a chart's SVG is unique to that chart.
- `NaN`, `null` and `Infinity` in data no longer break a path: a line shows a
  gap (or bridges it with `connectNulls`), other charts skip the value.
- `destroy()` cancels pending animation frames and removes the tooltip, the
  resize observer and the data table.
- Right-to-left pages: labels and tooltips are placed correctly.
- Rendering fixes in the line, bar and donut charts (empty data, a single point,
  equal values, zero totals).
- The hidden data table's first column header is no longer empty: it is the
  x-axis label, or "Label" when there is none; the donut's table reads "Label",
  "Value", "Share".
- Donut side labels that do not fit are fitted by shrinking the ring, down to
  half its size, instead of being cut off.
- Gauge value and label text scale with the gauge's radius, and the min/max
  labels are dropped on a gauge too small to hold them clear of the value.
- Gauge tick labels stay inside the SVG at every size; the top label ("50") was
  drawn above the edge on height-limited gauges.

## [0.2.0] - 2026-01-14

Published without its ES module, CommonJS and type files (see 0.3.0, Fixed):
usable only from the CDN `<script>` tag.

### Added

- `BaseChart`, the abstract class every chart extends, exported for custom
  charts; `TooltipManager`, `ResponsiveManager` and `ChartEventEmitter`.
- `maxPoints` and `simplifyTolerance` on line charts: series over the limit are
  simplified (Douglas-Peucker) before drawing.
- `on()` and `off()` on sparklines.
- `escapeHtml` and the `LAYOUT` constants.
- Animations are skipped under `prefers-reduced-motion: reduce`.

### Changed

- Resize handling is throttled to one update per animation frame; the gauge
  animates only its moving parts.
- Options and data are validated: non-finite values are filtered, empty data
  draws an empty chart, zero ranges no longer divide by zero.

### Security

- Tooltip content is built as DOM text instead of `innerHTML`: a label or value
  from your data can no longer inject markup.

## [0.1.1] - 2026-01-14

### Changed

- README screenshots and links to the demo site. No change to the library.

## [0.1.0] - 2026-01-14

Initial release.

### Added

- Line (with area), bar (vertical, horizontal, grouped, stacked), donut and pie,
  gauge and sparkline charts, drawn as SVG with no runtime dependency.
- `createChart(type, container, options)` and the chart classes; the
  `CyberCharts` global for `<script>` use.
- Themes `cyan`, `magenta`, `green`, `yellow`; glow and scanline effects; entry
  animations.
- React components (`cybercore-charts/react`).
- TypeScript types for every option.
- Demo site and `llms.txt`.

[Unreleased]: https://github.com/sebyx07/cybercore-charts/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/sebyx07/cybercore-charts/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/sebyx07/cybercore-charts/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/sebyx07/cybercore-charts/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/sebyx07/cybercore-charts/releases/tag/v0.1.0
