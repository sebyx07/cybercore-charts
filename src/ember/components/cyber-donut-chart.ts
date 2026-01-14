/**
 * CyberCore Charts - Ember Donut Chart Component
 * Glimmer component wrapper for DonutChart with Octane patterns
 */

import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import { DonutChart } from '../../charts/DonutChart';
import type {
  DonutChartOptions,
  DonutSegment,
  ChartTheme,
  ChartEventHandler,
  LegendConfig,
  TooltipConfig,
  AnimationConfig,
  GlowConfig,
} from '../../types';

/**
 * Arguments for the CyberDonutChart component
 */
export interface CyberDonutChartArgs {
  /** Chart data */
  data: DonutSegment[];
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Color theme */
  theme?: ChartTheme;
  /** Inner radius ratio (0 = pie, 0.5 = donut) */
  innerRadius?: number;
  /** Gap between segments in degrees */
  segmentGap?: number;
  /** Show labels */
  showLabels?: boolean;
  /** Label position */
  labelPosition?: 'inside' | 'outside';
  /** Show percentages */
  showPercentages?: boolean;
  /** Center text (for donut) */
  centerText?: string;
  /** Center subtext */
  centerSubtext?: string;
  /** Starting angle in degrees */
  startAngle?: number;
  /** Sort segments by value */
  sortSegments?: boolean | 'asc' | 'desc';
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
  /** Legend configuration */
  legend?: LegendConfig;
  /** Tooltip configuration */
  tooltip?: TooltipConfig;
  /** Accessibility label */
  ariaLabel?: string;
  /** Event handler for segment hover */
  onSegmentHover?: ChartEventHandler;
  /** Event handler for segment click */
  onSegmentClick?: ChartEventHandler;
  /** Event handler for resize */
  onResize?: ChartEventHandler;
}

/**
 * Signature for the CyberDonutChart component
 */
export interface CyberDonutChartSignature {
  Args: CyberDonutChartArgs;
  Element: HTMLDivElement;
  Blocks: {
    default: [];
  };
}

/**
 * Ember Glimmer component for rendering cyberpunk-styled donut/pie charts
 *
 * @example
 * ```hbs
 * <CyberDonutChart
 *   @data={{this.segments}}
 *   @theme="cyan"
 *   @innerRadius={{0.6}}
 *   @centerText="Total"
 *   @centerSubtext="100%"
 *   @animate={{true}}
 *   @onSegmentClick={{this.handleSegmentClick}}
 * />
 * ```
 */
export default class CyberDonutChart extends Component<CyberDonutChartSignature> {
  /**
   * Reference to the underlying DonutChart instance
   */
  @tracked chart: DonutChart | null = null;

  /**
   * Reference to the container element
   */
  private containerElement: HTMLElement | null = null;

  /**
   * Build chart options from component args
   */
  private get chartOptions(): DonutChartOptions {
    const { args } = this;
    return {
      data: args.data,
      width: args.width,
      height: args.height,
      theme: args.theme,
      innerRadius: args.innerRadius,
      segmentGap: args.segmentGap,
      showLabels: args.showLabels,
      labelPosition: args.labelPosition,
      showPercentages: args.showPercentages,
      centerText: args.centerText,
      centerSubtext: args.centerSubtext,
      startAngle: args.startAngle,
      sortSegments: args.sortSegments,
      animate: args.animate,
      animation: args.animation,
      glow: args.glow,
      scanlines: args.scanlines,
      responsive: args.responsive,
      legend: args.legend,
      tooltip: args.tooltip,
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
    this.chart = new DonutChart(this.containerElement, this.chartOptions);

    // Attach event handlers
    this.attachEventHandlers();
  }

  /**
   * Attach event handlers from args to chart
   */
  private attachEventHandlers(): void {
    if (!this.chart) return;

    if (this.args.onSegmentHover) {
      this.chart.on('segmentHover', this.args.onSegmentHover);
    }

    if (this.args.onSegmentClick) {
      this.chart.on('segmentClick', this.args.onSegmentClick);
    }

    if (this.args.onResize) {
      this.chart.on('resize', this.args.onResize);
    }
  }

  /**
   * Get total value of all segments
   */
  @action
  getTotal(): number {
    return this.chart?.getTotal() ?? 0;
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
