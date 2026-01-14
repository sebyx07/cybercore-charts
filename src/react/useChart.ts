/**
 * CyberCore Charts - React Hook for Chart Lifecycle
 * Generic hook for managing chart mount/unmount and options updates
 */

import { useRef, useEffect, useCallback } from 'react';

/**
 * Base interface for chart instances
 */
interface BaseChart {
  setOptions(options: unknown): void;
  resize(width?: number, height?: number): void;
  destroy(): void;
}

/**
 * Generic hook for managing chart lifecycle in React
 *
 * @param ChartClass - The chart class constructor
 * @param options - Chart options passed as props
 * @returns A ref to attach to the container div
 */
export function useChart<TChart extends BaseChart, TOptions extends Record<string, unknown>>(
  ChartClass: new (el: HTMLElement, options: TOptions) => TChart,
  options: TOptions
): React.RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<TChart | null>(null);
  const prevOptionsRef = useRef<TOptions | null>(null);

  // Initialize chart on mount
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // Create chart instance
    chartRef.current = new ChartClass(containerRef.current, options);
    prevOptionsRef.current = options;

    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []); // Only run on mount/unmount

  // Update chart options when props change
  useEffect(() => {
    if (!chartRef.current || !prevOptionsRef.current) {
      return;
    }

    // Check if options have actually changed
    const hasChanges = Object.keys(options).some(
      (key) => options[key as keyof TOptions] !== prevOptionsRef.current?.[key as keyof TOptions]
    );

    if (hasChanges) {
      chartRef.current.setOptions(options);
      prevOptionsRef.current = options;
    }
  }, [options]);

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current || !chartRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && chartRef.current) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          chartRef.current.resize(width, height);
        }
      }
    });

    // Only observe if responsive option is enabled
    if (options.responsive) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [options.responsive]);

  return containerRef;
}

/**
 * Hook for imperative chart access
 * Returns methods to interact with the chart instance
 */
export function useChartInstance<TChart extends BaseChart>() {
  const chartRef = useRef<TChart | null>(null);

  const setChart = useCallback((chart: TChart | null) => {
    chartRef.current = chart;
  }, []);

  const getChart = useCallback(() => chartRef.current, []);

  return { chartRef, setChart, getChart };
}

export default useChart;
