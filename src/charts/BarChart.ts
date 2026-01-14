/**
 * CyberCore Charts - Bar Chart
 * SVG bar chart with vertical/horizontal orientation and cyberpunk styling
 */

import { chartColors, getThemeColor } from '../utils/colors';
import {
  niceExtent,
  generateTicks,
  createInvertedScale,
  createLinearScale,
  createBandScale,
} from '../utils/math';
import {
  createSVGRoot,
  createDefs,
  createGroup,
  createRect,
  createLine,
  createText,
  createGlowFilter,
  createLinearGradient,
  createScanlinesPattern,
  clearElement,
  svgToString,
  applyGlowFilter,
} from '../utils/svg';

import type {
  BarChartOptions,
  ChartEvent,
  ChartEventHandler,
  ChartEventType,
  ChartPadding,
  ChartTheme,
  DataPoint,
  DataSeries,
} from '../types';

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<BarChartOptions, 'data'>> = {
  width: 400,
  height: 300,
  padding: { top: 20, right: 20, bottom: 40, left: 50 },
  theme: 'cyan',
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
  ariaLabel: 'Bar chart',
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

// ============================================================================
// BarChart Class
// ============================================================================

export class BarChart {
  private container: HTMLElement;
  private options: Required<Omit<BarChartOptions, 'data'>> & { data: DataPoint[] | DataSeries[] };
  private svg: SVGSVGElement | null = null;
  private defs: SVGDefsElement | null = null;
  private chartArea: SVGGElement | null = null;
  private series: DataSeries[] = [];
  private eventHandlers: Map<ChartEventType, Set<ChartEventHandler>> = new Map();
  private resizeObserver: ResizeObserver | null = null;
  private tooltipElement: HTMLDivElement | null = null;

  constructor(container: HTMLElement | string, options: BarChartOptions) {
    // Get container element
    if (typeof container === 'string') {
      const el = document.querySelector(container);
      if (!el) {
        throw new Error(`Container not found: ${container}`);
      }
      this.container = el as HTMLElement;
    } else {
      this.container = container;
    }

    // Merge options with defaults
    this.options = this.mergeOptions(options);

    // Normalize data to series format
    this.series = this.normalizeData(this.options.data);

    // Initialize the chart
    this.init();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private mergeOptions(
    options: BarChartOptions
  ): Required<Omit<BarChartOptions, 'data'>> & { data: DataPoint[] | DataSeries[] } {
    const merged = {
      ...DEFAULT_OPTIONS,
      ...options,
      padding: { ...DEFAULT_OPTIONS.padding, ...options.padding },
      animation: { ...DEFAULT_OPTIONS.animation, ...options.animation },
      tooltip: { ...DEFAULT_OPTIONS.tooltip, ...options.tooltip },
      xAxis: { ...DEFAULT_OPTIONS.xAxis, ...options.xAxis },
      yAxis: { ...DEFAULT_OPTIONS.yAxis, ...options.yAxis },
      legend: { ...DEFAULT_OPTIONS.legend, ...options.legend },
    };

    if (typeof options.glow === 'boolean') {
      merged.glow = options.glow;
    } else if (options.glow) {
      merged.glow = { enabled: true, ...options.glow };
    }

    return merged as Required<Omit<BarChartOptions, 'data'>> & { data: DataPoint[] | DataSeries[] };
  }

  private normalizeData(data: DataPoint[] | DataSeries[]): DataSeries[] {
    if (data.length === 0) {
      return [];
    }

    if ('data' in data[0] && Array.isArray(data[0].data)) {
      return data as DataSeries[];
    }

    return [
      {
        id: 'series-0',
        name: 'Series 1',
        data: data as DataPoint[],
        theme: this.options.theme,
      },
    ];
  }

  private init(): void {
    clearElement(this.container);
    this.createSVG();
    this.createDefinitions();
    this.render();

    if (this.options.responsive) {
      this.setupResponsive();
    }

    if (this.options.tooltip.enabled) {
      this.createTooltip();
    }
  }

  private createSVG(): void {
    this.svg = createSVGRoot(this.options.width, this.options.height, {
      classPrefix: this.options.classPrefix,
      ariaLabel: this.options.ariaLabel,
    });
    this.container.appendChild(this.svg);
  }

  private createDefinitions(): void {
    if (!this.svg) {
      return;
    }

    this.defs = createDefs();
    this.svg.appendChild(this.defs);

    // Create glow filters
    const themes: ChartTheme[] = ['cyan', 'magenta', 'green', 'yellow'];
    themes.forEach((theme) => {
      const glowConfig = typeof this.options.glow === 'object' ? this.options.glow : {};
      const filter = createGlowFilter(`glow-${theme}`, theme, glowConfig);
      this.defs!.appendChild(filter);
    });

    // Create gradients for bars
    this.series.forEach((series, index) => {
      const theme = series.theme || this.options.theme;
      const color = series.color || getThemeColor(theme);
      const lightColor = getThemeColor(theme, 400);

      const gradient = createLinearGradient(
        `bar-gradient-${index}`,
        [
          { offset: '0%', color: lightColor },
          { offset: '100%', color },
        ],
        this.options.orientation === 'vertical'
          ? { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
          : { x1: '0%', y1: '0%', x2: '100%', y2: '0%' }
      );
      this.defs!.appendChild(gradient);
    });

    if (this.options.scanlines) {
      const pattern = createScanlinesPattern('scanlines');
      this.defs.appendChild(pattern);
    }
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  private render(): void {
    if (!this.svg) {
      return;
    }

    if (this.chartArea) {
      this.svg.removeChild(this.chartArea);
    }

    this.chartArea = createGroup(`${this.options.classPrefix}__area`);
    this.svg.appendChild(this.chartArea);

    const padding = this.options.padding as ChartPadding;
    const chartWidth = this.options.width - padding.left - padding.right;
    const chartHeight = this.options.height - padding.top - padding.bottom;

    const isVertical = this.options.orientation === 'vertical';
    const { categoryScale, valueScale, categories, bandwidth } = this.calculateScales(
      chartWidth,
      chartHeight
    );

    this.renderAxes(chartWidth, chartHeight, categoryScale, valueScale, categories, isVertical);
    this.renderBars(chartWidth, chartHeight, categoryScale, valueScale, bandwidth, isVertical);

    if (this.options.legend.show && this.series.length > 1) {
      this.renderLegend();
    }

    if (this.options.scanlines) {
      this.renderScanlines();
    }
  }

  private calculateScales(chartWidth: number, chartHeight: number) {
    // Get all categories and values
    const categories: (string | number)[] = [];
    const allValues: number[] = [];

    this.series.forEach((series) => {
      series.data.forEach((point) => {
        if (!categories.includes(point.x as string | number)) {
          categories.push(point.x as string | number);
        }
        allValues.push(point.y);
      });
    });

    const isVertical = this.options.orientation === 'vertical';
    const categoryDimension = isVertical ? chartWidth : chartHeight;
    const valueDimension = isVertical ? chartHeight : chartWidth;

    // Category scale (band scale)
    const { scale: categoryScale, bandwidth } = createBandScale(
      categories,
      0,
      categoryDimension,
      this.options.groupGap
    );

    // Value scale
    const [minVal, maxVal] = niceExtent(
      Math.min(0, ...allValues),
      Math.max(...allValues),
      this.options.yAxis.ticks
    );

    const valueScale = isVertical
      ? createInvertedScale(minVal, maxVal, 0, valueDimension)
      : createLinearScale(minVal, maxVal, 0, valueDimension);

    return { categoryScale, valueScale, categories, bandwidth, minVal, maxVal };
  }

  private renderAxes(
    chartWidth: number,
    chartHeight: number,
    categoryScale: (value: string | number) => number,
    valueScale: (value: number) => number,
    categories: (string | number)[],
    isVertical: boolean
  ): void {
    if (!this.chartArea) {
      return;
    }

    const padding = this.options.padding as ChartPadding;
    const axisGroup = createGroup(
      `${this.options.classPrefix}__axes`,
      `translate(${padding.left}, ${padding.top})`
    );

    // Value axis (Y for vertical, X for horizontal)
    const valueAxisConfig = isVertical ? this.options.yAxis : this.options.xAxis;
    if (valueAxisConfig.show) {
      const valueAxisGroup = createGroup(`${this.options.classPrefix}__value-axis`);

      // Axis line
      const axisLine = isVertical
        ? createLine(0, 0, 0, chartHeight, { stroke: chartColors.axis })
        : createLine(0, chartHeight, chartWidth, chartHeight, { stroke: chartColors.axis });
      valueAxisGroup.appendChild(axisLine);

      // Ticks
      const ticks = generateTicks(0, 100, valueAxisConfig.ticks ?? 5);
      ticks.forEach((tick) => {
        const pos = valueScale(tick);

        if (valueAxisConfig.showGrid) {
          const gridLine = isVertical
            ? createLine(0, pos, chartWidth, pos, {
                stroke: chartColors.grid,
                strokeDasharray: '4 4',
              })
            : createLine(pos, 0, pos, chartHeight, {
                stroke: chartColors.grid,
                strokeDasharray: '4 4',
              });
          valueAxisGroup.appendChild(gridLine);
        }

        if (valueAxisConfig.showLabels) {
          const formatter = valueAxisConfig.formatLabel || String;
          const label = isVertical
            ? createText(-10, pos, formatter(tick), {
                fill: chartColors.text,
                fontSize: 11,
                textAnchor: 'end',
              })
            : createText(pos, chartHeight + 20, formatter(tick), {
                fill: chartColors.text,
                fontSize: 11,
              });
          valueAxisGroup.appendChild(label);
        }
      });

      axisGroup.appendChild(valueAxisGroup);
    }

    // Category axis (X for vertical, Y for horizontal)
    const categoryAxisConfig = isVertical ? this.options.xAxis : this.options.yAxis;
    if (categoryAxisConfig.show) {
      const categoryAxisGroup = createGroup(`${this.options.classPrefix}__category-axis`);

      const axisLine = isVertical
        ? createLine(0, chartHeight, chartWidth, chartHeight, { stroke: chartColors.axis })
        : createLine(0, 0, 0, chartHeight, { stroke: chartColors.axis });
      categoryAxisGroup.appendChild(axisLine);

      categories.forEach((cat) => {
        const pos = categoryScale(cat);

        if (categoryAxisConfig.showLabels) {
          const formatter = categoryAxisConfig.formatLabel || String;
          const label = isVertical
            ? createText(pos, chartHeight + 20, formatter(cat), {
                fill: chartColors.text,
                fontSize: 11,
              })
            : createText(-10, pos, formatter(cat), {
                fill: chartColors.text,
                fontSize: 11,
                textAnchor: 'end',
              });
          categoryAxisGroup.appendChild(label);
        }
      });

      axisGroup.appendChild(categoryAxisGroup);
    }

    this.chartArea.appendChild(axisGroup);
  }

  private renderBars(
    chartWidth: number,
    chartHeight: number,
    categoryScale: (value: string | number) => number,
    valueScale: (value: number) => number,
    bandwidth: number,
    isVertical: boolean
  ): void {
    if (!this.chartArea) {
      return;
    }

    const padding = this.options.padding as ChartPadding;
    const barsGroup = createGroup(
      `${this.options.classPrefix}__bars`,
      `translate(${padding.left}, ${padding.top})`
    );

    const seriesCount = this.series.length;
    const isStacked = this.options.groupMode === 'stacked';
    const barWidth = isStacked ? bandwidth : (bandwidth * (1 - this.options.barGap)) / seriesCount;

    // Track stacked values for each category
    const stackedValues: Map<string | number, number> = new Map();

    this.series.forEach((series, seriesIndex) => {
      if (series.visible === false) {
        return;
      }

      const theme = series.theme || this.options.theme;
      const _color = series.color || getThemeColor(theme);
      const seriesGroup = createGroup(`${this.options.classPrefix}__series`);
      seriesGroup.setAttribute('data-series-id', series.id);

      series.data.forEach((point, pointIndex) => {
        const categoryPos = categoryScale(point.x as string | number);
        const baseValue = isStacked ? stackedValues.get(point.x as string | number) || 0 : 0;
        const valuePos = valueScale(point.y + baseValue);
        const zeroPos = valueScale(baseValue);

        let x: number, y: number, width: number, height: number;

        if (isVertical) {
          const barX = isStacked
            ? categoryPos - bandwidth / 2
            : categoryPos -
              bandwidth / 2 +
              seriesIndex * barWidth +
              (bandwidth * this.options.barGap) / 2;

          x = barX;
          y = Math.min(valuePos, zeroPos);
          width = barWidth;
          height = Math.abs(zeroPos - valuePos);
        } else {
          const barY = isStacked
            ? categoryPos - bandwidth / 2
            : categoryPos -
              bandwidth / 2 +
              seriesIndex * barWidth +
              (bandwidth * this.options.barGap) / 2;

          x = Math.min(valuePos, zeroPos);
          y = barY;
          width = Math.abs(valuePos - zeroPos);
          height = barWidth;
        }

        const rect = createRect(x, y, width, height, {
          fill: `url(#bar-gradient-${seriesIndex})`,
          rx: this.options.borderRadius,
          ry: this.options.borderRadius,
          className: `${this.options.classPrefix}__bar`,
        });

        // Apply glow
        if (this.options.glow) {
          applyGlowFilter(rect, `glow-${theme}`);
        }

        // Add interaction
        rect.addEventListener('mouseenter', (e) => {
          this.handleBarHover(point, series, e, rect);
        });
        rect.addEventListener('mouseleave', () => {
          this.hideTooltip();
        });
        rect.addEventListener('click', (e) => {
          this.emit('barClick', {
            type: 'barClick',
            target: rect,
            data: { point, series },
            originalEvent: e,
          });
        });

        // Add animation
        if (this.options.animate) {
          const delay =
            this.options.animation.delay! + pointIndex * this.options.animation.stagger!;
          if (isVertical) {
            rect.setAttribute('height', '0');
            rect.setAttribute('y', String(chartHeight));
            rect.style.transition = `height ${this.options.animation.duration}ms, y ${this.options.animation.duration}ms`;
            rect.style.transitionDelay = `${delay}ms`;

            requestAnimationFrame(() => {
              rect.setAttribute('height', String(height));
              rect.setAttribute('y', String(y));
            });
          } else {
            rect.setAttribute('width', '0');
            rect.style.transition = `width ${this.options.animation.duration}ms`;
            rect.style.transitionDelay = `${delay}ms`;

            requestAnimationFrame(() => {
              rect.setAttribute('width', String(width));
            });
          }
        }

        seriesGroup.appendChild(rect);

        // Add value label
        if (this.options.showValues) {
          const formatter = this.options.yAxis.formatLabel || String;
          const labelX = isVertical ? x + width / 2 : x + width + 5;
          const labelY = isVertical ? y - 5 : y + height / 2;

          const valueLabel = createText(labelX, labelY, formatter(point.y), {
            fill: chartColors.text,
            fontSize: 10,
            textAnchor: isVertical ? 'middle' : 'start',
          });

          if (this.options.animate) {
            valueLabel.style.opacity = '0';
            valueLabel.style.transition = `opacity ${this.options.animation.duration}ms`;
            valueLabel.style.transitionDelay = `${this.options.animation.duration}ms`;
            requestAnimationFrame(() => {
              valueLabel.style.opacity = '1';
            });
          }

          seriesGroup.appendChild(valueLabel);
        }

        // Update stacked value
        if (isStacked) {
          stackedValues.set(point.x as string | number, baseValue + point.y);
        }
      });

      barsGroup.appendChild(seriesGroup);
    });

    this.chartArea.appendChild(barsGroup);
  }

  private renderLegend(): void {
    if (!this.svg) {
      return;
    }

    const legendGroup = createGroup(`${this.options.classPrefix}__legend`);
    const itemSpacing = 100;
    const iconSize = 12;

    let startX = this.options.width - 20;
    const y = 15;

    [...this.series].reverse().forEach((series) => {
      const theme = series.theme || this.options.theme;
      const color = series.color || getThemeColor(theme);

      const icon = createRect(startX - itemSpacing + 20, y - iconSize / 2, iconSize, iconSize, {
        fill: color,
        rx: 2,
      });
      legendGroup.appendChild(icon);

      const text = createText(startX - itemSpacing + 20 + iconSize + 8, y, series.name, {
        fill: chartColors.text,
        fontSize: 11,
        textAnchor: 'start',
      });
      legendGroup.appendChild(text);

      startX -= itemSpacing;
    });

    this.svg.appendChild(legendGroup);
  }

  private renderScanlines(): void {
    if (!this.svg) {
      return;
    }

    const scanlineRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    scanlineRect.setAttribute('x', '0');
    scanlineRect.setAttribute('y', '0');
    scanlineRect.setAttribute('width', String(this.options.width));
    scanlineRect.setAttribute('height', String(this.options.height));
    scanlineRect.setAttribute('fill', 'url(#scanlines)');
    scanlineRect.setAttribute('pointer-events', 'none');

    this.svg.appendChild(scanlineRect);
  }

  // ==========================================================================
  // Tooltip
  // ==========================================================================

  private createTooltip(): void {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = `${this.options.classPrefix}__tooltip`;
    this.tooltipElement.style.cssText = `
      position: absolute;
      pointer-events: none;
      background: ${chartColors.tooltipBg};
      border: 1px solid ${chartColors.tooltipBorder};
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 12px;
      color: ${chartColors.text};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.15s;
    `;
    document.body.appendChild(this.tooltipElement);
  }

  private showTooltip(content: string, x: number, y: number): void {
    if (!this.tooltipElement) {
      return;
    }

    this.tooltipElement.innerHTML = content;
    this.tooltipElement.style.opacity = '1';

    const rect = this.container.getBoundingClientRect();
    this.tooltipElement.style.left = `${rect.left + x + 15}px`;
    this.tooltipElement.style.top = `${rect.top + y - 10}px`;
  }

  private hideTooltip(): void {
    if (!this.tooltipElement) {
      return;
    }
    this.tooltipElement.style.opacity = '0';
  }

  private handleBarHover(
    point: DataPoint,
    series: DataSeries,
    event: MouseEvent,
    element: SVGElement
  ): void {
    this.emit('barHover', {
      type: 'barHover',
      target: element,
      data: { point, series },
      originalEvent: event,
    });

    if (this.options.tooltip.enabled) {
      let content: string;
      if (this.options.tooltip.formatter) {
        content = this.options.tooltip.formatter(point, series);
      } else {
        const theme = series.theme || this.options.theme;
        const color = series.color || getThemeColor(theme);
        content = `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="width: 10px; height: 10px; background: ${color}; border-radius: 2px;"></span>
            <strong>${series.name}</strong>
          </div>
          <div>${point.label || String(point.x)}: <strong style="color: ${color}">${point.y}</strong></div>
        `;
      }

      const barRect = element.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      const x = barRect.left - containerRect.left + barRect.width / 2;
      const y = barRect.top - containerRect.top;
      this.showTooltip(content, x, y);
    }
  }

  // ==========================================================================
  // Responsive
  // ==========================================================================

  private setupResponsive(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        this.resize(width, height);
      }
    });
    this.resizeObserver.observe(this.container);
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  update(data: DataPoint[] | DataSeries[]): void {
    this.series = this.normalizeData(data);
    this.options.data = data;

    if (this.defs) {
      clearElement(this.defs);
      this.createDefinitions();
    }

    this.render();
  }

  setOptions(options: Partial<BarChartOptions>): void {
    this.options = this.mergeOptions({ ...this.options, ...options });
    if (options.data) {
      this.series = this.normalizeData(options.data);
    }
    this.render();
  }

  resize(width?: number, height?: number): void {
    if (width) {
      this.options.width = width;
    }
    if (height) {
      this.options.height = height;
    }

    if (this.svg) {
      this.svg.setAttribute('width', String(this.options.width));
      this.svg.setAttribute('height', String(this.options.height));
      this.svg.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
    }

    this.render();
    this.emit('resize', {
      type: 'resize',
      target: null,
      data: { width: this.options.width, height: this.options.height },
    });
  }

  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
    }

    clearElement(this.container);

    this.svg = null;
    this.defs = null;
    this.chartArea = null;
    this.eventHandlers.clear();
  }

  getSVG(): SVGSVGElement {
    if (!this.svg) {
      throw new Error('Chart not initialized');
    }
    return this.svg;
  }

  toSVG(): string {
    if (!this.svg) {
      throw new Error('Chart not initialized');
    }
    return svgToString(this.svg);
  }

  on<T = unknown>(event: ChartEventType, handler: ChartEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as ChartEventHandler);
  }

  off(event: ChartEventType, handler?: ChartEventHandler): void {
    if (!handler) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.get(event)?.delete(handler);
    }
  }

  private emit<T = unknown>(event: ChartEventType, data: ChartEvent<T>): void {
    this.eventHandlers.get(event)?.forEach((handler) => handler(data as ChartEvent));
  }
}

export default BarChart;
