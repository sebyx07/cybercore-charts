/**
 * CyberCore Charts - React Donut Chart Component
 */

import { forwardRef } from 'react';

import { DonutChart } from '../charts/DonutChart';

import { splitProps, useChartBinding, useChartHandle } from './useChart';

import type { ChartHandle } from './useChart';
import type { ChartEventHandler, DonutChartOptions, DonutSegment } from '../types';
import type { HTMLAttributes } from 'react';

const OPTION_KEYS: Record<keyof DonutChartOptions, true> = {
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
  innerRadius: true,
  segmentGap: true,
  showLabels: true,
  labelPosition: true,
  showPercentages: true,
  centerText: true,
  centerSubtext: true,
  legend: true,
  startAngle: true,
  sortSegments: true,
};

const EXTRAS = (chart: () => DonutChart) => ({
  getTotal: () => chart().getTotal(),
});

/**
 * Props for CyberDonutChart: every donut chart option, chart events, and any
 * attribute of the container `<div>`.
 */
export interface CyberDonutChartProps
  extends
    DonutChartOptions,
    Omit<HTMLAttributes<HTMLDivElement>, keyof DonutChartOptions | 'children'> {
  /** Fired when the pointer moves over a segment */
  onSegmentHover?: ChartEventHandler;
  /** Fired when a segment is clicked */
  onSegmentClick?: ChartEventHandler;
  /** Fired after the chart resizes */
  onResize?: ChartEventHandler;
}

/**
 * Ref handle for CyberDonutChart
 */
export type CyberDonutChartRef = ChartHandle<DonutChart, DonutChartOptions, DonutSegment[]> & {
  /** Sum of all segment values */
  getTotal: () => number;
};

/**
 * Donut or pie chart (`innerRadius={0}` for a pie).
 *
 * @example
 * ```tsx
 * <CyberDonutChart data={segments} centerText="128" centerSubtext="nodes" />
 * ```
 */
export const CyberDonutChart = forwardRef<CyberDonutChartRef, CyberDonutChartProps>(
  (props, ref) => {
    const [options, rest] = splitProps<DonutChartOptions, CyberDonutChartProps>(props, OPTION_KEYS);
    const { onSegmentHover, onSegmentClick, onResize, className, ...attributes } = rest;

    const { containerRef, getChart } = useChartBinding(DonutChart, options, {
      segmentHover: onSegmentHover,
      segmentClick: onSegmentClick,
      resize: onResize,
    });
    useChartHandle(ref, getChart, 'CyberDonutChart', EXTRAS);

    return (
      <div
        ref={containerRef}
        className={className ? `cyber-chart-container ${className}` : 'cyber-chart-container'}
        {...attributes}
      />
    );
  }
);

CyberDonutChart.displayName = 'CyberDonutChart';

export default CyberDonutChart;
