/**
 * CyberCore Charts - React Gauge Chart Component
 */

import { forwardRef } from 'react';

import { GaugeChart } from '../charts/GaugeChart';

import { splitProps, useChartBinding, useChartHandle } from './useChart';

import type { ChartHandle } from './useChart';
import type { ChartEventHandler, GaugeChartOptions } from '../types';
import type { HTMLAttributes } from 'react';

const OPTION_KEYS: Record<keyof GaugeChartOptions, true> = {
  value: true,
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
  min: true,
  max: true,
  startAngle: true,
  endAngle: true,
  thickness: true,
  showValue: true,
  formatValue: true,
  showMinMax: true,
  label: true,
  thresholds: true,
  showTicks: true,
  tickCount: true,
};

const EXTRAS = (chart: () => GaugeChart) => ({
  getValue: () => chart().getValue(),
});

/**
 * Props for CyberGaugeChart: every gauge option, chart events, and any
 * attribute of the container `<div>`.
 */
export interface CyberGaugeChartProps
  extends
    GaugeChartOptions,
    Omit<HTMLAttributes<HTMLDivElement>, keyof GaugeChartOptions | 'children'> {
  /** Fired after the chart resizes */
  onResize?: ChartEventHandler;
}

/**
 * Ref handle for CyberGaugeChart
 */
export type CyberGaugeChartRef = ChartHandle<GaugeChart, GaugeChartOptions, number> & {
  /** The value the gauge currently shows */
  getValue: () => number;
};

/**
 * Gauge for a single value against a range, with optional threshold zones.
 *
 * @example
 * ```tsx
 * <CyberGaugeChart value={72} max={100} label="CPU" formatValue={(v) => `${v}%`} />
 * ```
 */
export const CyberGaugeChart = forwardRef<CyberGaugeChartRef, CyberGaugeChartProps>(
  (props, ref) => {
    const [options, rest] = splitProps<GaugeChartOptions, CyberGaugeChartProps>(props, OPTION_KEYS);
    const { onResize, className, ...attributes } = rest;

    const { containerRef, getChart } = useChartBinding(GaugeChart, options, { resize: onResize });
    useChartHandle(ref, getChart, 'CyberGaugeChart', EXTRAS);

    return (
      <div
        ref={containerRef}
        className={className ? `cyber-chart-container ${className}` : 'cyber-chart-container'}
        {...attributes}
      />
    );
  }
);

CyberGaugeChart.displayName = 'CyberGaugeChart';

export default CyberGaugeChart;
