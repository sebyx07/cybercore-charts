/**
 * CyberCore Charts - React Bar Chart Component
 * React wrapper for the BarChart class
 */

import React, { forwardRef, useRef, useEffect, useImperativeHandle, useMemo } from 'react';

import { BarChart } from '../charts/BarChart';

import type {
  BarChartOptions,
  DataPoint,
  DataSeries,
  ChartTheme,
  ChartPadding,
  AxisConfig,
  LegendConfig,
  TooltipConfig,
  AnimationConfig,
  GlowConfig,
  BarOrientation,
  BarGroupMode,
  ChartEventType,
  ChartEventHandler,
} from '../types';

/**
 * Props for CyberBarChart component
 */
export interface CyberBarChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'data'> {
  /** Chart data - single series or multiple */
  data: DataPoint[] | DataSeries[];
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Color theme */
  theme?: ChartTheme;
  /** Chart padding */
  padding?: Partial<ChartPadding>;
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
  /** Enable animations */
  animate?: boolean;
  /** Animation configuration */
  animation?: AnimationConfig;
  /** Enable glow effects */
  glow?: boolean | GlowConfig;
  /** Show scanlines overlay */
  scanlines?: boolean;
  /** X-axis configuration */
  xAxis?: AxisConfig;
  /** Y-axis configuration */
  yAxis?: AxisConfig;
  /** Legend configuration */
  legend?: LegendConfig;
  /** Tooltip configuration */
  tooltip?: TooltipConfig;
  /** Show value labels on bars */
  showValues?: boolean;
  /** Value label position */
  valuePosition?: 'inside' | 'outside' | 'center';
  /** Responsive - auto-resize on container resize */
  responsive?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
  /** CSS class prefix */
  classPrefix?: string;
  /** Bar hover event handler */
  onBarHover?: ChartEventHandler;
  /** Bar click event handler */
  onBarClick?: ChartEventHandler;
  /** Resize event handler */
  onResize?: ChartEventHandler;
}

/**
 * Ref handle for CyberBarChart
 */
export interface CyberBarChartRef {
  /** Update chart with new data */
  update: (data: DataPoint[] | DataSeries[]) => void;
  /** Update chart options */
  setOptions: (options: Partial<BarChartOptions>) => void;
  /** Resize chart */
  resize: (width?: number, height?: number) => void;
  /** Get SVG element */
  getSVG: () => SVGSVGElement;
  /** Export as SVG string */
  toSVG: () => string;
  /** Get chart instance */
  getChart: () => BarChart | null;
}

/**
 * React wrapper component for CyberCore BarChart
 */
export const CyberBarChart = forwardRef<CyberBarChartRef, CyberBarChartProps>(
  (
    {
      data,
      width,
      height,
      theme,
      padding,
      orientation,
      groupMode,
      borderRadius,
      barGap,
      groupGap,
      animate,
      animation,
      glow,
      scanlines,
      xAxis,
      yAxis,
      legend,
      tooltip,
      showValues,
      valuePosition,
      responsive,
      ariaLabel,
      classPrefix,
      onBarHover,
      onBarClick,
      onResize,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<BarChart | null>(null);

    // Memoize options to prevent unnecessary re-renders
    const options = useMemo<BarChartOptions>(
      () => ({
        data,
        width,
        height,
        theme,
        padding,
        orientation,
        groupMode,
        borderRadius,
        barGap,
        groupGap,
        animate,
        animation,
        glow,
        scanlines,
        xAxis,
        yAxis,
        legend,
        tooltip,
        showValues,
        valuePosition,
        responsive,
        ariaLabel,
        classPrefix,
      }),
      [
        data,
        width,
        height,
        theme,
        padding,
        orientation,
        groupMode,
        borderRadius,
        barGap,
        groupGap,
        animate,
        animation,
        glow,
        scanlines,
        xAxis,
        yAxis,
        legend,
        tooltip,
        showValues,
        valuePosition,
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

      chartRef.current = new BarChart(containerRef.current, options);

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

      if (onBarHover) {
        chart.on('barHover', onBarHover);
        handlers.push({ event: 'barHover', handler: onBarHover });
      }
      if (onBarClick) {
        chart.on('barClick', onBarClick);
        handlers.push({ event: 'barClick', handler: onBarClick });
      }
      if (onResize) {
        chart.on('resize', onResize);
        handlers.push({ event: 'resize', handler: onResize });
      }

      return () => {
        handlers.forEach(({ event, handler }) => {
          chart.off(event, handler);
        });
      };
    }, [onBarHover, onBarClick, onResize]);

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        update: (newData: DataPoint[] | DataSeries[]) => {
          chartRef.current?.update(newData);
        },
        setOptions: (newOptions: Partial<BarChartOptions>) => {
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

CyberBarChart.displayName = 'CyberBarChart';

export default CyberBarChart;
