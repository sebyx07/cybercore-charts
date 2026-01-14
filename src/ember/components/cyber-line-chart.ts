/**
 * CyberCore Charts - Ember Line Chart Component
 * Glimmer component wrapper for LineChart with Octane patterns
 */

import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import { LineChart } from '../../charts/LineChart';
import type {
  LineChartOptions,
  DataPoint,
  DataSeries,
  ChartTheme,
  ChartEventType,
  ChartEventHandler,
  AxisConfig,
  LegendConfig,
  TooltipConfig,
  AnimationConfig,
  GlowConfig,
  LineInterpolation,
} from '../../types';

/**
 * Arguments for the CyberLineChart component
 */
export interface CyberLineChartArgs {
  /** Chart data - single series or multiple */
  data: DataPoint[] | DataSeries[];
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Color theme */
  theme?: ChartTheme;
  /** Fill area under the line */
  showArea?: boolean;
  /** Area fill opacity (0-1) */
  areaOpacity?: number;
  /** Show data points */
  showPoints?: boolean;
  /** Point radius */
  pointRadius?: number;
  /** Line width */
  lineWidth?: number;
  /** Line interpolation method */
  interpolation?: LineInterpolation;
  /** Enable animations */
  animate?: boolean;
  /** Animation configuration */
  animation?: AnimationConfig;
  /** Enable glow effects */
  glow?: boolean | GlowConfig;
  /** Show scanlines overlay */
  scanlines?: boolean;
  /** Responsive - auto-resize on container resize */
  responsive?: boolean;
  /** X-axis configuration */
  xAxis?: AxisConfig;
  /** Y-axis configuration */
  yAxis?: AxisConfig;
  /** Legend configuration */
  legend?: LegendConfig;
  /** Tooltip configuration */
  tooltip?: TooltipConfig;
  /** Connect null/missing values */
  connectNulls?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
  /** Event handler for point hover */
  onPointHover?: ChartEventHandler;
  /** Event handler for point click */
  onPointClick?: ChartEventHandler;
  /** Event handler for resize */
  onResize?: ChartEventHandler;
}

/**
 * Signature for the CyberLineChart component
 */
export interface CyberLineChartSignature {
  Args: CyberLineChartArgs;
  Element: HTMLDivElement;
  Blocks: {
    default: [];
  };
}

/**
 * Ember Glimmer component for rendering cyberpunk-styled line charts
 *
 * @example
 * ```hbs
 * <CyberLineChart
 *   @data={{this.chartData}}
 *   @theme="cyan"
 *   @showArea={{true}}
 *   @animate={{true}}
 *   @onPointClick={{this.handlePointClick}}
 * />
 * ```
 */
export default class CyberLineChart extends Component<CyberLineChartSignature> {
  /**
   * Reference to the underlying LineChart instance
   */
  @tracked chart: LineChart | null = null;

  /**
   * Reference to the container element
   */
  private containerElement: HTMLElement | null = null;

  /**
   * Build chart options from component args
   */
  private get chartOptions(): LineChartOptions {
    const { args } = this;
    return {
      data: args.data,
      width: args.width,
      height: args.height,
      theme: args.theme,
      showArea: args.showArea,
      areaOpacity: args.areaOpacity,
      showPoints: args.showPoints,
      pointRadius: args.pointRadius,
      lineWidth: args.lineWidth,
      interpolation: args.interpolation,
      animate: args.animate,
      animation: args.animation,
      glow: args.glow,
      scanlines: args.scanlines,
      responsive: args.responsive,
      xAxis: args.xAxis,
      yAxis: args.yAxis,
      legend: args.legend,
      tooltip: args.tooltip,
      connectNulls: args.connectNulls,
      ariaLabel: args.ariaLabel,
    };
  }

  /**
   * Setup chart when element is inserted into DOM
   * Use with {{did-insert}} modifier
   */
  @action
  setupChart(element: HTMLElement): void {
    this.containerElement = element;
    this.createChart();
  }

  /**
   * Update chart when args change
   * Use with {{did-update}} modifier
   */
  @action
  updateChart(): void {
    if (this.chart) {
      // Update data if it changed
      if (this.args.data) {
        this.chart.update(this.args.data);
      }

      // Update options
      this.chart.setOptions(this.chartOptions);
    } else if (this.containerElement) {
      // Chart was destroyed, recreate it
      this.createChart();
    }
  }

  /**
   * Create the chart instance
   */
  private createChart(): void {
    if (!this.containerElement) return;

    // Destroy existing chart if any
    this.chart?.destroy();

    // Create new chart
    this.chart = new LineChart(this.containerElement, this.chartOptions);

    // Attach event handlers
    this.attachEventHandlers();
  }

  /**
   * Attach event handlers from args to chart
   */
  private attachEventHandlers(): void {
    if (!this.chart) return;

    if (this.args.onPointHover) {
      this.chart.on('pointHover', this.args.onPointHover);
    }

    if (this.args.onPointClick) {
      this.chart.on('pointClick', this.args.onPointClick);
    }

    if (this.args.onResize) {
      this.chart.on('resize', this.args.onResize);
    }
  }

  /**
   * Export chart as SVG string
   */
  @action
  toSVG(): string {
    if (!this.chart) {
      throw new Error('Chart not initialized');
    }
    return this.chart.toSVG();
  }

  /**
   * Get the underlying SVG element
   */
  @action
  getSVG(): SVGSVGElement | null {
    return this.chart?.getSVG() ?? null;
  }

  /**
   * Manually resize the chart
   */
  @action
  resize(width?: number, height?: number): void {
    this.chart?.resize(width, height);
  }

  /**
   * Cleanup when component is destroyed
   */
  willDestroy(): void {
    super.willDestroy();
    this.chart?.destroy();
    this.chart = null;
    this.containerElement = null;
  }
}
