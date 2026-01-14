/**
 * CyberCore Charts - React Gauge Chart Component
 * React wrapper for the GaugeChart class
 */

import React, { forwardRef, useRef, useEffect, useImperativeHandle, useMemo } from 'react';

import { GaugeChart } from '../charts/GaugeChart';

import type {
  GaugeChartOptions,
  GaugeThreshold,
  ChartTheme,
  ChartPadding,
  AnimationConfig,
  GlowConfig,
  ChartEventType,
  ChartEventHandler,
} from '../types';

/**
 * Props for CyberGaugeChart component
 */
export interface CyberGaugeChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'value'> {
  /** Current value */
  value: number;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Color theme */
  theme?: ChartTheme;
  /** Chart padding */
  padding?: Partial<ChartPadding>;
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
  /** Enable animations */
  animate?: boolean;
  /** Animation configuration */
  animation?: AnimationConfig;
  /** Enable glow effects */
  glow?: boolean | GlowConfig;
  /** Show scanlines overlay */
  scanlines?: boolean;
  /** Responsive - auto-resize on container resize */
  responsive?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
  /** CSS class prefix */
  classPrefix?: string;
  /** Resize event handler */
  onResize?: ChartEventHandler;
}

/**
 * Ref handle for CyberGaugeChart
 */
export interface CyberGaugeChartRef {
  /** Update gauge value */
  update: (value: number) => void;
  /** Update chart options */
  setOptions: (options: Partial<GaugeChartOptions>) => void;
  /** Resize chart */
  resize: (width?: number, height?: number) => void;
  /** Get SVG element */
  getSVG: () => SVGSVGElement;
  /** Export as SVG string */
  toSVG: () => string;
  /** Get current value */
  getValue: () => number;
  /** Get chart instance */
  getChart: () => GaugeChart | null;
}

/**
 * React wrapper component for CyberCore GaugeChart
 */
export const CyberGaugeChart = forwardRef<CyberGaugeChartRef, CyberGaugeChartProps>(
  (
    {
      value,
      width,
      height,
      theme,
      padding,
      min,
      max,
      startAngle,
      endAngle,
      thickness,
      showValue,
      formatValue,
      showMinMax,
      label,
      thresholds,
      showTicks,
      tickCount,
      animate,
      animation,
      glow,
      scanlines,
      responsive,
      ariaLabel,
      classPrefix,
      onResize,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<GaugeChart | null>(null);

    // Memoize options to prevent unnecessary re-renders
    const options = useMemo<GaugeChartOptions>(
      () => ({
        value,
        width,
        height,
        theme,
        padding,
        min,
        max,
        startAngle,
        endAngle,
        thickness,
        showValue,
        formatValue,
        showMinMax,
        label,
        thresholds,
        showTicks,
        tickCount,
        animate,
        animation,
        glow,
        scanlines,
        responsive,
        ariaLabel,
        classPrefix,
      }),
      [
        value,
        width,
        height,
        theme,
        padding,
        min,
        max,
        startAngle,
        endAngle,
        thickness,
        showValue,
        formatValue,
        showMinMax,
        label,
        thresholds,
        showTicks,
        tickCount,
        animate,
        animation,
        glow,
        scanlines,
        responsive,
        ariaLabel,
        classPrefix,
      ]
    );

    // Initialize chart on mount
    useEffect(() => {
      if (!containerRef.current) {
        return;
      }

      chartRef.current = new GaugeChart(containerRef.current, options);

      return () => {
        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }
      };
    }, []); // Only run on mount

    // Update chart when options change
    useEffect(() => {
      if (chartRef.current) {
        chartRef.current.setOptions(options);
      }
    }, [options]);

    // Attach event handlers
    useEffect(() => {
      if (!chartRef.current) {
        return;
      }

      const chart = chartRef.current;
      const handlers: Array<{ event: ChartEventType; handler: ChartEventHandler }> = [];

      if (onResize) {
        chart.on('resize', onResize);
        handlers.push({ event: 'resize', handler: onResize });
      }

      return () => {
        handlers.forEach(({ event, handler }) => {
          chart.off(event, handler);
        });
      };
    }, [onResize]);

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        update: (newValue: number) => {
          chartRef.current?.update(newValue);
        },
        setOptions: (newOptions: Partial<GaugeChartOptions>) => {
          chartRef.current?.setOptions(newOptions);
        },
        resize: (w?: number, h?: number) => {
          chartRef.current?.resize(w, h);
        },
        getSVG: () => {
          if (!chartRef.current) {
            throw new Error('Chart not initialized');
          }
          return chartRef.current.getSVG();
        },
        toSVG: () => {
          if (!chartRef.current) {
            throw new Error('Chart not initialized');
          }
          return chartRef.current.toSVG();
        },
        getValue: () => {
          if (!chartRef.current) {
            throw new Error('Chart not initialized');
          }
          return chartRef.current.getValue();
        },
        getChart: () => chartRef.current,
      }),
      []
    );

    return (
      <div
        ref={containerRef}
        className={`cyber-chart-container ${className || ''}`}
        style={style}
        {...props}
      />
    );
  }
);

CyberGaugeChart.displayName = 'CyberGaugeChart';

export default CyberGaugeChart;
