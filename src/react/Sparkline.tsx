/**
 * CyberCore Charts - React Sparkline Component
 * React wrapper for the Sparkline class
 */

import React, { forwardRef, useRef, useEffect, useImperativeHandle, useMemo } from 'react';

import { Sparkline } from '../charts/Sparkline';

import type { SparklineOptions, ChartTheme } from '../types';

/**
 * Props for CyberSparkline component
 */
export interface CyberSparklineProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'data'> {
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
export interface CyberSparklineRef {
  /** Update sparkline with new data */
  update: (data: number[]) => void;
  /** Update sparkline options */
  setOptions: (options: Partial<SparklineOptions>) => void;
  /** Resize sparkline */
  resize: (width?: number, height?: number) => void;
  /** Get SVG element */
  getSVG: () => SVGSVGElement;
  /** Export as SVG string */
  toSVG: () => string;
  /** Get current data */
  getData: () => number[];
  /** Get data statistics */
  getStats: () => SparklineStats;
  /** Get sparkline instance */
  getChart: () => Sparkline | null;
}

/**
 * React wrapper component for CyberCore Sparkline
 */
export const CyberSparkline = forwardRef<CyberSparklineRef, CyberSparklineProps>(
  (
    {
      data,
      width,
      height,
      theme,
      color,
      lineWidth,
      showArea,
      areaOpacity,
      showEndPoint,
      showMinMax,
      glow,
      interpolation,
      animate,
      animationDuration,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<Sparkline | null>(null);

    // Memoize options to prevent unnecessary re-renders
    const options = useMemo<SparklineOptions>(
      () => ({
        data,
        width,
        height,
        theme,
        color,
        lineWidth,
        showArea,
        areaOpacity,
        showEndPoint,
        showMinMax,
        glow,
        interpolation,
        animate,
        animationDuration,
      }),
      [
        data,
        width,
        height,
        theme,
        color,
        lineWidth,
        showArea,
        areaOpacity,
        showEndPoint,
        showMinMax,
        glow,
        interpolation,
        animate,
        animationDuration,
      ]
    );

    // Initialize chart on mount
    useEffect(() => {
      if (!containerRef.current) {
        return;
      }

      chartRef.current = new Sparkline(containerRef.current, options);

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

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        update: (newData: number[]) => {
          chartRef.current?.update(newData);
        },
        setOptions: (newOptions: Partial<SparklineOptions>) => {
          chartRef.current?.setOptions(newOptions);
        },
        resize: (w?: number, h?: number) => {
          chartRef.current?.resize(w, h);
        },
        getSVG: () => {
          if (!chartRef.current) {
            throw new Error('Sparkline not initialized');
          }
          return chartRef.current.getSVG();
        },
        toSVG: () => {
          if (!chartRef.current) {
            throw new Error('Sparkline not initialized');
          }
          return chartRef.current.toSVG();
        },
        getData: () => {
          if (!chartRef.current) {
            throw new Error('Sparkline not initialized');
          }
          return chartRef.current.getData();
        },
        getStats: () => {
          if (!chartRef.current) {
            throw new Error('Sparkline not initialized');
          }
          return chartRef.current.getStats();
        },
        getChart: () => chartRef.current,
      }),
      []
    );

    return (
      <div
        ref={containerRef}
        className={`cyber-sparkline-container ${className || ''}`}
        style={{ display: 'inline-block', ...style }}
        {...props}
      />
    );
  }
);

CyberSparkline.displayName = 'CyberSparkline';

export default CyberSparkline;
