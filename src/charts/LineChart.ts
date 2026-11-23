/**
 * CyberCore Charts - Line Chart
 * SVG line chart with cyberpunk styling, area fills, and glow effects
 */

import { formatNumber, fitLabel } from '../utils/format';
import {
  clamp,
  createBandScale,
  createInvertedScale,
  createLinearScale,
  cssEasing,
  generateTicks,
  niceExtent,
  simplifyIndices,
  smoothPath,
  stepPath,
} from '../utils/math';
import {
  createCircle,
  createGroup,
  createLine,
  createLinearGradient,
  createPath,
  createText,
  pointsToPath,
} from '../utils/svg';
import { uiColors } from '../utils/theme';
import { TooltipManager } from '../utils/TooltipManager';

import { BaseChart } from './BaseChart';
import {
  formatX,
  hasValue,
  isPresent,
  normalizeSeries,
  pointLabel,
  seriesPaint,
  seriesSummary,
  seriesTable,
  xKey,
} from './series';

import type {
  ChartPadding,
  DataPoint,
  DataSeries,
  LineChartOptions,
  LineInterpolation,
  Point,
} from '../types';
import type { ChartDataTable } from '../utils/a11y';
import type { UndefaultedOptionKeys } from './series';

// ============================================================================
// Types and Defaults
// ============================================================================

type LineDefaults = Required<Omit<LineChartOptions, 'data' | UndefaultedOptionKeys>>;
type ResolvedLineOptions = LineDefaults & LineChartOptions;

/** A data point placed on screen */
interface Plotted extends Point {
  datum: DataPoint;
}

interface LineScales {
  /** Screen x of a point, or null when its x value cannot be placed */
  xPos: (point: DataPoint) => number | null;
  yScale: (value: number) => number;
  yTicks: number[];
  yMin: number;
  yMax: number;
  xTicks: Array<{ x: number; text: string }>;
  xLabelWidth: number;
}

const DEFAULT_OPTIONS: LineDefaults = {
  width: 400,
  height: 300,
  padding: { top: 20, right: 20, bottom: 40, left: 50 },
  theme: 'accent',
  animate: true,
  animation: {
    enabled: true,
    duration: 1000,
    easing: 'easeOutCubic',
    delay: 0,
    stagger: 50,
  },
  tooltip: {
    enabled: true,
    followCursor: false,
  },
  glow: true,
  scanlines: false,
  classPrefix: 'cyber-chart',
  responsive: false,
  dataTable: true,
  keyboard: true,
  showArea: false,
  areaOpacity: 0.2,
  showPoints: true,
  pointRadius: 4,
  lineWidth: 2,
  interpolation: 'linear',
  xAxis: {
    show: true,
    showGrid: true,
    showLabels: true,
    ticks: 5,
  },
  yAxis: {
    show: true,
    showGrid: true,
    showLabels: true,
    ticks: 5,
  },
  legend: {
    show: true,
    position: 'top',
    align: 'end',
  },
  connectNulls: false,
  maxPoints: 1000,
  simplifyTolerance: 1,
};

const TICK_FONT_SIZE = 11;

function linePath(points: Point[], interpolation: LineInterpolation): string {
  if (points.length < 2) {
    return points.length === 1 ? `M ${points[0].x} ${points[0].y}` : '';
  }
  switch (interpolation) {
    case 'smooth':
      return smoothPath(points, 0.5);
    case 'step':
      return stepPath(points, 'middle');
    case 'stepBefore':
      return stepPath(points, 'before');
    case 'stepAfter':
      return stepPath(points, 'after');
    default:
      return pointsToPath(points);
  }
}

// ============================================================================
// LineChart Class
// ============================================================================

export class LineChart extends BaseChart<ResolvedLineOptions, DataPoint[] | DataSeries[]> {
  private series: DataSeries[] = [];

  constructor(container: HTMLElement | string, options: LineChartOptions) {
    super(container, LineChart.mergeOptions(options), { width: 400, height: 300 });
    this.applyDimensions();
    this.series = normalizeSeries(this.options.data);
    this.createRoot(this.options.classPrefix, this.options.width, this.options.height);
    this.createDefinitions();
    this.render();
    this.syncResponsive();
  }

