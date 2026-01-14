/**
 * CyberCore Charts - Ember Gauge Chart Component
 * Glimmer component wrapper for GaugeChart with Octane patterns
 */

import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import { GaugeChart } from '../../charts/GaugeChart';
import type {
  GaugeChartOptions,
  GaugeThreshold,
  ChartTheme,
  ChartEventHandler,
  AnimationConfig,
  GlowConfig,
} from '../../types';

/**
 * Arguments for the CyberGaugeChart component
 */
export interface CyberGaugeChartArgs {
  /** Current value */
  value: number;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Color theme */
  theme?: ChartTheme;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Start angle in degrees (default: -135) */
  startAngle?: number;
  /** End angle in degrees (default: 135) */
  endAngle?: number;
  /** Arc thickness */
  thickness?: number;
  /** Show value text in center */
  showValue?: boolean;
  /** Value formatter */
  formatValue?: (value: number) => string;
  /** Show min/max labels */
  showMinMax?: boolean;
  /** Gauge label */
  label?: string;
  /** Threshold zones for color changes */
  thresholds?: GaugeThreshold[];
  /** Show ticks around gauge */
  showTicks?: boolean;
  /** Number of tick marks */
  tickCount?: number;
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
  /** Accessibility label */
  ariaLabel?: string;
  /** Event handler for resize */
  onResize?: ChartEventHandler;
}

/**
 * Signature for the CyberGaugeChart component
 */
export interface CyberGaugeChartSignature {
  Args: CyberGaugeChartArgs;
  Element: HTMLDivElement;
  Blocks: {
    default: [];
  };
}

/**
 * Ember Glimmer component for rendering cyberpunk-styled gauge charts
 *
 * @example
 * ```hbs
 * <CyberGaugeChart
 *   @value={{this.gaugeValue}}
 *   @theme="green"
 *   @min={{0}}
 *   @max={{100}}
 *   @thresholds={{this.thresholds}}
 *   @animate={{true}}
 * />
 * ```
 */
export default class CyberGaugeChart extends Component<CyberGaugeChartSignature> {
  /**
   * Reference to the underlying GaugeChart instance
   */
  @tracked chart: GaugeChart | null = null;

  /**
   * Reference to the container element
   */
  private containerElement: HTMLElement | null = null;

  /**
   * Build chart options from component args
   */
  private get chartOptions(): GaugeChartOptions {
    const { args } = this;
    return {
      value: args.value,
      width: args.width,
      height: args.height,
      theme: args.theme,
      min: args.min,
      max: args.max,
      startAngle: args.startAngle,
      endAngle: args.endAngle,
      thickness: args.thickness,
      showValue: args.showValue,
      formatValue: args.formatValue,
      showMinMax: args.showMinMax,
      label: args.label,
      thresholds: args.thresholds,
      showTicks: args.showTicks,
      tickCount: args.tickCount,
      animate: args.animate,
      animation: args.animation,
      glow: args.glow,
      scanlines: args.scanlines,
      responsive: args.responsive,
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
      // Update value if it changed
      if (this.args.value !== undefined) {
        this.chart.update(this.args.value);
      }

      // Update options (excluding value to avoid double update)
      const { value: _, ...optionsWithoutValue } = this.chartOptions;
      this.chart.setOptions(optionsWithoutValue);
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
    this.chart = new GaugeChart(this.containerElement, this.chartOptions);

    // Attach event handlers
    this.attachEventHandlers();
  }

  /**
   * Attach event handlers from args to chart
   */
  private attachEventHandlers(): void {
    if (!this.chart) return;

    if (this.args.onResize) {
      this.chart.on('resize', this.args.onResize);
    }
  }

  /**
   * Get current gauge value
   */
  @action
  getValue(): number {
    return this.chart?.getValue() ?? 0;
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
