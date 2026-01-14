/**
 * CyberCore Charts - TypeScript Type Definitions
 * Zero-dependency SVG chart library with cyberpunk styling
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Cyberpunk color theme options
 */
export type ChartTheme = 'cyan' | 'magenta' | 'green' | 'yellow';

/**
 * Animation easing functions
 */
export type EasingFunction =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic';

/**
 * Chart padding configuration
 */
export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Single data point for charts
 */
export interface DataPoint {
  /** X-axis value (can be number, string label, or Date) */
  x: number | string | Date;
  /** Y-axis value */
  y: number;
  /** Optional label for the data point */
  label?: string;
  /** Optional custom color override */
  color?: string;
  /** Optional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Data series for multi-series charts
 */
export interface DataSeries {
  /** Unique identifier for the series */
  id: string;
  /** Display name for legend */
  name: string;
  /** Data points in this series */
  data: DataPoint[];
  /** Optional theme override for this series */
  theme?: ChartTheme;
  /** Optional custom color */
  color?: string;
  /** Whether this series is visible */
  visible?: boolean;
}

/**
 * Axis configuration
 */
export interface AxisConfig {
  /** Show axis line */
  show?: boolean;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show axis labels */
  showLabels?: boolean;
  /** Minimum value (auto-calculated if not provided) */
  min?: number;
  /** Maximum value (auto-calculated if not provided) */
  max?: number;
  /** Number of ticks */
  ticks?: number;
  /** Custom tick formatter */
  formatLabel?: (value: number | string) => string;
  /** Axis label */
  label?: string;
}

/**
 * Tooltip configuration
 */
export interface TooltipConfig {
  /** Enable tooltips */
  enabled?: boolean;
  /** Custom formatter for tooltip content */
  formatter?: (point: DataPoint, series?: DataSeries) => string;
  /** Follow cursor or snap to point */
  followCursor?: boolean;
}

/**
 * Legend configuration
 */
export interface LegendConfig {
  /** Show legend */
  show?: boolean;
  /** Legend position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Legend alignment */
  align?: 'start' | 'center' | 'end';
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Enable animations */
  enabled?: boolean;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Easing function */
  easing?: EasingFunction;
  /** Delay before animation starts */
  delay?: number;
  /** Stagger delay for multiple elements */
  stagger?: number;
}

/**
 * Glow effect configuration
 */
export interface GlowConfig {
  /** Enable glow effect */
  enabled?: boolean;
  /** Glow intensity (0-1) */
  intensity?: number;
  /** Glow blur radius */
  blur?: number;
  /** Use theme color for glow */
  useThemeColor?: boolean;
}

// ============================================================================
// Base Chart Options
// ============================================================================

/**
 * Base options shared by all charts
 */
export interface BaseChartOptions {
  /** Chart width in pixels (default: container width or 400) */
  width?: number;
  /** Chart height in pixels (default: 300) */
  height?: number;
  /** Chart padding */
  padding?: Partial<ChartPadding>;
  /** Color theme */
  theme?: ChartTheme;
  /** Enable animations */
  animate?: boolean;
  /** Animation configuration */
  animation?: AnimationConfig;
  /** Tooltip configuration */
  tooltip?: TooltipConfig;
  /** Enable glow effects */
  glow?: boolean | GlowConfig;
  /** Show scanlines overlay */
  scanlines?: boolean;
  /** CSS class prefix */
  classPrefix?: string;
  /** Responsive - auto-resize on container resize */
  responsive?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
}

// ============================================================================
// Line Chart Types
// ============================================================================

/**
 * Line interpolation methods
 */
export type LineInterpolation = 'linear' | 'smooth' | 'step' | 'stepBefore' | 'stepAfter';

/**
 * Line chart specific options
 */
export interface LineChartOptions extends BaseChartOptions {
  /** Chart data - single series or multiple */
  data: DataPoint[] | DataSeries[];
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
  /** X-axis configuration */
  xAxis?: AxisConfig;
  /** Y-axis configuration */
  yAxis?: AxisConfig;
  /** Legend configuration */
  legend?: LegendConfig;
  /** Connect null/missing values */
  connectNulls?: boolean;
  /**
   * Maximum number of points to render per series (default: 1000).
   * If data exceeds this limit, points will be reduced using
   * Douglas-Peucker algorithm to preserve the visual shape.
   * Set to 0 or Infinity to disable point reduction.
   */
  maxPoints?: number;
  /**
   * Tolerance for Douglas-Peucker simplification (default: 1).
   * Higher values result in more aggressive simplification.
   * Only used when point count exceeds maxPoints.
   */
  simplifyTolerance?: number;
}

// ============================================================================
// Bar Chart Types
// ============================================================================

/**
 * Bar chart orientation
 */
export type BarOrientation = 'vertical' | 'horizontal';

/**
 * Bar chart grouping mode
 */
export type BarGroupMode = 'grouped' | 'stacked';

/**
 * Bar chart specific options
 */
export interface BarChartOptions extends BaseChartOptions {
  /** Chart data - single series or multiple */
  data: DataPoint[] | DataSeries[];
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
  /** X-axis configuration */
  xAxis?: AxisConfig;
  /** Y-axis configuration */
  yAxis?: AxisConfig;
  /** Legend configuration */
  legend?: LegendConfig;
  /** Show value labels on bars */
  showValues?: boolean;
  /** Value label position */
  valuePosition?: 'inside' | 'outside' | 'center';
}

// ============================================================================
// Gauge Chart Types
// ============================================================================

/**
 * Gauge chart specific options
 */
export interface GaugeChartOptions extends BaseChartOptions {
  /** Current value */
  value: number;
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
}

/**
 * Gauge threshold zone
 */
export interface GaugeThreshold {
  /** Threshold value */
  value: number;
  /** Color for this threshold */
  color?: string;
  /** Theme for this threshold */
  theme?: ChartTheme;
  /** Label for this threshold */
  label?: string;
}

// ============================================================================
// Donut Chart Types
// ============================================================================

/**
 * Donut/Pie chart segment
 */
export interface DonutSegment {
  /** Segment label */
  label: string;
  /** Segment value */
  value: number;
  /** Optional custom color */
  color?: string;
  /** Optional theme */
  theme?: ChartTheme;
  /** Optional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Donut chart specific options
 */
export interface DonutChartOptions extends BaseChartOptions {
  /** Chart data */
  data: DonutSegment[];
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
  /** Legend configuration */
  legend?: LegendConfig;
  /** Starting angle in degrees */
  startAngle?: number;
  /** Sort segments by value */
  sortSegments?: boolean | 'asc' | 'desc';
}

// ============================================================================
// Sparkline Types
// ============================================================================

/**
 * Sparkline specific options
 */
export interface SparklineOptions {
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

// ============================================================================
// Event Types
// ============================================================================

/**
 * Chart event types
 */
export type ChartEventType =
  | 'pointHover'
  | 'pointClick'
  | 'segmentHover'
  | 'segmentClick'
  | 'barHover'
  | 'barClick'
  | 'legendClick'
  | 'resize';

/**
 * Chart event data
 */
export interface ChartEvent<T = unknown> {
  type: ChartEventType;
  target: SVGElement | null;
  data: T;
  originalEvent?: MouseEvent;
}

/**
 * Event handler type
 */
export type ChartEventHandler<T = unknown> = (event: ChartEvent<T>) => void;

// ============================================================================
// Chart Instance Interface
// ============================================================================

/**
 * Base chart instance interface
 */
export interface ChartInstance<TOptions = BaseChartOptions, TData = unknown> {
  /** Update chart with new data */
  update(data: TData): void;
  /** Update chart options */
  setOptions(options: Partial<TOptions>): void;
  /** Resize chart */
  resize(width?: number, height?: number): void;
  /** Destroy chart and clean up */
  destroy(): void;
  /** Get SVG element */
  getSVG(): SVGSVGElement;
  /** Export as SVG string */
  toSVG(): string;
  /** Add event listener */
  on<T = unknown>(event: ChartEventType, handler: ChartEventHandler<T>): void;
  /** Remove event listener */
  off(event: ChartEventType, handler?: ChartEventHandler): void;
}

// ============================================================================
// Color Tokens
// ============================================================================

/**
 * Cyberpunk color palette tokens
 */
export interface CyberColorPalette {
  cyan: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  magenta: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  green: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  yellow: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  void: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  chrome: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Bounding box
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Scale function type
 */
export type ScaleFunction = (value: number) => number;

/**
 * Deep partial type for nested options
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
