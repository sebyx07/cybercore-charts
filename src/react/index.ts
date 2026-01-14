/**
 * CyberCore Charts - React Components
 * React wrapper components for CyberCore chart library
 *
 * @packageDocumentation
 */

// ============================================================================
// Hooks
// ============================================================================

export { useChart, useChartInstance } from './useChart';

// ============================================================================
// Components
// ============================================================================

export { CyberLineChart } from './LineChart';
export { CyberBarChart } from './BarChart';
export { CyberGaugeChart } from './GaugeChart';
export { CyberDonutChart } from './DonutChart';
export { CyberSparkline } from './Sparkline';

// ============================================================================
// Component Types
// ============================================================================

export type { CyberLineChartProps, CyberLineChartRef } from './LineChart';
export type { CyberBarChartProps, CyberBarChartRef } from './BarChart';
export type { CyberGaugeChartProps, CyberGaugeChartRef } from './GaugeChart';
export type { CyberDonutChartProps, CyberDonutChartRef } from './DonutChart';
export type { CyberSparklineProps, CyberSparklineRef, SparklineStats } from './Sparkline';

// ============================================================================
// Re-export common types for convenience
// ============================================================================

export type {
  // Core types
  ChartTheme,
  EasingFunction,
  ChartPadding,
  DataPoint,
  DataSeries,
  Point,

  // Configuration types
  AxisConfig,
  TooltipConfig,
  LegendConfig,
  AnimationConfig,
  GlowConfig,

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
} from '../types';

// ============================================================================
// Default export
// ============================================================================

export { CyberLineChart as default } from './LineChart';
