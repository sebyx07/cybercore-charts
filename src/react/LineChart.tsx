/**
 * CyberCore Charts - React Line Chart Component
 */

import { forwardRef } from 'react';

import { LineChart } from '../charts/LineChart';

import { splitProps, useChartBinding, useChartHandle } from './useChart';

import type { ChartHandle } from './useChart';
import type { ChartEventHandler, DataPoint, DataSeries, LineChartOptions } from '../types';
import type { HTMLAttributes } from 'react';

const OPTION_KEYS: Record<keyof LineChartOptions, true> = {
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
  showArea: true,
  areaOpacity: true,
  showPoints: true,
  pointRadius: true,
  lineWidth: true,
  interpolation: true,
  xAxis: true,
  yAxis: true,
  legend: true,
  connectNulls: true,
  maxPoints: true,
  simplifyTolerance: true,
};

/**
 * Props for CyberLineChart: every line chart option, chart events, and any
 * attribute of the container `<div>`.
 */
export interface CyberLineChartProps
  extends
    LineChartOptions,
    Omit<HTMLAttributes<HTMLDivElement>, keyof LineChartOptions | 'children'> {
  /** Fired when the pointer moves over a data point */
  onPointHover?: ChartEventHandler;
  /** Fired when a data point is clicked */
  onPointClick?: ChartEventHandler;
  /** Fired after the chart resizes */
  onResize?: ChartEventHandler;
}

/**
 * Ref handle for CyberLineChart
 */
export type CyberLineChartRef = ChartHandle<
  LineChart,
  LineChartOptions,
  DataPoint[] | DataSeries[]
>;

/**
 * Line and area chart.
 *
 * @example
 * ```tsx
 * <CyberLineChart data={points} theme="cyan" showArea responsive style={{ height: 280 }} />
 * ```
 */
export const CyberLineChart = forwardRef<CyberLineChartRef, CyberLineChartProps>((props, ref) => {
  const [options, rest] = splitProps<LineChartOptions, CyberLineChartProps>(props, OPTION_KEYS);
  const { onPointHover, onPointClick, onResize, className, ...attributes } = rest;

  const { containerRef, getChart } = useChartBinding(LineChart, options, {
    pointHover: onPointHover,
    pointClick: onPointClick,
    resize: onResize,
  });
  useChartHandle(ref, getChart, 'CyberLineChart');

  return (
    <div
      ref={containerRef}
      className={className ? `cyber-chart-container ${className}` : 'cyber-chart-container'}
      {...attributes}
    />
  );
});

CyberLineChart.displayName = 'CyberLineChart';

export default CyberLineChart;
