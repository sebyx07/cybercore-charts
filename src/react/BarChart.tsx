/**
 * CyberCore Charts - React Bar Chart Component
 */

import { forwardRef } from 'react';

import { BarChart } from '../charts/BarChart';

import { splitProps, useChartBinding, useChartHandle } from './useChart';

import type { ChartHandle } from './useChart';
import type { BarChartOptions, ChartEventHandler, DataPoint, DataSeries } from '../types';
import type { HTMLAttributes } from 'react';

const OPTION_KEYS: Record<keyof BarChartOptions, true> = {
  data: true,
  width: true,
  height: true,
  padding: true,
  theme: true,
  animate: true,
  animation: true,
  tooltip: true,
  glow: true,
  scanlines: true,
  classPrefix: true,
  responsive: true,
  ariaLabel: true,
  description: true,
  locale: true,
  dataTable: true,
  keyboard: true,
  orientation: true,
  groupMode: true,
  borderRadius: true,
  barGap: true,
  groupGap: true,
  xAxis: true,
  yAxis: true,
  legend: true,
  showValues: true,
  valuePosition: true,
};

/**
 * Props for CyberBarChart: every bar chart option, chart events, and any
 * attribute of the container `<div>`.
 */
export interface CyberBarChartProps
  extends
    BarChartOptions,
    Omit<HTMLAttributes<HTMLDivElement>, keyof BarChartOptions | 'children'> {
  /** Fired when the pointer moves over a bar */
  onBarHover?: ChartEventHandler;
  /** Fired when a bar is clicked */
  onBarClick?: ChartEventHandler;
  /** Fired after the chart resizes */
  onResize?: ChartEventHandler;
}

/**
 * Ref handle for CyberBarChart
 */
export type CyberBarChartRef = ChartHandle<BarChart, BarChartOptions, DataPoint[] | DataSeries[]>;

/**
 * Bar chart: vertical or horizontal, grouped or stacked.
 *
 * @example
 * ```tsx
 * <CyberBarChart data={series} groupMode="stacked" responsive style={{ height: 280 }} />
 * ```
 */
export const CyberBarChart = forwardRef<CyberBarChartRef, CyberBarChartProps>((props, ref) => {
  const [options, rest] = splitProps<BarChartOptions, CyberBarChartProps>(props, OPTION_KEYS);
  const { onBarHover, onBarClick, onResize, className, ...attributes } = rest;

  const { containerRef, getChart } = useChartBinding(BarChart, options, {
    barHover: onBarHover,
    barClick: onBarClick,
    resize: onResize,
  });
  useChartHandle(ref, getChart, 'CyberBarChart');

  return (
    <div
      ref={containerRef}
      className={className ? `cyber-chart-container ${className}` : 'cyber-chart-container'}
      {...attributes}
    />
  );
});

CyberBarChart.displayName = 'CyberBarChart';

export default CyberBarChart;
