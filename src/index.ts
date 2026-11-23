/**
 * CyberCore Charts
 * Zero-dependency SVG chart library with cyberpunk styling
 *
 * @packageDocumentation
 */

import { BarChart } from './charts/BarChart';
import { BaseChart } from './charts/BaseChart';
import { DonutChart } from './charts/DonutChart';
import { GaugeChart } from './charts/GaugeChart';
import { LineChart } from './charts/LineChart';
import { Sparkline } from './charts/Sparkline';

import type { ChartItem, DefaultDimensions, LegendEntry } from './charts/BaseChart';
import type {
  BarChartOptions,
  DonutChartOptions,
  GaugeChartOptions,
  LineChartOptions,
  SparklineOptions,
} from './types';

// ============================================================================
// Chart Classes
// ============================================================================

// Base class for creating custom charts
export { BaseChart };
export type { ChartItem, DefaultDimensions, LegendEntry };

// Chart implementations
export { BarChart, DonutChart, GaugeChart, LineChart, Sparkline };

// ============================================================================
// Factory Function - Easy Vanilla JS API
// ============================================================================

/**
 * Chart type for the factory function
 */
export type ChartType = 'line' | 'bar' | 'gauge' | 'donut' | 'sparkline';

/**
 * Options type mapping for each chart type
 */
export type ChartOptionsMap = {
  line: LineChartOptions;
  bar: BarChartOptions;
  gauge: GaugeChartOptions;
  donut: DonutChartOptions;
  sparkline: SparklineOptions;
};

/**
 * Return type mapping for each chart type
 */
export type ChartInstanceMap = {
  line: LineChart;
  bar: BarChart;
  gauge: GaugeChart;
  donut: DonutChart;
  sparkline: Sparkline;
};

/**
 * Create a chart instance with a simple factory function.
 * This is the recommended API for vanilla JavaScript usage.
 *
 * @param type - The type of chart to create: 'line', 'bar', 'gauge', 'donut', or 'sparkline'
 * @param container - Either an HTMLElement or a CSS selector string (e.g., '#chart')
 * @param options - Chart-specific options including data
 * @returns The chart instance
 *
 * @example
 * ```javascript
 * // Create a line chart
 * const chart = CyberCharts.createChart('line', '#chart', {
 *   data: [
 *     { x: 'Jan', y: 10 },
 *     { x: 'Feb', y: 25 },
 *     { x: 'Mar', y: 15 },
 *   ],
 *   theme: 'cyan',
 *   showArea: true,
 * });
 *
 * // Update the chart later
 * chart.update(newData);
 *
 * // Clean up when done
 * chart.destroy();
 * ```
 */
export function createChart<T extends ChartType>(
  type: T,
  container: HTMLElement | string,
  options: ChartOptionsMap[T]
): ChartInstanceMap[T] {
  switch (type) {
    case 'line':
      return new LineChart(container, options as LineChartOptions) as ChartInstanceMap[T];
    case 'bar':
      return new BarChart(container, options as BarChartOptions) as ChartInstanceMap[T];
    case 'gauge':
      return new GaugeChart(container, options as GaugeChartOptions) as ChartInstanceMap[T];
    case 'donut':
      return new DonutChart(container, options as DonutChartOptions) as ChartInstanceMap[T];
    case 'sparkline':
      return new Sparkline(container, options as SparklineOptions) as ChartInstanceMap[T];
    default:
      throw new Error(`Unknown chart type: ${type}`);
  }
}

// ============================================================================
// Types
// ============================================================================

export type {
  // Core types
  ChartTheme,
  EasingFunction,
  ChartPadding,
  DataPoint,
  DataSeries,
  Point,
  BoundingBox,
  ScaleFunction,
  DeepPartial,

  // Configuration types
  AxisConfig,
  TooltipConfig,
  LegendConfig,
  AnimationConfig,
  GlowConfig,
  BaseChartOptions,

  // Chart-specific types
  LineChartOptions,
  LineInterpolation,
  BarChartOptions,
  BarOrientation,
  BarGroupMode,
  GaugeChartOptions,
  GaugeThreshold,
  DonutChartOptions,
  DonutSegment,
  SparklineOptions,

  // Event types
  ChartEventType,
  ChartEvent,
  ChartEventHandler,
  ChartInstance,

  // Color types
  CyberColorPalette,
} from './types';

// ============================================================================
// Utilities
// ============================================================================

// Color utilities
export {
  cyberColors,
  getThemeColor,
  getThemeColorRGB,
  getThemeColorLight,
  getThemeColorDark,
  getGlowColor,
  hexToRGB,
  rgbToHex,
  hexToRGBA,
  hslToRGB,
  rgbToHSL,
  lighten,
  darken,
  withOpacity,
  mixColors,
  getContrastColor,
  generateSeriesColors,
  getThemeGradient,
  createGradient,
  getGlowFilterColor,
  getGlowShadow,
  chartColors,
} from './utils/colors';

// Theme tokens (cybercore-css custom properties with built-in fallbacks)
export {
  themeColor,
  seriesColor,
  SERIES_PALETTE,
  uiColors,
  safeColor,
  prefersReducedMotion,
  prefersHighContrast,
} from './utils/theme';
export type { ThemeShade } from './utils/theme';

// Formatting and accessibility utilities
export { formatNumber, formatDate, fitLabel } from './utils/format';
export { createDataTable, MAX_TABLE_ROWS } from './utils/a11y';
export type { ChartDataTable } from './utils/a11y';

// Math utilities
export {
  lerp,
  clamp,
  scale,
  round,
  snapTo,
  extent,
  getYExtent,
  getXExtent,
  niceExtent,
  generateTicks,
  createLinearScale,
  createInvertedScale,
  createBandScale,
  easings,
  getEasing,
  distance,
  angle,
  degToRad,
  radToDeg,
  pointOnCircle,
  pointOnArc,
  calculateControlPoints,
  smoothPath,
  stepPath,
  simplifyPath,
  simplifyIndices,
  downsamplePoints,
  cssEasing,
  sum,
  mean,
  median,
  toPercentages,
  normalize,
} from './utils/math';

// SVG utilities
export {
  createSVGElement,
  setAttributes,
  createSVGRoot,
  createGroup,
  pointsToPath,
  createPath,
  createAreaPath,
  createCircle,
  createRect,
  createLine,
  createText,
  describeArc,
  describeDonutSegment,
  createDefs,
  createLinearGradient,
  createRadialGradient,
  createGlowFilter,
  createDropShadowFilter,
  createScanlinesPattern,
  createPathAnimation,
  createAnimationCSS,
  clearElement,
  svgToString,
  createClipPath,
  createMask,
  applyThemeColor,
  applyGlowFilter,
  escapeHtml,
} from './utils/svg';

// Tooltip utilities
export { TooltipManager } from './utils/TooltipManager';
export type { TooltipOptions } from './utils/TooltipManager';

// Responsive utilities
export { ResponsiveManager } from './utils/ResponsiveManager';
export type { ResizeCallback } from './utils/ResponsiveManager';

// Event utilities
export { ChartEventEmitter } from './utils/EventEmitter';

// ============================================================================
// Constants
// ============================================================================

export { LAYOUT } from './constants';

// ============================================================================
// Version
// ============================================================================

export const VERSION = '0.2.0';
