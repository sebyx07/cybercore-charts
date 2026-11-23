/**
 * CyberCore Charts - Ember integration
 *
 * One modifier, `cyberChart`, for Ember 5+ (Octane and Polaris). It needs
 * `ember-modifier` 4+ in the app and nothing else: no components to register
 * and no template compilation inside this package.
 *
 * @example
 * ```gts
 * import { cyberChart } from 'cybercore-charts/ember';
 *
 * <template>
 *   <div {{cyberChart "bar" data=@data orientation="horizontal" responsive=true}}></div>
 * </template>
 * ```
 *
 * @packageDocumentation
 */

export { default, default as cyberChart } from './cyber-chart';
export type {
  CyberChartCallbacks,
  CyberChartInstanceMap,
  CyberChartOptionsMap,
  CyberChartSignature,
  CyberChartType,
} from './cyber-chart';

export type {
  AnimationConfig,
  AxisConfig,
  BarChartOptions,
  BarGroupMode,
  BarOrientation,
  ChartEvent,
  ChartEventHandler,
  ChartEventType,
  ChartPadding,
  ChartTheme,
  DataPoint,
  DataSeries,
  DonutChartOptions,
  DonutSegment,
  GaugeChartOptions,
  GaugeThreshold,
  GlowConfig,
  LegendConfig,
  LineChartOptions,
  LineInterpolation,
  SparklineOptions,
  TooltipConfig,
} from '../types';
