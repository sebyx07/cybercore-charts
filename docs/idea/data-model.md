# Data model

A chart library has no database: its "data" is the public API users write
against. All of it is stable from the release that ships it.

- **Entries:** the `exports` map in `package.json`: `cybercore-charts` (ESM and
  CommonJS), `cybercore-charts/react`, `cybercore-charts/ember`,
  `cybercore-charts/umd` (the browser bundle that defines the `CyberCharts`
  global) and `cybercore-charts/styles` (SCSS source).
- **Charts:** `createChart(type, container, options)` and the classes
  `LineChart`, `BarChart`, `DonutChart`, `GaugeChart` and `Sparkline`, each
  extending `BaseChart`, which is exported for custom charts: its public and
  protected members are API too.
- **Options, data and events:** every type is in `src/types.ts`: one options
  interface per chart over `BaseChartOptions`, the data shapes (`DataPoint`,
  `DataSeries`, `DonutSegment`), the event names (`ChartEventType`) and the
  instance contract (`ChartInstance`). A new option is optional and keeps the
  old drawing at its default.
- **Helpers:** the scale, path, colour, theme, formatting and accessibility
  functions exported from `src/index.ts`.
- **Classes and custom properties:** `cyber-chart`, `cyber-chart__<element>` and
  `cyber-chart--<modifier>` under `classPrefix`, and the custom properties the
  charts read: the cybercore-css tokens with fallbacks (`src/utils/theme.ts`)
  and the stylesheet's own (`src/styles/cyber-charts.scss`).
- **Page attributes:** `data-theme`, `data-motion="reduce"` and
  `data-contrast="high"` on any ancestor, shared with cybercore-css.

The full, current reference is `llms.txt`; `bin/api-diff` compares the built
declarations with the published package and prints what was removed, changed or
added.
