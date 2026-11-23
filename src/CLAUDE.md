# src/ — the library: rendering rules

Everything here ships to users: `dist/` is built from it and `src/styles/` goes out as source. An export, an option, an event name, a class or a custom property is public API from the release that carries it. Read the nearest existing chart before writing: `charts/GaugeChart.ts` is a compact model of a complete one.

## Map

| Path | Holds |
|---|---|
| `types.ts` | every option, data and event type. The contract `bin/api-diff` and `bin/docs-check` read |
| `index.ts` | the ESM/CJS entry: charts, `createChart`, types, helpers, `VERSION` |
| `cdn.ts` | the UMD entry: the `CyberCharts` global (`createChart`, the chart classes, `colors`, `utils`, `VERSION`) |
| `charts/BaseChart.ts` | lifecycle shared by every chart: container, SVG root, per-instance ids, events, marks and keyboard, accessibility, tooltip, resize, destroy |
| `charts/<Name>Chart.ts`, `Sparkline.ts` | one class per chart; `charts/series.ts` normalises single- and multi-series data |
| `utils/math.ts` | scales, ticks, paths, downsampling, easings. Pure functions |
| `utils/svg.ts` | SVG element builders, defs (gradients, filters, clip paths), `escapeHtml` |
| `utils/theme.ts` | the token map: `themeColor`, `seriesColor`, `SERIES_PALETTE`, `uiColors`, `safeColor`, motion and contrast preferences |
| `utils/colors.ts` | the built-in palette (the fallbacks) and colour math |
| `utils/a11y.ts`, `utils/format.ts` | the hidden data table; locale-aware number and date labels, label fitting |
| `utils/TooltipManager.ts`, `ResponsiveManager.ts`, `EventEmitter.ts` | one job each; created lazily, released in `destroy()` |
| `adapters/chart-binding.ts` | framework-neutral "keep one chart in step with these options"; both adapters use it |
| `react/` | `Cyber*` components and hooks, entry `cybercore-charts/react` |
| `ember/` | the `cyberChart` modifier, entry `cybercore-charts/ember` |
| `styles/cyber-charts.scss` | the optional stylesheet, entry `cybercore-charts/styles` |

## Public API: add, never change

- A new option is optional, documents its default in TSDoc, and with that default the chart draws exactly what it drew before.
- Removed or renamed export, option, event, class member (public or protected: `BaseChart` is exported for subclassing), `exports` entry, class or custom property; a narrowed option type; a new required option; a changed default: all breaking. Stop and ask the owner. `bin/api-diff` prints them.
- A new chart or helper is exported from `index.ts`; a chart also joins `createChart` (`ChartType`, `ChartOptionsMap`, `ChartInstanceMap`), `cdn.ts` and the Ember modifier's maps.
- `VERSION` in `index.ts` equals `package.json`'s version (`bin/repo-guards`, `npm run check:package`).

## Zero dependencies

`dependencies` in `package.json` stays empty. Scale, path, colour, easing, formatting (`Intl`) and resize logic are written here. The core entry never imports `react`, `@glimmer/*`, `@ember/*` or `ember-modifier`; only `react/` and `ember/` do, and those packages are optional peers.

## Import-safe, DOM at run time only

- Nothing at module scope, in a static initialiser or in a default parameter touches `window`, `document`, `matchMedia`, `ResizeObserver` or `requestAnimationFrame`. `tests/ssr.test.ts` imports every entry in plain Node.
- Creating a chart needs a DOM. Without one the constructor throws a readable error ("requires a DOM"), never a `ReferenceError`. Keep that message path first in `resolveContainer`.
- Feature-test at the call site (`typeof matchMedia === 'function'`), as `utils/theme.ts` does.
- No import-time side effects: `sideEffects` in `package.json` promises tree-shaking.

## Ids are per instance

Every chart has `this.uid` (`cyber-chart-<n>`). An id written into the SVG comes from `this.ref('name')` and its reference from `this.url('name')`. Never write a literal id, or one built only from the theme or the chart type: two charts on a page would share a gradient, filter or clip path, and the second draws with the first one's. `<title>` and `<desc>` ids come from the same source.

## Accessibility is built in, not opt-in

- `createRoot()` gives the root `<svg>` a `<title>` and `<desc>` wired with `aria-labelledby` / `aria-describedby`. `updateAccessibility(name, summary)`, called at the end of `render()`, fills them: `ariaLabel` and `description` win, otherwise the chart's own name and a generated summary of the data.
- Marks that carry data are registered with `addItem({ element, label, enter, leave, activate })`. That gives one tab stop per chart (roving tabindex), arrow keys, Home and End between marks, Enter and Space to activate, Escape to dismiss, and a label per mark. `keyboard: false` turns it off. The root is `role="group"` when marks are focusable, `role="img"` otherwise.
- `getTableData()` returns the data as rows; `BaseChart` renders it as a visually hidden table after the SVG (`dataTable`, default on, capped at `MAX_TABLE_ROWS`). A new chart overrides it. The gauge is a `role="meter"` instead.
- Decorative layers (grid, glow, scanlines, static tracks) are `aria-hidden="true"`.
- Colour is never the only difference: series have names in the legend, the tooltip and the table. `SERIES_PALETTE` is ordered to stay distinguishable under protanopia and deuteranopia; do not reorder it or insert hues without re-checking.
- Text from data and options is set with `textContent` or `createText`. Tooltip strings are never parsed as HTML. Colours from data go through `safeColor`.

