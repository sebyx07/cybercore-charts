/**
 * CyberCore Charts - React Donut Chart Component
 * React wrapper for the DonutChart class
 */

import React, { forwardRef, useRef, useEffect, useImperativeHandle, useMemo } from 'react';

import { DonutChart } from '../charts/DonutChart';

import type {
  DonutChartOptions,
  DonutSegment,
  ChartTheme,
  ChartPadding,
  LegendConfig,
  TooltipConfig,
  AnimationConfig,
  GlowConfig,
  ChartEventType,
  ChartEventHandler,
} from '../types';

/**
 * Props for CyberDonutChart component
 */
export interface CyberDonutChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'data'> {
  /** Chart data */
  data: DonutSegment[];
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Color theme */
  theme?: ChartTheme;
  /** Chart padding */
  padding?: Partial<ChartPadding>;
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
  /** Starting angle in degrees */
  startAngle?: number;
  /** Sort segments by value */
  sortSegments?: boolean | 'asc' | 'desc';
  /** Enable animations */
  animate?: boolean;
  /** Animation configuration */
  animation?: AnimationConfig;
  /** Enable glow effects */
  glow?: boolean | GlowConfig;
  /** Show scanlines overlay */
  scanlines?: boolean;
  /** Legend configuration */
  legend?: LegendConfig;
  /** Tooltip configuration */
  tooltip?: TooltipConfig;
  /** Responsive - auto-resize on container resize */
  responsive?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
  /** CSS class prefix */
  classPrefix?: string;
  /** Segment hover event handler */
  onSegmentHover?: ChartEventHandler;
  /** Segment click event handler */
  onSegmentClick?: ChartEventHandler;
  /** Resize event handler */
  onResize?: ChartEventHandler;
}

/**
 * Ref handle for CyberDonutChart
 */
export interface CyberDonutChartRef {
  /** Update chart with new data */
  update: (data: DonutSegment[]) => void;
  /** Update chart options */
  setOptions: (options: Partial<DonutChartOptions>) => void;
  /** Resize chart */
  resize: (width?: number, height?: number) => void;
  /** Get SVG element */
  getSVG: () => SVGSVGElement;
  /** Export as SVG string */
  toSVG: () => string;
  /** Get total value */
  getTotal: () => number;
  /** Get chart instance */
  getChart: () => DonutChart | null;
}

/**
 * React wrapper component for CyberCore DonutChart
 */
export const CyberDonutChart = forwardRef<CyberDonutChartRef, CyberDonutChartProps>(
  (
    {
      data,
      width,
      height,
      theme,
      padding,
      innerRadius,
      segmentGap,
      showLabels,
      labelPosition,
      showPercentages,
      centerText,
      centerSubtext,
      startAngle,
      sortSegments,
      animate,
      animation,
      glow,
      scanlines,
      legend,
      tooltip,
      responsive,
      ariaLabel,
      classPrefix,
      onSegmentHover,
      onSegmentClick,
      onResize,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<DonutChart | null>(null);

    // Memoize options to prevent unnecessary re-renders
    const options = useMemo<DonutChartOptions>(
      () => ({
        data,
        width,
        height,
        theme,
        padding,
        innerRadius,
        segmentGap,
        showLabels,
        labelPosition,
        showPercentages,
        centerText,
        centerSubtext,
        startAngle,
        sortSegments,
        animate,
        animation,
        glow,
        scanlines,
        legend,
        tooltip,
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
        innerRadius,
        segmentGap,
        showLabels,
        labelPosition,
        showPercentages,
        centerText,
        centerSubtext,
        startAngle,
        sortSegments,
        animate,
        animation,
        glow,
        scanlines,
        legend,
        tooltip,
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

      chartRef.current = new DonutChart(containerRef.current, options);

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

      if (onSegmentHover) {
        chart.on('segmentHover', onSegmentHover);
        handlers.push({ event: 'segmentHover', handler: onSegmentHover });
      }
      if (onSegmentClick) {
        chart.on('segmentClick', onSegmentClick);
        handlers.push({ event: 'segmentClick', handler: onSegmentClick });
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
    }, [onSegmentHover, onSegmentClick, onResize]);

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        update: (newData: DonutSegment[]) => {
          chartRef.current?.update(newData);
        },
        setOptions: (newOptions: Partial<DonutChartOptions>) => {
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
        getTotal: () => {
          if (!chartRef.current) {
            throw new Error('Chart not initialized');
          }
          return chartRef.current.getTotal();
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

CyberDonutChart.displayName = 'CyberDonutChart';

export default CyberDonutChart;