  // ==========================================================================
  // Options
  // ==========================================================================

  private static mergeOptions(options: LineChartOptions): ResolvedLineOptions {
    const merged: ResolvedLineOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      padding: { ...DEFAULT_OPTIONS.padding, ...options.padding },
      animation: { ...DEFAULT_OPTIONS.animation, ...options.animation },
      tooltip: { ...DEFAULT_OPTIONS.tooltip, ...options.tooltip },
      xAxis: { ...DEFAULT_OPTIONS.xAxis, ...options.xAxis },
      yAxis: { ...DEFAULT_OPTIONS.yAxis, ...options.yAxis },
      legend: { ...DEFAULT_OPTIONS.legend, ...options.legend },
    };
    if (typeof options.glow === 'object') {
      merged.glow = { enabled: true, ...options.glow };
    }
    return merged;
  }

  private applyDimensions(): void {
    const dims = this.validateDimensions(this.options.width, this.options.height, 'LineChart');
    this.options.width = dims.width;
    this.options.height = dims.height;
  }

  // ==========================================================================
  // Definitions
  // ==========================================================================

  /**
   * Glow filter, scanlines pattern and one area gradient per series.
   */
  protected createDefinitions(): void {
    if (!this.defs) {
      return;
    }
    this.addEffectDefinitions(this.options.glow, this.scanlinesEnabled());
    this.series.forEach((series, index) => {
      const color = this.colorOf(series, index);
      this.defs?.appendChild(
        createLinearGradient(this.ref(`area-${index}`), [
          { offset: '0%', color, opacity: this.options.areaOpacity },
          { offset: '100%', color, opacity: 0 },
        ])
      );
    });
  }

  private colorOf(series: DataSeries, index: number): string {
    return seriesPaint(series, index, this.series.length, this.options.theme);
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  /**
   * Renders the chart.
   */
  render(): void {
    if (!this.svg) {
      return;
    }
    const animate = this.takeEntryAnimation();
    this.resetItems();
    this.chartArea?.remove();

    this.chartArea = createGroup(`${this.options.classPrefix}__area`);
    this.svg.appendChild(this.chartArea);

    const padding = this.options.padding as ChartPadding;
    const chartWidth = Math.max(0, this.options.width - padding.left - padding.right);
    const chartHeight = Math.max(0, this.options.height - padding.top - padding.bottom);
    const scales = this.calculateScales(chartWidth, chartHeight);

    if (this.options.xAxis.show || this.options.yAxis.show) {
      this.renderAxes(chartWidth, chartHeight, scales);
    }
    this.renderSeries(scales, animate);

    if (this.options.legend.show && this.series.length > 1) {
      this.renderLegend(
        this.series.map((series, i) => ({ name: series.name, color: this.colorOf(series, i) })),
        'line'
      );
    }
    if (this.scanlinesEnabled()) {
      this.chartArea.appendChild(this.createScanlinesOverlay());
    }

    this.updateAccessibility('Line chart', seriesSummary(this.series, this.options.locale));
  }

  private calculateScales(chartWidth: number, chartHeight: number): LineScales {
    let dataMin = Infinity;
    let dataMax = -Infinity;
    const xs = new Map<string, DataPoint['x']>();

    for (const series of this.series) {
      for (const point of series.data) {
        if (!isPresent(point) || !isPresent(point.x)) {
          continue;
        }
        if (hasValue(point)) {
          dataMin = Math.min(dataMin, point.y);
          dataMax = Math.max(dataMax, point.y);
        }
        const key = xKey(point.x);
        if (!xs.has(key)) {
          xs.set(key, point.x);
        }
      }
    }

    const { yAxis, xAxis } = this.options;
    const hasData = dataMin <= dataMax;
    const [niceMin, niceMax] = niceExtent(
      yAxis.min ?? (hasData ? Math.min(0, dataMin) : 0),
      yAxis.max ?? (hasData ? Math.max(0, dataMax) : 100),
      yAxis.ticks
    );
    const yMin = yAxis.min ?? niceMin;
    const yMax = yAxis.max ?? niceMax;
    const yScale = createInvertedScale(yMin, yMax, 0, chartHeight);
    const yTicks = generateTicks(yMin, yMax, yAxis.ticks).filter(
      (tick) => tick >= yMin - 1e-9 && tick <= yMax + 1e-9
    );

    const xValues = [...xs.values()];
    const first = xValues[0];
    const isNumeric = typeof first === 'number' || first instanceof Date;
    let xPos: (point: DataPoint) => number | null;

    if (isNumeric) {
      const toNumber = (x: DataPoint['x']): number =>
        x instanceof Date ? x.getTime() : typeof x === 'number' ? x : NaN;
      let lo = Infinity;
      let hi = -Infinity;
      for (const x of xValues) {
        const n = toNumber(x);
        if (Number.isFinite(n)) {
          lo = Math.min(lo, n);
          hi = Math.max(hi, n);
        }
      }
      lo = xAxis.min ?? lo;
      hi = xAxis.max ?? hi;
      if (lo === hi) {
        // A single x value sits in the middle of the axis
        lo -= 1;
        hi += 1;
      }
      const scale = createLinearScale(lo, hi, 0, chartWidth);
      xPos = (point) => {
        const n = toNumber(point.x);
        return Number.isFinite(n) ? scale(n) : null;
      };
    } else {
      const band = createBandScale(
        xValues.map((x) => xKey(x)),
        0,
        chartWidth,
        0.1
      );
      xPos = (point) => band.scale(xKey(point.x)) + band.bandwidth / 2;
    }

    const step = Math.max(1, Math.ceil(xValues.length / (xAxis.ticks || 5)));
    const xTicks = xValues
      .filter((_, i) => i % step === 0)
      .map((x) => ({
        x: xPos({ x, y: 0 }) ?? 0,
        text: xAxis.formatLabel
          ? xAxis.formatLabel(x as number | string)
          : formatX(x, this.options.locale),
      }));
    const xLabelWidth = xTicks.length > 0 ? chartWidth / xTicks.length - 4 : chartWidth;

    return { xPos, yScale, yTicks, yMin, yMax, xTicks, xLabelWidth };
  }

  private renderAxes(chartWidth: number, chartHeight: number, scales: LineScales): void {
    const prefix = this.options.classPrefix;
    const padding = this.options.padding as ChartPadding;
    const axisGroup = createGroup(`${prefix}__axes`, `translate(${padding.left}, ${padding.top})`);
    axisGroup.setAttribute('aria-hidden', 'true');

    if (this.options.yAxis.show) {
      const yAxisGroup = createGroup(`${prefix}__y-axis`);
      yAxisGroup.appendChild(
        createLine(0, 0, 0, chartHeight, {
          stroke: uiColors.axis,
          className: `${prefix}__axis-line`,
        })
      );
      const format =
        this.options.yAxis.formatLabel ??
        ((v: number | string) => formatNumber(Number(v), this.options.locale));

      for (const tick of scales.yTicks) {
        const y = scales.yScale(tick);
        if (this.options.yAxis.showGrid) {
          yAxisGroup.appendChild(
            createLine(0, y, chartWidth, y, {
              stroke: uiColors.grid,
              strokeDasharray: '4 4',
              className: `${prefix}__grid-line`,
            })
          );
        }
        if (this.options.yAxis.showLabels) {
          const text = format(tick);
          yAxisGroup.appendChild(
            createText(-10, y, fitLabel(text, padding.left - 12, TICK_FONT_SIZE), {
              fill: uiColors.text,
              fontSize: TICK_FONT_SIZE,
              textAnchor: 'end',
              className: `${prefix}__tick-label`,
              title: text,
            })
          );
        }
      }
      axisGroup.appendChild(yAxisGroup);
    }

    if (this.options.xAxis.show) {
      const xAxisGroup = createGroup(`${prefix}__x-axis`);
      xAxisGroup.appendChild(
        createLine(0, chartHeight, chartWidth, chartHeight, {
          stroke: uiColors.axis,
          className: `${prefix}__axis-line`,
        })
      );
      for (const tick of scales.xTicks) {
        if (this.options.xAxis.showGrid) {
          xAxisGroup.appendChild(
            createLine(tick.x, 0, tick.x, chartHeight, {
              stroke: uiColors.grid,
              strokeDasharray: '4 4',
              className: `${prefix}__grid-line`,
            })
          );
        }
        if (this.options.xAxis.showLabels) {
          xAxisGroup.appendChild(
            createText(
              tick.x,
              chartHeight + 20,
              fitLabel(tick.text, scales.xLabelWidth, TICK_FONT_SIZE),
              {
                fill: uiColors.text,
                fontSize: TICK_FONT_SIZE,
                className: `${prefix}__tick-label`,
                title: tick.text,
              }
            )
          );
        }
      }
      axisGroup.appendChild(xAxisGroup);
    }

    this.chartArea?.appendChild(axisGroup);
  }

  /**
   * Splits a series into runs of plottable points. Missing values break the
   * line unless connectNulls is set.
   */
  private plotRuns(series: DataSeries, scales: LineScales): Plotted[][] {
    const runs: Plotted[][] = [];
    let run: Plotted[] = [];
    for (const datum of series.data) {
      const x = hasValue(datum) ? scales.xPos(datum) : null;
      if (x === null) {
        if (!this.options.connectNulls && run.length > 0) {
          runs.push(run);
          run = [];
        }
        continue;
      }
      run.push({ x, y: scales.yScale(datum.y), datum });
    }
    if (run.length > 0) {
      runs.push(run);
    }
    return runs;
  }

  /**
   * Thins runs to at most maxPoints in total: shape-preserving simplification
   * first, then even sampling if that was not enough.
   */
  private reduceRuns(runs: Plotted[][]): Plotted[][] {
    const { maxPoints, simplifyTolerance } = this.options;
    const total = runs.reduce((sum, run) => sum + run.length, 0);
    if (!(maxPoints > 0) || !Number.isFinite(maxPoints) || total <= maxPoints) {
      return runs;
    }
    let reduced = runs.map((run) => simplifyIndices(run, simplifyTolerance).map((i) => run[i]));
    const remaining = reduced.reduce((sum, run) => sum + run.length, 0);
    if (remaining > maxPoints) {
      const every = Math.ceil(remaining / maxPoints);
      reduced = reduced.map((run) => run.filter((_, i) => i % every === 0));
    }
    return reduced;
  }

  private renderSeries(scales: LineScales, animate: boolean): void {
    const prefix = this.options.classPrefix;
    const padding = this.options.padding as ChartPadding;
    const baseline = scales.yScale(clamp(0, scales.yMin, scales.yMax));
    const single = this.series.length === 1;

    this.series.forEach((series, seriesIndex) => {
      if (series.visible === false) {
        return;
      }
      const group = createGroup(`${prefix}__series`, `translate(${padding.left}, ${padding.top})`);
      group.setAttribute('data-series-id', series.id);
      const color = this.colorOf(series, seriesIndex);
      const runs = this.reduceRuns(this.plotRuns(series, scales));
      const paths = runs.map((run) => linePath(run, this.options.interpolation));

      if (this.options.showArea) {
        const area = runs
          .map((run, i) =>
            run.length < 2
              ? ''
              : `${paths[i]} L ${run[run.length - 1].x} ${baseline} L ${run[0].x} ${baseline} Z`
          )
          .filter(Boolean)
          .join(' ');
        if (area) {
          const areaPath = createPath(area, {
            fill: this.url(`area-${seriesIndex}`),
            stroke: 'none',
            className: `${prefix}__area-fill`,
          });
          areaPath.setAttribute('aria-hidden', 'true');
          group.appendChild(areaPath);
        }
      }

      if (runs.some((run) => run.length > 1)) {
        const line = createPath(paths.join(' '), {
          stroke: color,
          strokeWidth: this.options.lineWidth,
          className: `${prefix}__line`,
        });
        line.setAttribute('aria-hidden', 'true');
        this.applyGlow(line);
        if (animate) {
          this.animatePath(line);
        }
        group.appendChild(line);
      }

      if (this.options.showPoints) {
        const pointsGroup = createGroup(`${prefix}__points`);
        const plotted = runs.flat();
        plotted.forEach((point, index) => {
          const circle = createCircle(point.x, point.y, this.options.pointRadius, {
            fill: color,
            className: `${prefix}__point`,
          });
          this.addPointItem(circle, point.datum, series, color, single);
          if (animate) {
            this.animatePoint(circle, point, index, plotted.length);
          }
          pointsGroup.appendChild(circle);
        });
        group.appendChild(pointsGroup);
      }

      this.chartArea?.appendChild(group);
    });
  }

  private addPointItem(
    circle: SVGCircleElement,
    point: DataPoint,
    series: DataSeries,
    color: string,
    single: boolean
  ): void {
    const xLabel = pointLabel(point, this.options.locale);
    const value = formatNumber(point.y, this.options.locale);
    this.addItem({
      element: circle,
      label: single ? `${xLabel}: ${value}` : `${series.name}, ${xLabel}: ${value}`,
      enter: (event) => {
        this.emit('pointHover', {
          type: 'pointHover',
          target: circle,
          data: { point, series },
          originalEvent: event,
        });
        const content = this.options.tooltip.formatter
          ? this.options.tooltip.formatter(point, series)
          : TooltipManager.createDataPointContent(series.name, color, xLabel, value, 'circle');
        this.showTooltip(content, circle);
      },
      leave: () => this.hideTooltip(),
      activate: (event) =>
        this.emit('pointClick', {
          type: 'pointClick',
          target: circle,
          data: { point, series },
          originalEvent: event,
        }),
    });
  }

  private animatePath(path: SVGPathElement): void {
    const length = typeof path.getTotalLength === 'function' ? path.getTotalLength() : 0;
    if (!(length > 0)) {
      return;
    }
    const { duration, easing } = this.options.animation;
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.style.transition = `stroke-dashoffset ${duration}ms ${cssEasing(easing)}`;
    this.nextFrame(() => {
      path.style.strokeDashoffset = '0';
    });
  }

  private animatePoint(circle: SVGCircleElement, point: Point, index: number, count: number): void {
    const { duration } = this.options.animation;
    circle.style.opacity = '0';
    circle.style.transform = 'scale(0)';
    circle.style.transformOrigin = `${point.x}px ${point.y}px`;
    circle.style.transition = `opacity ${duration}ms, transform ${duration}ms`;
    circle.style.transitionDelay = `${this.staggerDelay(index, count)}ms`;
    this.nextFrame(() => {
      circle.style.opacity = '1';
      circle.style.transform = 'scale(1)';
    });
  }

  protected override getTableData(): ChartDataTable {
    return seriesTable(
      this.series,
      this.options.ariaLabel || 'Line chart',
      this.options.locale,
      this.options.xAxis.label
    );
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update chart with new data
   */
  update(data: DataPoint[] | DataSeries[]): void {
    this.options.data = data;
    this.series = normalizeSeries(data);
    this.requestEntryAnimation();
    this.rebuildDefinitions();
    this.render();
  }

  /**
   * Update chart options. Data, theme, size and effects may all change.
   */
  setOptions(options: Partial<LineChartOptions>): void {
    this.options = LineChart.mergeOptions({ ...this.options, ...options });
    if (!this.svg) {
      return;
    }
    this.applyDimensions();
    if (options.data) {
      this.series = normalizeSeries(options.data);
      this.requestEntryAnimation();
    }
    this.refresh();
  }

  /**
   * Destroy chart and clean up
   */
  override destroy(): void {
    this.series = [];
    super.destroy();
  }
}

export default LineChart;