## Theming: tokens with fallbacks

- Every colour is a `var(--token, fallback)` string from `utils/theme.ts`: `themeColor(theme, shade)` for the chart colour, `seriesColor(index)` for series, `uiColors` for text, axes, grid, tooltip, focus ring and font. With cybercore-css on the page the chart follows its tokens live, a scoped `[data-theme]` included; without it the fallback is the same neon palette.
- The default theme is `'accent'` (`--color-accent`). Named themes read `--cyber-<hue>-<step>`.
- A literal colour, font or radius in a chart is a finding. A new role gets an entry in `uiColors` and, if the stylesheet styles it, the same token in `styles/cyber-charts.scss`.
- The stylesheet is optional. A chart must be legible without it: presentation attributes carry the essentials, the stylesheet adds polish.
- Class names follow `cyber-chart`, `cyber-chart__element`, `cyber-chart--modifier` under `classPrefix`.

## Motion and contrast

- `shouldAnimate()` is the only gate: `animate` on, and neither the OS (`prefers-reduced-motion: reduce`) nor a `[data-motion="reduce"]` ancestor asks for less. When it is false the final state is drawn at once.
- Entry animation runs on first render and on `update()`, not on every re-render: `requestEntryAnimation()` / `takeEntryAnimation()`. Stagger with `staggerDelay(index, count)`, which caps the total so 10,000 marks do not animate for minutes.
- Frame work goes through `nextFrame()` or `this.animationFrame`, so `destroy()` cancels it.
- High contrast (`prefers-contrast: more`, `[data-contrast="high"]`) is handled by the tokens and the stylesheet; do not hardcode low-opacity text or hairlines that it cannot raise.

## Data: every shape draws or draws nothing

Empty array, one point, all-equal values, negatives, a zero total, `NaN`, `null`, `Infinity`, `Date` x values, 10,000 points. None may throw or put `NaN` into a `d`, `x`, `y`, `width` or `transform`. Lines break at missing values unless `connectNulls`; the y axis follows the data with "nice" ticks; large series are downsampled (`maxPoints`). Put the shape in the test when you touch the math.

## destroy() releases everything

Listeners (delegated on the root, so marks need none of their own), the `ResizeObserver`, queued frames, the tooltip node, the data table and the SVG. A new option that creates something adds its teardown in the same change. Adapters rely on it: React Strict Mode mounts twice.

## Adapters are thin

`react/` and `ember/` hold no chart logic. Both drive `adapters/chart-binding.ts`: create after mount or insert, call `setOptions`/`update` when an option value changes, rebuild only when an option is removed, destroy on unmount or teardown. Nothing touches the DOM during a React render, so server rendering emits the empty container. Every core option must be reachable: React wrappers list option keys in a typed array, so a missing key is a compile error.

## Adding a chart by extending BaseChart

```
constructor(container, options) {
  super(container, merged, { width, height })   // resolves the container, throws without a DOM
  this.createRoot(className, width, height)     // svg + <title>/<desc>/<defs> + interaction
  this.createDefinitions()                      // gradients, filters: ids via this.ref()
  this.render()
  this.syncResponsive()
}
render()            resetItems(); draw into this.chartArea; addItem() per mark;
                    showTooltip(content, anchor, event?) / hideTooltip() from the item callbacks;
                    renderLegend(entries, icon); end with updateAccessibility(name, summary)
update(data)        store, requestEntryAnimation(), render()
setOptions(partial) merge, then refresh()       // size, defs, responsive, render
getTableData()      rows for the screen-reader table
createDefinitions() abstract; addEffectDefinitions(glow, scanlines) covers the shared ones
```

`emit(event, payload)` reaches `on()` listeners. Override `handleContainerResize` for a fixed aspect ratio. `destroy()` in a subclass releases its own things, then calls `super.destroy()`.

## Verify

```bash
bin/check files src/charts/<Chart>.ts tests/<file>.test.ts
bin/api-diff        # nothing removed, changed or newly required
bin/docs-check      # after updating README.md and llms.txt
bin/check           # before the pull request
```

Then look at it on a page with several charts: skill `verify-change`, agent `visual-a11y-reviewer`. Adding something new: skill `add-chart`.
