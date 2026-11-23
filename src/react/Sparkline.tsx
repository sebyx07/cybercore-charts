/**
 * CyberCore Charts - React Sparkline Component
 */

import { forwardRef } from 'react';

import { Sparkline } from '../charts/Sparkline';

import { splitProps, useChartBinding, useChartHandle } from './useChart';

import type { ChartHandle } from './useChart';
import type { SparklineOptions } from '../types';
import type { HTMLAttributes } from 'react';

const OPTION_KEYS: Record<keyof SparklineOptions, true> = {
  data: true,
  width: true,
  height: true,
  theme: true,
  color: true,
  lineWidth: true,
  showArea: true,
  areaOpacity: true,
  showEndPoint: true,
  showMinMax: true,
  glow: true,
  interpolation: true,
  animate: true,
  animationDuration: true,
  ariaLabel: true,
  description: true,
  locale: true,
};

const EXTRAS = (chart: () => Sparkline) => ({
  getData: () => chart().getData(),
  getStats: () => chart().getStats(),
});

/**
 * Props for CyberSparkline: every sparkline option and any attribute of the
 * container `<span>`.
 */
export interface CyberSparklineProps
  extends
    SparklineOptions,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof SparklineOptions | 'children'> {}

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
 * Ref handle for CyberSparkline
 */
export type CyberSparklineRef = ChartHandle<Sparkline, SparklineOptions, number[]> & {
  /** The values currently drawn */
  getData: () => number[];
  /** Minimum, maximum, first, last and trend of the current values */
  getStats: () => SparklineStats;
};

/**
 * Inline mini chart. Renders a `<span>`, so it can sit inside a sentence or
 * a table cell.
 *
 * @example
 * ```tsx
 * <CyberSparkline data={[4, 8, 15, 16, 23, 42]} showEndPoint aria-label="Requests, last 6 hours" />
 * ```
 */
export const CyberSparkline = forwardRef<CyberSparklineRef, CyberSparklineProps>((props, ref) => {
  const [options, rest] = splitProps<SparklineOptions, CyberSparklineProps>(props, OPTION_KEYS);
  const { className, style, ...attributes } = rest;

  const { containerRef, getChart } = useChartBinding<SparklineOptions, Sparkline, HTMLSpanElement>(
    Sparkline,
    options
  );
  useChartHandle(ref, getChart, 'CyberSparkline', EXTRAS);

  return (
    <span
      ref={containerRef}
      className={className ? `cyber-sparkline-container ${className}` : 'cyber-sparkline-container'}
      style={{ display: 'inline-block', ...style }}
      {...attributes}
    />
  );
});

CyberSparkline.displayName = 'CyberSparkline';

export default CyberSparkline;
