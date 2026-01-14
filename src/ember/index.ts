/**
 * CyberCore Charts - Ember.js Integration
 *
 * This module provides Ember Octane components for the CyberCore Charts library.
 * All components use modern Glimmer component patterns with tracked properties
 * and action decorators.
 *
 * Requirements:
 * - Ember.js 5.x (Octane edition)
 * - @glimmer/component
 * - @glimmer/tracking
 * - @ember/object
 * - @ember/render-modifiers or ember-modifier (for did-insert/did-update)
 * - ember-modifier (for the cyber-chart modifier)
 *
 * @example Installation in Ember app
 * ```bash
 * npm install cybercore-charts
 * npm install ember-modifier @ember/render-modifiers
 * ```
 *
 * @example Using components in templates
 * ```hbs
 * <CyberLineChart
 *   @data={{this.lineData}}
 *   @theme="cyan"
 *   @showArea={{true}}
 *   @animate={{true}}
 * />
 *
 * <CyberBarChart
 *   @data={{this.barData}}
 *   @orientation="vertical"
 *   @groupMode="grouped"
 * />
 *
 * <CyberGaugeChart
 *   @value={{this.gaugeValue}}
 *   @min={{0}}
 *   @max={{100}}
 * />
 *
 * <CyberDonutChart
 *   @data={{this.segments}}
 *   @innerRadius={{0.6}}
 * />
 *
 * <CyberSparkline
 *   @data={{this.sparkData}}
 *   @showEndPoint={{true}}
 * />
 * ```
 *
 * @example Using the cyber-chart modifier for imperative usage
 * ```hbs
 * <div {{cyber-chart LineChart (hash data=this.data theme="cyan")}}></div>
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// Components
// =============================================================================

export { default as CyberLineChart } from './components/cyber-line-chart';
export type {
  CyberLineChartArgs,
  CyberLineChartSignature,
} from './components/cyber-line-chart';

export { default as CyberBarChart } from './components/cyber-bar-chart';
export type {
  CyberBarChartArgs,
  CyberBarChartSignature,
} from './components/cyber-bar-chart';

export { default as CyberGaugeChart } from './components/cyber-gauge-chart';
export type {
  CyberGaugeChartArgs,
  CyberGaugeChartSignature,
} from './components/cyber-gauge-chart';

export { default as CyberDonutChart } from './components/cyber-donut-chart';
export type {
  CyberDonutChartArgs,
  CyberDonutChartSignature,
} from './components/cyber-donut-chart';

export { default as CyberSparkline } from './components/cyber-sparkline';
export type {
  CyberSparklineArgs,
  CyberSparklineSignature,
  SparklineStats,
} from './components/cyber-sparkline';

// =============================================================================
// Modifiers
// =============================================================================

export { default as cyberChartModifier } from './modifiers/cyber-chart';
export type { CyberChartModifierSignature } from './modifiers/cyber-chart';

// Re-export chart classes for use with the modifier
export {
  LineChart,
  BarChart,
  GaugeChart,
  DonutChart,
  Sparkline,
} from './modifiers/cyber-chart';

// =============================================================================
// Re-export types from main library
// =============================================================================

export type {
  // Core types
  ChartTheme,
  DataPoint,
  DataSeries,
  DonutSegment,
  GaugeThreshold,
  // Options types
  LineChartOptions,
  BarChartOptions,
  GaugeChartOptions,
  DonutChartOptions,
  SparklineOptions,
  // Config types
  AxisConfig,
  LegendConfig,
  TooltipConfig,
  AnimationConfig,
  GlowConfig,
  ChartPadding,
  // Event types
  ChartEvent,
  ChartEventType,
  ChartEventHandler,
  // Enum types
  LineInterpolation,
  BarOrientation,
  BarGroupMode,
} from '../types';
