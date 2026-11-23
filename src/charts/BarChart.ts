/**
 * CyberCore Charts - Bar Chart
 * SVG bar chart with vertical/horizontal orientation and cyberpunk styling
 */

import { fitLabel, formatNumber } from '../utils/format';
import {
  createBandScale,
  createInvertedScale,
  createLinearScale,
  generateTicks,
  niceExtent,
} from '../utils/math';
import {
  createGroup,
  createLine,
  createLinearGradient,
  createRect,
  createText,
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

import type { BarChartOptions, ChartPadding, DataPoint, DataSeries } from '../types';
import type { ChartDataTable } from '../utils/a11y';
import type { UndefaultedOptionKeys } from './series';

// ============================================================================
// Types and Defaults
// ============================================================================

type BarDefaults = Required<Omit<BarChartOptions, 'data' | UndefaultedOptionKeys>>;
type ResolvedBarOptions = BarDefaults & BarChartOptions;

interface BarScales {
  categories: Array<{ key: string; text: string }>;
  /** Start of a category's band */
  bandStart: (key: string) => number;
  bandwidth: number;
  step: number;
  valueScale: (value: number) => number;
  ticks: number[];
}

const DEFAULT_OPTIONS: BarDefaults = {
  width: 400,
  height: 300,
  padding: { top: 20, right: 20, bottom: 40, left: 50 },
  theme: 'accent',
  animate: true,
  animation: {
    enabled: true,
    duration: 800,
    easing: 'easeOutCubic',
    delay: 0,
    stagger: 30,
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
  orientation: 'vertical',
  groupMode: 'grouped',
  borderRadius: 2,
  barGap: 0.1,
  groupGap: 0.2,
  xAxis: {
    show: true,
    showGrid: false,
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
  showValues: false,
  valuePosition: 'outside',
};

const TICK_FONT_SIZE = 11;

// ============================================================================
// BarChart Class
// ============================================================================

export class BarChart extends BaseChart<ResolvedBarOptions, DataPoint[] | DataSeries[]> {
  private series: DataSeries[] = [];

  constructor(container: HTMLElement | string, options: BarChartOptions) {
    super(container, BarChart.mergeOptions(options), { width: 400, height: 300 });
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

  private static mergeOptions(options: BarChartOptions): ResolvedBarOptions {
    const merged: ResolvedBarOptions = {
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
    const dims = this.validateDimensions(this.options.width, this.options.height, 'BarChart');
    this.options.width = dims.width;
    this.options.height = dims.height;
  }

  private isVertical(): boolean {
    return this.options.orientation !== 'horizontal';
  }

  private colorOf(series: DataSeries, index: number): string {
    return seriesPaint(series, index, this.series.length, this.options.theme);
  }

  // ==========================================================================
  // Definitions
  // ==========================================================================

  /**
   * Glow filter, scanlines pattern and one fill gradient per series.
   */
  protected createDefinitions(): void {
    if (!this.defs) {
      return;
    }
    this.addEffectDefinitions(this.options.glow, this.scanlinesEnabled());
    const direction = this.isVertical()
      ? { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
      : { x1: '100%', y1: '0%', x2: '0%', y2: '0%' };
    this.series.forEach((series, index) => {
      const color = this.colorOf(series, index);
      this.defs?.appendChild(
        createLinearGradient(
          this.ref(`bar-${index}`),
          [
            { offset: '0%', color, opacity: 1 },
            { offset: '100%', color, opacity: 0.7 },
          ],
          direction
        )
      );
    });
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

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

    this.renderAxes(chartWidth, chartHeight, scales);
    this.renderBars(scales, animate);

    if (this.options.legend.show && this.series.length > 1) {
      this.renderLegend(
        this.series.map((series, i) => ({ name: series.name, color: this.colorOf(series, i) })),
        'square'
      );
    }
    if (this.scanlinesEnabled()) {
      this.chartArea.appendChild(this.createScanlinesOverlay());
    }

    this.updateAccessibility('Bar chart', seriesSummary(this.series, this.options.locale));
  }

  /**
   * Value extent including zero. Stacked bars use per-category positive and
   * negative totals, since they stack in opposite directions.
   */
  private valueExtent(): [number, number] {
    let min = 0;
    let max = 0;
    const positive = new Map<string, number>();
    const negative = new Map<string, number>();
    const stacked = this.options.groupMode === 'stacked';

    for (const series of this.series) {
      if (series.visible === false) {
        continue;
      }
      for (const point of series.data) {
        if (!hasValue(point)) {
          continue;
        }
        let value = point.y;
        if (stacked) {
          const totals = value >= 0 ? positive : negative;
          const key = xKey(point.x);
          value += totals.get(key) ?? 0;
          totals.set(key, value);
        }
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }
    return [min, max];
  }

  private calculateScales(chartWidth: number, chartHeight: number): BarScales {
    const categories = new Map<string, string>();
    for (const series of this.series) {
      for (const point of series.data) {
        if (isPresent(point) && !categories.has(xKey(point.x))) {
          categories.set(xKey(point.x), formatX(point.x, this.options.locale));
        }
      }
    }

    const vertical = this.isVertical();
    const categoryLength = vertical ? chartWidth : chartHeight;
    const valueLength = vertical ? chartHeight : chartWidth;
    const keys = [...categories.keys()];
    const band = createBandScale(keys, 0, categoryLength, this.options.groupGap);

    const valueAxis = vertical ? this.options.yAxis : this.options.xAxis;
    const [dataMin, dataMax] = this.valueExtent();
    const [niceMin, niceMax] = niceExtent(dataMin, dataMax, valueAxis.ticks);
    const min = valueAxis.min ?? niceMin;
    const max = valueAxis.max ?? niceMax;
    const valueScale = vertical
      ? createInvertedScale(min, max, 0, valueLength)
      : createLinearScale(min, max, 0, valueLength);

    return {
      categories: keys.map((key) => ({ key, text: categories.get(key) ?? key })),
      bandStart: (key) => band.scale(key),
      bandwidth: band.bandwidth,
      step: keys.length > 0 ? categoryLength / keys.length : categoryLength,
      valueScale,
      ticks: generateTicks(min, max, valueAxis.ticks).filter(
        (tick) => tick >= min - 1e-9 && tick <= max + 1e-9
      ),
    };
  }

  private renderAxes(chartWidth: number, chartHeight: number, scales: BarScales): void {
    const prefix = this.options.classPrefix;
    const padding = this.options.padding as ChartPadding;
    const vertical = this.isVertical();
    const axisGroup = createGroup(`${prefix}__axes`, `translate(${padding.left}, ${padding.top})`);
    axisGroup.setAttribute('aria-hidden', 'true');
    const labelStyle = {
      fill: uiColors.text,
      fontSize: TICK_FONT_SIZE,
      className: `${prefix}__tick-label`,
    };

    const valueAxis = vertical ? this.options.yAxis : this.options.xAxis;
    if (valueAxis.show) {
      const group = createGroup(`${prefix}__value-axis`);
      group.appendChild(
        vertical
          ? createLine(0, 0, 0, chartHeight, { stroke: uiColors.axis })
          : createLine(0, chartHeight, chartWidth, chartHeight, { stroke: uiColors.axis })
      );
      const format =
        valueAxis.formatLabel ??
        ((v: number | string) => formatNumber(Number(v), this.options.locale));
      for (const tick of scales.ticks) {
        const pos = scales.valueScale(tick);
        if (valueAxis.showGrid) {
          group.appendChild(
            vertical
              ? createLine(0, pos, chartWidth, pos, {
                  stroke: uiColors.grid,
                  strokeDasharray: '4 4',
                })
              : createLine(pos, 0, pos, chartHeight, {
                  stroke: uiColors.grid,
                  strokeDasharray: '4 4',
                })
          );
        }
        if (valueAxis.showLabels) {
          const text = format(tick);
          group.appendChild(
            vertical
              ? createText(-10, pos, fitLabel(text, padding.left - 12, TICK_FONT_SIZE), {
                  ...labelStyle,
                  textAnchor: 'end',
                  title: text,
                })
              : createText(pos, chartHeight + 20, text, labelStyle)
          );
        }
      }
      axisGroup.appendChild(group);
    }

    const categoryAxis = vertical ? this.options.xAxis : this.options.yAxis;
    if (categoryAxis.show) {
      const group = createGroup(`${prefix}__category-axis`);
      group.appendChild(
        vertical
          ? createLine(0, chartHeight, chartWidth, chartHeight, { stroke: uiColors.axis })
          : createLine(0, 0, 0, chartHeight, { stroke: uiColors.axis })
      );
      if (categoryAxis.showLabels) {
        for (const category of scales.categories) {
          const pos = scales.bandStart(category.key) + scales.bandwidth / 2;
          const text = categoryAxis.formatLabel
            ? categoryAxis.formatLabel(category.text)
            : category.text;
          const maxWidth = vertical ? scales.step - 4 : padding.left - 12;
          group.appendChild(
            vertical
              ? createText(pos, chartHeight + 20, fitLabel(text, maxWidth, TICK_FONT_SIZE), {
                  ...labelStyle,
                  title: text,
                })
              : createText(-10, pos, fitLabel(text, maxWidth, TICK_FONT_SIZE), {
                  ...labelStyle,
                  textAnchor: 'end',
                  title: text,
                })
          );
        }
      }
      axisGroup.appendChild(group);
    }

    this.chartArea?.appendChild(axisGroup);
  }

  private renderBars(scales: BarScales, animate: boolean): void {
    const prefix = this.options.classPrefix;
    const padding = this.options.padding as ChartPadding;
    const vertical = this.isVertical();
    const stacked = this.options.groupMode === 'stacked';
    const barsGroup = createGroup(`${prefix}__bars`, `translate(${padding.left}, ${padding.top})`);

    const visible = this.series.filter((series) => series.visible !== false);
    const barGap = scales.bandwidth * this.options.barGap;
    const barThickness = stacked
      ? scales.bandwidth
      : (scales.bandwidth - barGap) / Math.max(1, visible.length);
    const positive = new Map<string, number>();
    const negative = new Map<string, number>();
    const zero = scales.valueScale(0);
    const total = visible.reduce((sum, s) => sum + s.data.length, 0);
    let order = 0;

    visible.forEach((series, slot) => {
      const seriesIndex = this.series.indexOf(series);
      const color = this.colorOf(series, seriesIndex);
      const group = createGroup(`${prefix}__series`);
      group.setAttribute('data-series-id', series.id);

      for (const point of series.data) {
        if (!hasValue(point)) {
          continue;
        }
        const key = xKey(point.x);
        const totals = point.y >= 0 ? positive : negative;
        const base = stacked ? (totals.get(key) ?? 0) : 0;
        if (stacked) {
          totals.set(key, base + point.y);
        }
        const from = scales.valueScale(base);
        const to = scales.valueScale(base + point.y);
        const offset = scales.bandStart(key) + (stacked ? 0 : barGap / 2 + slot * barThickness);
        const valueStart = Math.min(from, to);
        const length = Math.abs(to - from);
        const [x, y, width, height] = vertical
          ? [offset, valueStart, barThickness, length]
          : [valueStart, offset, length, barThickness];

        const rect = createRect(x, y, width, height, {
          fill: this.url(`bar-${seriesIndex}`),
          rx: this.options.borderRadius,
          ry: this.options.borderRadius,
          className: `${prefix}__bar`,
        });
        this.applyGlow(rect);
        this.addBarItem(rect, point, series, color);
        if (animate) {
          this.animateBar(
            rect,
            vertical,
            zero,
            { y, height, width },
            this.staggerDelay(order, total)
          );
        }
        group.appendChild(rect);
        order++;

        if (this.options.showValues) {
          group.appendChild(this.valueLabel(point, x, y, width, height, vertical));
        }
      }
      barsGroup.appendChild(group);
    });

    this.chartArea?.appendChild(barsGroup);
  }

  private valueLabel(
    point: DataPoint,
    x: number,
    y: number,
    width: number,
    height: number,
    vertical: boolean
  ): SVGTextElement {
    const format =
      (this.isVertical() ? this.options.yAxis : this.options.xAxis).formatLabel ??
      ((v: number | string) => formatNumber(Number(v), this.options.locale));
    const below = point.y < 0;
    const label = vertical
      ? createText(x + width / 2, below ? y + height + 10 : y - 6, format(point.y), {
          fill: uiColors.text,
          fontSize: 10,
        })
      : createText(below ? x - 5 : x + width + 5, y + height / 2, format(point.y), {
          fill: uiColors.text,
          fontSize: 10,
          textAnchor: below ? 'end' : 'start',
        });
    label.setAttribute('aria-hidden', 'true');
    return label;
  }

  private addBarItem(
    rect: SVGRectElement,
    point: DataPoint,
    series: DataSeries,
    color: string
  ): void {
    const xLabel = pointLabel(point, this.options.locale);
    const value = formatNumber(point.y, this.options.locale);
    this.addItem({
      element: rect,
      label:
        this.series.length === 1 ? `${xLabel}: ${value}` : `${series.name}, ${xLabel}: ${value}`,
      enter: (event) => {
        this.emit('barHover', {
          type: 'barHover',
          target: rect,
          data: { point, series },
          originalEvent: event,
        });
        const content = this.options.tooltip.formatter
          ? this.options.tooltip.formatter(point, series)
          : TooltipManager.createDataPointContent(series.name, color, xLabel, value, 'square');
        this.showTooltip(content, rect);
      },
      leave: () => this.hideTooltip(),
      activate: (event) =>
        this.emit('barClick', {
          type: 'barClick',
          target: rect,
          data: { point, series },
          originalEvent: event,
        }),
    });
  }

  /** Grows a bar out of the zero line */
  private animateBar(
    rect: SVGRectElement,
    vertical: boolean,
    zero: number,
    final: { y: number; height: number; width: number },
    delay: number
  ): void {
    const { duration } = this.options.animation;
    if (vertical) {
      rect.setAttribute('height', '0');
      rect.setAttribute('y', String(zero));
      rect.style.transition = `height ${duration}ms, y ${duration}ms`;
    } else {
      rect.setAttribute('width', '0');
      rect.style.transition = `width ${duration}ms, x ${duration}ms`;
    }
    rect.style.transitionDelay = `${delay}ms`;
    this.nextFrame(() => {
      if (vertical) {
        rect.setAttribute('height', String(final.height));
        rect.setAttribute('y', String(final.y));
      } else {
        rect.setAttribute('width', String(final.width));
      }
    });
  }

  protected override getTableData(): ChartDataTable {
    return seriesTable(
      this.series,
      this.options.ariaLabel || 'Bar chart',
      this.options.locale,
      (this.isVertical() ? this.options.xAxis : this.options.yAxis).label
    );
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update the chart with new data
   * @param data - New data points or series to display
   */
  update(data: DataPoint[] | DataSeries[]): void {
    this.options.data = data;
    this.series = normalizeSeries(data);
    this.requestEntryAnimation();
    this.rebuildDefinitions();
    this.render();
  }

  /**
   * Update chart configuration options. Data, theme, size, orientation and
   * effects may all change.
   * @param options - Partial options object to merge with existing options
   */
  setOptions(options: Partial<BarChartOptions>): void {
    this.options = BarChart.mergeOptions({ ...this.options, ...options });
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
   * Destroy the chart instance and clean up all resources
   */
  override destroy(): void {
    this.series = [];
    super.destroy();
  }
}

export default BarChart;
