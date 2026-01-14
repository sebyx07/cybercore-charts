/**
 * CyberCore Charts - Ember Sparkline Component
 * Glimmer component wrapper for Sparkline with Octane patterns
 */

import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import { Sparkline } from '../../charts/Sparkline';
import type { SparklineOptions, ChartTheme } from '../../types';

/**
 * Arguments for the CyberSparkline component
 */
export interface CyberSparklineArgs {
  /** Data values */
  data: number[];
  /** Sparkline width */
  width?: number;
  /** Sparkline height */
  height?: number;
  /** Color theme */
  theme?: ChartTheme;
  /** Custom color */
  color?: string;
  /** Line width */
  lineWidth?: number;
  /** Show area fill */
  showArea?: boolean;
  /** Area opacity */
  areaOpacity?: number;
  /** Show end point */
  showEndPoint?: boolean;
  /** Show min/max points */
  showMinMax?: boolean;
  /** Enable glow effect */
  glow?: boolean;
  /** Interpolation method */
  interpolation?: 'linear' | 'smooth';
  /** Animate on load */
  animate?: boolean;
  /** Animation duration */
  animationDuration?: number;
}

/**
 * Sparkline statistics
 */
export interface SparklineStats {
  min: number;
  max: number;
  first: number;
  last: number;
  trend: 'up' | 'down' | 'flat';
}

/**
 * Signature for the CyberSparkline component
 */
export interface CyberSparklineSignature {
  Args: CyberSparklineArgs;
  Element: HTMLSpanElement;
  Blocks: {
    default: [];
  };
}

/**
 * Ember Glimmer component for rendering cyberpunk-styled sparklines
 *
 * @example
 * ```hbs
 * <CyberSparkline
 *   @data={{this.sparklineData}}
 *   @theme="cyan"
 *   @showArea={{true}}
 *   @showEndPoint={{true}}
 *   @animate={{true}}
 * />
 * ```
 */
export default class CyberSparkline extends Component<CyberSparklineSignature> {
  /**
   * Reference to the underlying Sparkline instance
   */
  @tracked chart: Sparkline | null = null;

  /**
   * Reference to the container element
   */
  private containerElement: HTMLElement | null = null;

  /**
   * Build chart options from component args
   */
  private get chartOptions(): SparklineOptions {
    const { args } = this;
    return {
      data: args.data,
      width: args.width,
      height: args.height,
      theme: args.theme,
      color: args.color,
      lineWidth: args.lineWidth,
      showArea: args.showArea,
      areaOpacity: args.areaOpacity,
      showEndPoint: args.showEndPoint,
      showMinMax: args.showMinMax,
      glow: args.glow,
      interpolation: args.interpolation,
      animate: args.animate,
      animationDuration: args.animationDuration,
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
    this.chart = new Sparkline(this.containerElement, this.chartOptions);
  }

  /**
   * Get current sparkline data
   */
  @action
  getData(): number[] {
    return this.chart?.getData() ?? [];
  }

  /**
   * Get sparkline statistics
   */
  @action
  getStats(): SparklineStats {
    return (
      this.chart?.getStats() ?? {
        min: 0,
        max: 0,
        first: 0,
        last: 0,
        trend: 'flat' as const,
      }
    );
  }

  /**
   * Export chart as SVG string
   */
  @action
  toSVG(): string {
    if (!this.chart) {
      throw new Error('Sparkline not initialized');
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
   * Manually resize the sparkline
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
