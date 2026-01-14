/**
 * CyberCore Charts - Line Chart
 * SVG line chart with cyberpunk styling, area fills, and glow effects
 */

import { LAYOUT } from '../constants';
import { CHART_THEMES, chartColors, getThemeColor } from '../utils/colors';
import {
  createBandScale,
  createInvertedScale,
  createLinearScale,
  generateTicks,
  niceExtent,
  smoothPath,
  stepPath,
  simplifyPath,
} from '../utils/math';
import { ResponsiveManager } from '../utils/ResponsiveManager';
import {
  createSVGRoot,
  createDefs,
  createGroup,
  createPath,
  createAreaPath,
  createCircle,
  createLine,
  createText,
  createGlowFilter,
  createLinearGradient,
  createScanlinesPattern,
  pointsToPath,
  clearElement,
  applyGlowFilter,
} from '../utils/svg';
import { TooltipManager } from '../utils/TooltipManager';

import { BaseChart } from './BaseChart';

import type { ChartPadding, DataPoint, DataSeries, LineChartOptions, Point } from '../types';

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<LineChartOptions, 'data'>> = {
  width: 400,
  height: 300,
  padding: { top: 20, right: 20, bottom: 40, left: 50 },
  theme: 'cyan',
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
  ariaLabel: 'Line chart',
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

// ============================================================================
// LineChart Class
// ============================================================================

export class LineChart extends BaseChart<
  Required<Omit<LineChartOptions, 'data'>> & { data: DataPoint[] | DataSeries[] },
  DataPoint[] | DataSeries[]
> {
  private series: DataSeries[] = [];
  private tooltipManager: TooltipManager | null = null;
  private responsiveManager: ResponsiveManager | null = null;

  constructor(container: HTMLElement | string, options: LineChartOptions) {
    // Merge options with defaults before calling super
    const mergedOptions = LineChart.mergeOptionsStatic(options);

    // Call parent constructor with merged options
    super(container, mergedOptions, { width: 400, height: 300 });

    // Validate and fix dimensions using BaseChart's method
    const dims = this.validateDimensions(this.options.width, this.options.height, 'LineChart');
    this.options.width = dims.width;
    this.options.height = dims.height;

    // Normalize data to series format
    this.series = this.normalizeData(this.options.data);

    // Initialize the chart
    this.init();
  }

  // ==========================================================================
  // Static Option Merging
  // ==========================================================================

  private static mergeOptionsStatic(
    options: LineChartOptions
  ): Required<Omit<LineChartOptions, 'data'>> & { data: DataPoint[] | DataSeries[] } {
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

    // Handle glow config
    if (typeof options.glow === 'boolean') {
      merged.glow = options.glow;
    } else if (options.glow) {
      merged.glow = { enabled: true, ...options.glow };
    }

    return merged as Required<Omit<LineChartOptions, 'data'>> & {
      data: DataPoint[] | DataSeries[];
    };
  }

  // ==========================================================================
  // Instance Option Merging (for setOptions)
  // ==========================================================================

  private mergeOptions(
    options: LineChartOptions
  ): Required<Omit<LineChartOptions, 'data'>> & { data: DataPoint[] | DataSeries[] } {
    return LineChart.mergeOptionsStatic(options);
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private normalizeData(data: DataPoint[] | DataSeries[]): DataSeries[] {
    if (data.length === 0) {
      return [];
    }

    // Check if it's already series format
    if ('data' in data[0] && Array.isArray(data[0].data)) {
      return data as DataSeries[];
    }

    // Convert single series to array format
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
    // Clear container
    clearElement(this.container);

    // Create SVG structure
    this.createSVG();
    this.createDefinitions();
    this.render();

    // Set up responsive behavior using ResponsiveManager
    if (this.options.responsive) {
      this.responsiveManager = new ResponsiveManager(
        this.container,
        (w, h) => this.resize(w, h),
        true
      );
      this.responsiveManager.setup();
    }

    // Create tooltip using TooltipManager
    if (this.options.tooltip.enabled) {
      this.tooltipManager = new TooltipManager(this.container, this.options.tooltip);
      this.tooltipManager.create();
    }
  }

  private createSVG(): void {
    this.svg = createSVGRoot(this.options.width, this.options.height, {
      classPrefix: this.options.classPrefix,
      ariaLabel: this.options.ariaLabel,
    });

    this.container.appendChild(this.svg);
  }

  /**
   * Creates SVG definitions (filters, gradients, patterns).
   * Implements the abstract method from BaseChart.
   */
  protected createDefinitions(): void {
    if (!this.svg) {
      return;
    }

    this.defs = createDefs();
    this.svg.appendChild(this.defs);

    // Create glow filter for each theme
    CHART_THEMES.forEach((theme) => {
      const glowConfig = typeof this.options.glow === 'object' ? this.options.glow : {};
      const filter = createGlowFilter(`glow-${theme}`, theme, glowConfig);
      this.defs!.appendChild(filter);
    });

    // Create area gradients for each series
    this.series.forEach((series, index) => {
      const theme = series.theme || this.options.theme;
      const color = series.color || getThemeColor(theme);
      const gradient = createLinearGradient(`area-gradient-${index}`, [
        { offset: '0%', color, opacity: this.options.areaOpacity },
        { offset: '100%', color, opacity: 0 },
      ]);
      this.defs!.appendChild(gradient);
    });

    // Create scanlines pattern if enabled
    if (this.options.scanlines) {
      const pattern = createScanlinesPattern('scanlines');
      this.defs.appendChild(pattern);
    }
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  /**
   * Renders the chart.
   * Implements the abstract method from BaseChart.
   */
  render(): void {
    if (!this.svg) {
      return;
    }

    // Clear existing chart area
    if (this.chartArea) {
      this.svg.removeChild(this.chartArea);
    }

    this.chartArea = createGroup(`${this.options.classPrefix}__area`);
    this.svg.appendChild(this.chartArea);

    // Get chart dimensions
    const padding = this.options.padding as ChartPadding;
    const chartWidth = this.options.width - padding.left - padding.right;
    const chartHeight = this.options.height - padding.top - padding.bottom;

    // Calculate scales
    const { xScale, yScale, xLabels } = this.calculateScales(chartWidth, chartHeight);

    // Render axes
    if (this.options.xAxis.show || this.options.yAxis.show) {
      this.renderAxes(chartWidth, chartHeight, xScale, yScale, xLabels);
    }

    // Render series
    this.renderSeries(chartWidth, chartHeight, xScale, yScale);

    // Render legend
    if (this.options.legend.show && this.series.length > 1) {
      this.renderLegend();
    }

    // Apply scanlines overlay
    if (this.options.scanlines) {
      this.renderScanlines();
    }
  }

  private calculateScales(chartWidth: number, chartHeight: number) {
    // Get all Y values across all series
    const allYValues: number[] = [];
    const allXValues: (string | number)[] = [];

    this.series.forEach((series) => {
      series.data.forEach((point) => {
        // Filter out invalid Y values (NaN, undefined, null, or non-finite)
        if (typeof point.y === 'number' && isFinite(point.y)) {
          allYValues.push(point.y);
        }
        if (!allXValues.includes(point.x as string | number)) {
          allXValues.push(point.x as string | number);
        }
      });
    });

    // Handle empty data case
    if (allYValues.length === 0) {
      console.warn('LineChart: No valid Y data points found, using default scale [0, 100]');
    }

    // Calculate Y extent with nice bounds
    // Use safe defaults when array is empty to avoid Infinity/-Infinity
    const yMinValue =
      allYValues.length > 0 ? Math.min(0, ...allYValues) : (this.options.yAxis.min ?? 0);
    const yMaxValue =
      allYValues.length > 0 ? Math.max(...allYValues) : (this.options.yAxis.max ?? 100);

    const [yMin, yMax] = niceExtent(
      this.options.yAxis.min ?? yMinValue,
      this.options.yAxis.max ?? yMaxValue,
      this.options.yAxis.ticks
    );

    const yScale = createInvertedScale(yMin, yMax, 0, chartHeight);

    // Calculate X scale - categorical or numeric
    let xScale: (value: string | number) => number;
    const xLabels: (string | number)[] = allXValues;

    // Handle empty X values
    if (allXValues.length === 0) {
      console.warn('LineChart: No X data points found');
      xScale = () => 0;
      return { xScale, yScale, xLabels, yMin, yMax };
    }

    const firstX = allXValues[0];
    if (typeof firstX === 'number') {
      const xMin = this.options.xAxis.min ?? Math.min(...(allXValues as number[]));
      const xMax = this.options.xAxis.max ?? Math.max(...(allXValues as number[]));
      const linearXScale = createLinearScale(xMin, xMax, 0, chartWidth);
      xScale = (value: string | number) => linearXScale(value as number);
    } else {
      const bandScale = createBandScale(allXValues, 0, chartWidth, 0.1);
      xScale = (value) => bandScale.scale(value) + bandScale.bandwidth / 2;
    }

    return { xScale, yScale, xLabels, yMin, yMax };
  }

  private renderAxes(
    chartWidth: number,
    chartHeight: number,
    xScale: (value: string | number) => number,
    yScale: (value: number) => number,
    xLabels: (string | number)[]
  ): void {
    if (!this.chartArea) {
      return;
    }

    const padding = this.options.padding as ChartPadding;
    const axisGroup = createGroup(
      `${this.options.classPrefix}__axes`,
      `translate(${padding.left}, ${padding.top})`
    );

    // Y-axis
    if (this.options.yAxis.show) {
      const yAxisGroup = createGroup(`${this.options.classPrefix}__y-axis`);

      // Axis line
      const yAxisLine = createLine(0, 0, 0, chartHeight, {
        stroke: chartColors.axis,
        className: `${this.options.classPrefix}__axis-line`,
      });
      yAxisGroup.appendChild(yAxisLine);

      // Y ticks and labels
      const yTicks = generateTicks(
        this.options.yAxis.min ?? 0,
        this.options.yAxis.max ?? 100,
        this.options.yAxis.ticks ?? 5
      );

      yTicks.forEach((tick) => {
        const y = yScale(tick);

        // Grid line
        if (this.options.yAxis.showGrid) {
          const gridLine = createLine(0, y, chartWidth, y, {
            stroke: chartColors.grid,
            strokeDasharray: '4 4',
            className: `${this.options.classPrefix}__grid-line`,
          });
          yAxisGroup.appendChild(gridLine);
        }

        // Tick label
        if (this.options.yAxis.showLabels) {
          const formatter = this.options.yAxis.formatLabel || String;
          const label = createText(-10, y, formatter(tick), {
            fill: chartColors.text,
            fontSize: 11,
            textAnchor: 'end',
            className: `${this.options.classPrefix}__tick-label`,
          });
          yAxisGroup.appendChild(label);
        }
      });

      axisGroup.appendChild(yAxisGroup);
    }

    // X-axis
    if (this.options.xAxis.show) {
      const xAxisGroup = createGroup(`${this.options.classPrefix}__x-axis`);

      // Axis line
      const xAxisLine = createLine(0, chartHeight, chartWidth, chartHeight, {
        stroke: chartColors.axis,
        className: `${this.options.classPrefix}__axis-line`,
      });
      xAxisGroup.appendChild(xAxisLine);

      // X ticks and labels
      const labelStep = Math.ceil(xLabels.length / (this.options.xAxis.ticks || 5));
      xLabels.forEach((label, index) => {
        if (index % labelStep !== 0 && index !== xLabels.length - 1) {
          return;
        }

        const x = xScale(label);

        // Grid line
        if (this.options.xAxis.showGrid) {
          const gridLine = createLine(x, 0, x, chartHeight, {
            stroke: chartColors.grid,
            strokeDasharray: '4 4',
            className: `${this.options.classPrefix}__grid-line`,
          });
          xAxisGroup.appendChild(gridLine);
        }

        // Tick label
        if (this.options.xAxis.showLabels) {
          const formatter = this.options.xAxis.formatLabel || String;
          const text = createText(x, chartHeight + 20, formatter(label), {
            fill: chartColors.text,
            fontSize: 11,
            className: `${this.options.classPrefix}__tick-label`,
          });
          xAxisGroup.appendChild(text);
        }
      });

      axisGroup.appendChild(xAxisGroup);
    }

    this.chartArea.appendChild(axisGroup);
  }

  private renderSeries(
    chartWidth: number,
    chartHeight: number,
    xScale: (value: string | number) => number,
    yScale: (value: number) => number
  ): void {
    if (!this.chartArea) {
      return;
    }

    const padding = this.options.padding as ChartPadding;

    this.series.forEach((series, seriesIndex) => {
      if (series.visible === false) {
        return;
      }

      const seriesGroup = createGroup(
        `${this.options.classPrefix}__series`,
        `translate(${padding.left}, ${padding.top})`
      );
      seriesGroup.setAttribute('data-series-id', series.id);

      const theme = series.theme || this.options.theme;
      const color = series.color || getThemeColor(theme);

      // Convert data points to coordinates
      let points: Point[] = series.data.map((point) => ({
        x: xScale(point.x as string | number),
        y: yScale(point.y),
      }));

      // Apply point reduction for large datasets to improve performance
      const maxPoints = this.options.maxPoints;
      if (maxPoints > 0 && maxPoints !== Infinity && points.length > maxPoints) {
        points = simplifyPath(points, this.options.simplifyTolerance);
      }

      // Render area fill
      if (this.options.showArea && points.length > 0) {
        const areaPath = createAreaPath(points, chartHeight, {
          fill: `url(#area-gradient-${seriesIndex})`,
          className: `${this.options.classPrefix}__area-fill`,
        });
        seriesGroup.appendChild(areaPath);
      }

      // Render line
      if (points.length > 1) {
        let pathData: string;

        switch (this.options.interpolation) {
          case 'smooth':
            pathData = smoothPath(points, 0.5);
            break;
          case 'step':
            pathData = stepPath(points, 'middle');
            break;
          case 'stepBefore':
            pathData = stepPath(points, 'before');
            break;
          case 'stepAfter':
            pathData = stepPath(points, 'after');
            break;
          default:
            pathData = pointsToPath(points);
        }

        const linePath = createPath(pathData, {
          stroke: color,
          strokeWidth: this.options.lineWidth,
          className: `${this.options.classPrefix}__line`,
        });

        // Apply glow effect
        if (this.options.glow) {
          applyGlowFilter(linePath, `glow-${theme}`);
        }

        // Add animation
        if (this.shouldAnimate()) {
          this.animatePath(linePath);
        }

        seriesGroup.appendChild(linePath);
      }

      // Render data points
      if (this.options.showPoints) {
        const pointsGroup = createGroup(`${this.options.classPrefix}__points`);

        points.forEach((point, pointIndex) => {
          const dataPoint = series.data[pointIndex];
          const circle = createCircle(point.x, point.y, this.options.pointRadius, {
            fill: color,
            className: `${this.options.classPrefix}__point`,
          });

          // Add hover interaction
          circle.addEventListener('mouseenter', (e) => {
            this.handlePointHover(dataPoint, series, e, circle);
          });
          circle.addEventListener('mouseleave', () => {
            this.hideTooltip();
          });
          circle.addEventListener('click', (e) => {
            this.emit('pointClick', {
              type: 'pointClick',
              target: circle,
              data: { point: dataPoint, series },
              originalEvent: e,
            });
          });

          // Add animation delay for staggered effect
          if (this.shouldAnimate()) {
            const delay =
              this.options.animation.delay! + pointIndex * this.options.animation.stagger!;
            circle.style.opacity = '0';
            circle.style.transform = 'scale(0)';
            circle.style.transformOrigin = `${point.x}px ${point.y}px`;
            circle.style.transition = `opacity ${this.options.animation.duration}ms, transform ${this.options.animation.duration}ms`;
            circle.style.transitionDelay = `${delay}ms`;

            requestAnimationFrame(() => {
              circle.style.opacity = '1';
              circle.style.transform = 'scale(1)';
            });
          }

          pointsGroup.appendChild(circle);
        });

        seriesGroup.appendChild(pointsGroup);
      }

      this.chartArea!.appendChild(seriesGroup);
    });
  }

  private renderLegend(): void {
    if (!this.svg) {
      return;
    }

    const legendGroup = createGroup(`${this.options.classPrefix}__legend`);
    const { ITEM_SPACING, ICON_SIZE, TOP_MARGIN, RIGHT_MARGIN, ICON_TEXT_GAP } = LAYOUT.LEGEND;

    let startX = this.options.width - RIGHT_MARGIN;
    const y = TOP_MARGIN;

    // Render in reverse order for right alignment
    [...this.series].reverse().forEach((series) => {
      const theme = series.theme || this.options.theme;
      const color = series.color || getThemeColor(theme);

      // Legend icon (small line)
      const icon = createLine(
        startX - ITEM_SPACING + RIGHT_MARGIN,
        y,
        startX - ITEM_SPACING + RIGHT_MARGIN + ICON_SIZE,
        y,
        {
          stroke: color,
          strokeWidth: 2,
        }
      );
      legendGroup.appendChild(icon);

      // Legend text
      const text = createText(
        startX - ITEM_SPACING + RIGHT_MARGIN + ICON_SIZE + ICON_TEXT_GAP,
        y,
        series.name,
        {
          fill: chartColors.text,
          fontSize: 11,
          textAnchor: 'start',
        }
      );
      legendGroup.appendChild(text);

      startX -= ITEM_SPACING;
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

  private animatePath(path: SVGPathElement): void {
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.style.transition = `stroke-dashoffset ${this.options.animation.duration}ms ${this.options.animation.easing}`;

    // Trigger animation
    requestAnimationFrame(() => {
      path.style.strokeDashoffset = '0';
    });
  }

  // ==========================================================================
  // Tooltip Handling
  // ==========================================================================

  private handlePointHover(
    point: DataPoint,
    series: DataSeries,
    event: MouseEvent,
    element: SVGElement
  ): void {
    // Emit hover event
    this.emit('pointHover', {
      type: 'pointHover',
      target: element,
      data: { point, series },
      originalEvent: event,
    });

    // Show tooltip using TooltipManager
    if (this.tooltipManager && this.options.tooltip.enabled) {
      let content: string | HTMLElement;
      if (this.options.tooltip.formatter) {
        // Custom formatters return strings - treat as plain text for safety
        content = this.options.tooltip.formatter(point, series);
      } else {
        const theme = series.theme || this.options.theme;
        const color = series.color || getThemeColor(theme);

        // Use TooltipManager's helper to create content
        content = TooltipManager.createDataPointContent(
          series.name,
          color,
          point.label || String(point.x),
          point.y,
          'circle'
        );
      }

      // Get position relative to the container for tooltip placement
      const containerRect = this.container.getBoundingClientRect();
      const padding = this.options.padding as ChartPadding;
      const circleX = parseFloat(element.getAttribute('cx') || '0') + padding.left;
      const circleY = parseFloat(element.getAttribute('cy') || '0') + padding.top;

      // TooltipManager expects viewport-relative coordinates
      this.tooltipManager.show(content, containerRect.left + circleX, containerRect.top + circleY);
    }
  }

  /**
   * Hide the tooltip (called on mouseout events)
   * Overrides the BaseChart method to use TooltipManager
   */
  protected override hideTooltip(): void {
    this.tooltipManager?.hide();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update chart with new data
   */
  update(data: DataPoint[] | DataSeries[]): void {
    this.series = this.normalizeData(data);
    this.options.data = data;

    // Re-create definitions for new data
    if (this.defs) {
      clearElement(this.defs);
      this.createDefinitions();
    }

    this.render();
  }

  /**
   * Update chart options
   */
  setOptions(options: Partial<LineChartOptions>): void {
    this.options = this.mergeOptions({ ...this.options, ...options });
    if (options.data) {
      this.series = this.normalizeData(options.data);
    }
    this.render();
  }

  /**
   * Resize chart
   */
  resize(width?: number, height?: number): void {
    if (width) {
      this.options.width = width;
    }
    if (height) {
      this.options.height = height;
    }

    // Use inherited helper to update SVG dimensions
    this.updateSVGDimensions(this.options.width, this.options.height);

    this.render();
    this.emit('resize', {
      type: 'resize',
      target: null,
      data: { width: this.options.width, height: this.options.height },
    });
  }

  /**
   * Destroy chart and clean up
   */
  override destroy(): void {
    // Clean up LineChart-specific resources first
    // Destroy TooltipManager
    this.tooltipManager?.destroy();
    this.tooltipManager = null;

    // Destroy ResponsiveManager
    this.responsiveManager?.destroy();
    this.responsiveManager = null;

    // Clear series data
    this.series = [];

    // Call parent destroy to clean up base resources
    super.destroy();
  }
}

export default LineChart;
