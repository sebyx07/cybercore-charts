/**
 * CyberCore Charts - Ember Chart Modifier
 * A modifier for using charts imperatively with any element
 *
 * This modifier allows you to attach any chart type to an element
 * using a more imperative approach, useful for dynamic chart types
 * or when you need more control over chart instantiation.
 */

import { modifier } from 'ember-modifier';

import { LineChart } from '../../charts/LineChart';
import { BarChart } from '../../charts/BarChart';
import { GaugeChart } from '../../charts/GaugeChart';
import { DonutChart } from '../../charts/DonutChart';
import { Sparkline } from '../../charts/Sparkline';
import type {
  LineChartOptions,
  BarChartOptions,
  GaugeChartOptions,
  DonutChartOptions,
  SparklineOptions,
} from '../../types';

/**
 * Chart class constructor type
 */
type ChartClass =
  | typeof LineChart
  | typeof BarChart
  | typeof GaugeChart
  | typeof DonutChart
  | typeof Sparkline;

/**
 * Chart instance type (union of all chart types)
 */
type ChartInstance = LineChart | BarChart | GaugeChart | DonutChart | Sparkline;

/**
 * Chart options type (union of all chart option types)
 */
type ChartOptions =
  | LineChartOptions
  | BarChartOptions
  | GaugeChartOptions
  | DonutChartOptions
  | SparklineOptions;

/**
 * Modifier positional arguments
 */
interface CyberChartPositionalArgs {
  /** The chart class to instantiate (LineChart, BarChart, etc.) */
  0: ChartClass;
  /** Chart options to pass to the constructor */
  1: ChartOptions;
}

/**
 * Modifier named arguments
 */
interface CyberChartNamedArgs {
  /** Callback fired after chart is created, receives chart instance */
  onCreated?: (chart: ChartInstance) => void;
  /** Callback fired before chart is destroyed */
  onWillDestroy?: (chart: ChartInstance) => void;
}

/**
 * Modifier signature
 */
export interface CyberChartModifierSignature {
  Element: HTMLElement;
  Args: {
    Positional: CyberChartPositionalArgs;
    Named: CyberChartNamedArgs;
  };
}

/**
 * Ember modifier for imperatively creating CyberCore charts
 *
 * This modifier creates a chart instance when attached to an element
 * and properly cleans up when the element is removed or the modifier
 * is updated.
 *
 * @example Basic usage with LineChart
 * ```hbs
 * <div {{cyber-chart LineChart (hash data=this.data theme="cyan" animate=true)}}></div>
 * ```
 *
 * @example With callbacks
 * ```hbs
 * <div {{cyber-chart
 *   BarChart
 *   (hash data=this.data orientation="vertical")
 *   onCreated=this.handleChartCreated
 *   onWillDestroy=this.handleChartDestroy
 * }}></div>
 * ```
 *
 * @example Dynamic chart type
 * ```hbs
 * <div {{cyber-chart this.chartType this.chartOptions}}></div>
 * ```
 */
const cyberChartModifier = modifier<CyberChartModifierSignature>(
  (
    element: HTMLElement,
    [ChartClass, options]: [ChartClass, ChartOptions],
    { onCreated, onWillDestroy }: CyberChartNamedArgs
  ) => {
    // Validate inputs
    if (!ChartClass) {
      console.warn('cyber-chart modifier: No chart class provided');
      return;
    }

    if (!options) {
      console.warn('cyber-chart modifier: No options provided');
      return;
    }

    // Create chart instance
    let chart: ChartInstance;

    try {
      chart = new ChartClass(element, options as never);
    } catch (error) {
      console.error('cyber-chart modifier: Failed to create chart', error);
      return;
    }

    // Fire created callback
    if (onCreated) {
      onCreated(chart);
    }

    // Return cleanup function (called when modifier is removed or updated)
    return () => {
      // Fire willDestroy callback
      if (onWillDestroy) {
        onWillDestroy(chart);
      }

      // Destroy chart instance
      chart.destroy();
    };
  }
);

export default cyberChartModifier;

// Re-export chart classes for convenience
export { LineChart, BarChart, GaugeChart, DonutChart, Sparkline };
