/**
 * CyberCore Charts - React Line Chart Component
 * React wrapper for the LineChart class
 */

import React, { forwardRef, useRef, useEffect, useImperativeHandle, useMemo } from 'react';

import { LineChart } from '../charts/LineChart';

import type {
  LineChartOptions,
  DataPoint,
  DataSeries,
  ChartTheme,
  ChartPadding,
  AxisConfig,
  LegendConfig,
  TooltipConfig,
  AnimationConfig,
  GlowConfig,
  LineInterpolation,
  ChartEventType,
  ChartEventHandler,
} from '../types';

/**
 * Props for CyberLineChart component
 */
export interface CyberLineChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'data'> {
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
  /** Connect null/missing values */
  connectNulls?: boolean;
  /** Responsive - auto-resize on container resize */
  responsive?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
  /** CSS class prefix */
  classPrefix?: string;
  /** Point hover event handler */
  onPointHover?: ChartEventHandler;
  /** Point click event handler */
  onPointClick?: ChartEventHandler;
  /** Resize event handler */
  onResize?: ChartEventHandler;
}

/**
 * Ref handle for CyberLineChart
 */
export interface CyberLineChartRef {
  /** Update chart with new data */
  update: (data: DataPoint[] | DataSeries[]) => void;
  /** Update chart options */
  setOptions: (options: Partial<LineChartOptions>) => void;
  /** Resize chart */
  resize: (width?: number, height?: number) => void;
  /** Get SVG element */
  getSVG: () => SVGSVGElement;
  /** Export as SVG string */
  toSVG: () => string;
  /** Get chart instance */
  getChart: () => LineChart | null;
}

/**
 * React wrapper component for CyberCore LineChart
 */
export const CyberLineChart = forwardRef<CyberLineChartRef, CyberLineChartProps>(
  (
    {
      data,
      width,
      height,
      theme,
      padding,
      showArea,
      areaOpacity,
      showPoints,
      pointRadius,
      lineWidth,
      interpolation,
      animate,
      animation,
      glow,
      scanlines,
      xAxis,
      yAxis,
      legend,
      tooltip,
      connectNulls,
      responsive,
      ariaLabel,
      classPrefix,
      onPointHover,
      onPointClick,
      onResize,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<LineChart | null>(null);

    // Memoize options to prevent unnecessary re-renders
    const options = useMemo<LineChartOptions>(
      () => ({
        data,
        width,
        height,
        theme,
        padding,
        showArea,
        areaOpacity,
        showPoints,
        pointRadius,
        lineWidth,
        interpolation,
        animate,
        animation,
        glow,
        scanlines,
        xAxis,
        yAxis,
        legend,
        tooltip,
        connectNulls,
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
        showArea,
        areaOpacity,
        showPoints,
        pointRadius,
        lineWidth,
        interpolation,
        animate,
        animation,
        glow,
        scanlines,
        xAxis,
        yAxis,
        legend,
        tooltip,
        connectNulls,
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

      chartRef.current = new LineChart(containerRef.current, options);

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

      if (onPointHover) {
        chart.on('pointHover', onPointHover);
        handlers.push({ event: 'pointHover', handler: onPointHover });
      }
      if (onPointClick) {
        chart.on('pointClick', onPointClick);
        handlers.push({ event: 'pointClick', handler: onPointClick });
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
    }, [onPointHover, onPointClick, onResize]);

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        update: (newData: DataPoint[] | DataSeries[]) => {
          chartRef.current?.update(newData);
        },
        setOptions: (newOptions: Partial<LineChartOptions>) => {
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

CyberLineChart.displayName = 'CyberLineChart';

export default CyberLineChart;
