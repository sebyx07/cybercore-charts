/**
 * CyberCore Charts - Ember Bar Chart Component
 * Glimmer component wrapper for BarChart with Octane patterns
 */

import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import { BarChart } from '../../charts/BarChart';
import type {
  BarChartOptions,
  DataPoint,
  DataSeries,
  ChartTheme,
  ChartEventHandler,
  AxisConfig,
  LegendConfig,
  TooltipConfig,
  AnimationConfig,
  GlowConfig,
  BarOrientation,
  BarGroupMode,
} from '../../types';

/**
 * Arguments for the CyberBarChart component
 */
export interface CyberBarChartArgs {
  /** Chart data - single series or multiple */
  data: DataPoint[] | DataSeries[];
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Color theme */
  theme?: ChartTheme;
  /** Bar orientation */
  orientation?: BarOrientation;
  /** Grouping mode for multiple series */
  groupMode?: BarGroupMode;
  /** Bar corner radius */
  borderRadius?: number;
  /** Gap between bars (0-1, percentage of bar width) */
  barGap?: number;
  /** Gap between bar groups (0-1) */
  groupGap?: number;
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
  /** Show value labels on bars */
  showValues?: boolean;
  /** Value label position */
  valuePosition?: 'inside' | 'outside' | 'center';
  /** Accessibility label */
  ariaLabel?: string;
  /** Event handler for bar hover */
  onBarHover?: ChartEventHandler;
  /** Event handler for bar click */
  onBarClick?: ChartEventHandler;
  /** Event handler for resize */
  onResize?: ChartEventHandler;
}

/**
 * Signature for the CyberBarChart component
 */
export interface CyberBarChartSignature {
  Args: CyberBarChartArgs;
  Element: HTMLDivElement;
  Blocks: {
    default: [];
  };
}

/**
 * Ember Glimmer component for rendering cyberpunk-styled bar charts
 *
 * @example
 * ```hbs
 * <CyberBarChart
 *   @data={{this.chartData}}
 *   @theme="magenta"
 *   @orientation="vertical"
 *   @groupMode="grouped"
 *   @animate={{true}}
 *   @onBarClick={{this.handleBarClick}}
 * />
 * ```
 */
export default class CyberBarChart extends Component<CyberBarChartSignature> {
  /**
   * Reference to the underlying BarChart instance
   */
  @tracked chart: BarChart | null = null;

  /**
   * Reference to the container element
   */
  private containerElement: HTMLElement | null = null;

  /**
   * Build chart options from component args
   */
  private get chartOptions(): BarChartOptions {
    const { args } = this;
    return {
      data: args.data,
      width: args.width,
      height: args.height,
      theme: args.theme,
      orientation: args.orientation,
      groupMode: args.groupMode,
      borderRadius: args.borderRadius,
      barGap: args.barGap,
      groupGap: args.groupGap,
      animate: args.animate,
      animation: args.animation,
      glow: args.glow,
      scanlines: args.scanlines,
      responsive: args.responsive,
      xAxis: args.xAxis,
      yAxis: args.yAxis,
      legend: args.legend,
      tooltip: args.tooltip,
      showValues: args.showValues,
      valuePosition: args.valuePosition,
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
    this.chart = new BarChart(this.containerElement, this.chartOptions);

    // Attach event handlers
    this.attachEventHandlers();
  }

  /**
   * Attach event handlers from args to chart
   */
  private attachEventHandlers(): void {
    if (!this.chart) return;

    if (this.args.onBarHover) {
      this.chart.on('barHover', this.args.onBarHover);
    }

    if (this.args.onBarClick) {
      this.chart.on('barClick', this.args.onBarClick);
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
