/**
 * CyberCore Charts - React Hooks for Chart Lifecycle
 * One chart instance per mounted container, created in an effect so nothing
 * touches the DOM while rendering (server rendering emits an empty container).
 */

import { useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { ChartBinding } from '../adapters/chart-binding';

import type {
  BindableChart,
  ChartConstructor,
  ChartEventHandlers,
} from '../adapters/chart-binding';
import type { Ref, RefObject } from 'react';

/**
 * What `useChartBinding` hands back
 */
export interface ChartBindingRefs<TChart, TElement extends HTMLElement = HTMLDivElement> {
  /** Attach to the element the chart renders into */
  containerRef: RefObject<TElement | null>;
  /** Reads the live chart instance, or null before mount and after unmount */
  getChart: () => TChart | null;
}

/**
 * Keeps a chart in step with the options and event handlers of the current
 * render.
 *
 * The chart is built after mount and destroyed on unmount. Under StrictMode
 * the mount effect runs twice; the first instance is destroyed (observers,
 * tooltip and SVG included) before the second is built, so nothing leaks.
 * Later renders only call into the chart for options whose value changed.
 *
 * @param ChartClass - The chart class to instantiate
 * @param options - Chart options for this render; undefined values are ignored
 * @param handlers - Chart event handlers for this render
 */
export function useChartBinding<
  TOptions extends object,
  TChart extends BindableChart<TOptions>,
  TElement extends HTMLElement = HTMLDivElement,
>(
  ChartClass: ChartConstructor<TOptions, TChart>,
  options: TOptions,
  handlers?: ChartEventHandlers
): ChartBindingRefs<TChart, TElement> {
  const containerRef = useRef<TElement | null>(null);
  const bindingRef = useRef<ChartBinding<TOptions, TChart> | null>(null);
  const latestRef = useRef({ options, handlers });

  // Runs after every render, before the mount effect below on the first one:
  // it records what this render asked for and syncs a chart that already exists.
  useEffect(() => {
    latestRef.current = { options, handlers };
    bindingRef.current?.update(options, handlers);
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }
    const latest = latestRef.current;
    const binding = new ChartBinding(ChartClass, element, latest.options, latest.handlers);
    bindingRef.current = binding;

    return () => {
      binding.destroy();
      if (bindingRef.current === binding) {
        bindingRef.current = null;
      }
    };
  }, [ChartClass]);

  const getChart = useCallback(() => bindingRef.current?.chart ?? null, []);

  return { containerRef, getChart };
}

/**
 * The methods every chart component exposes through its ref
 */
export interface ChartHandle<TChart, TOptions, TData> {
  /** Update the chart with new data */
  update: (data: TData) => void;
  /** Update chart options */
  setOptions: (options: Partial<TOptions>) => void;
  /** Resize the chart */
  resize: (width?: number, height?: number) => void;
  /** Get the SVG element */
  getSVG: () => SVGSVGElement;
  /** Export as an SVG string */
  toSVG: () => string;
  /** Get the chart instance, or null while the component is not mounted */
  getChart: () => TChart | null;
}

interface HandleChart<TOptions, TData> {
  update(data: TData): void;
  setOptions(options: Partial<TOptions>): void;
  resize(width?: number, height?: number): void;
  getSVG(): SVGSVGElement;
  toSVG(): string;
}

/**
 * Returns the mounted chart or throws a readable error. For ref methods that
 * have nothing sensible to return without a chart.
 */
export function requireChart<TChart>(getChart: () => TChart | null, name: string): TChart {
  const chart = getChart();
  if (!chart) {
    throw new Error(`${name} is not mounted`);
  }
  return chart;
}

/**
 * Builds the chart-specific part of a ref handle. Define it at module level:
 * its identity decides when the handle is rebuilt.
 */
export type HandleExtras<TChart, TExtra extends object> = (chart: () => TChart) => TExtra;

const NO_EXTRAS: HandleExtras<unknown, object> = () => ({});

/**
 * Exposes the shared imperative handle, plus chart-specific extras, on a ref.
 */
export function useChartHandle<
  TOptions,
  TData,
  TChart extends HandleChart<TOptions, TData>,
  TExtra extends object = object,
>(
  ref: Ref<ChartHandle<TChart, TOptions, TData> & TExtra> | undefined,
  getChart: () => TChart | null,
  name: string,
  extras: HandleExtras<TChart, TExtra> = NO_EXTRAS as HandleExtras<TChart, TExtra>
): void {
  useImperativeHandle(ref, () => {
    const mounted = () => requireChart(getChart, name);
    return {
      update: (data: TData) => getChart()?.update(data),
      setOptions: (options: Partial<TOptions>) => getChart()?.setOptions(options),
      resize: (width?: number, height?: number) => getChart()?.resize(width, height),
      getSVG: () => mounted().getSVG(),
      toSVG: () => mounted().toSVG(),
      getChart,
      ...extras(mounted),
    };
  }, [getChart, name, extras]);
}

/**
 * Splits component props into chart options and the rest (DOM attributes,
 * event handlers). `keys` lists every option of the chart; its type makes a
 * missing or misspelled key a compile error.
 */
export function splitProps<TOptions extends object, TProps extends TOptions>(
  props: TProps,
  keys: Record<keyof TOptions, true>
): [TOptions, Omit<TProps, keyof TOptions>] {
  const options: Partial<TOptions> = {};
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key in keys) {
      options[key as keyof TOptions] = value as TOptions[keyof TOptions];
    } else {
      rest[key] = value;
    }
  }
  return [options as TOptions, rest as Omit<TProps, keyof TOptions>];
}

/**
 * Mounts any chart class into a container and keeps its options in sync.
 * The lower-level building block behind the `Cyber*` components.
 *
 * @example
 * ```tsx
 * function Throughput({ data }: { data: DataPoint[] }) {
 *   const ref = useChart(LineChart, { data, theme: 'cyan', responsive: true });
 *   return <div ref={ref} style={{ height: 280 }} />;
 * }
 * ```
 *
 * @param ChartClass - The chart class constructor
 * @param options - Chart options; update them by rendering with new values
 * @returns A ref to attach to the container element
 */
export function useChart<TOptions extends object, TChart extends BindableChart<TOptions>>(
  ChartClass: ChartConstructor<TOptions, TChart>,
  options: TOptions
): RefObject<HTMLDivElement | null> {
  return useChartBinding(ChartClass, options).containerRef;
}

/**
 * Holds a chart instance in a ref for imperative access.
 * Pair it with `ref.current.getChart()` from a chart component.
 */
export function useChartInstance<TChart>() {
  const chartRef = useRef<TChart | null>(null);

  const setChart = useCallback((chart: TChart | null) => {
    chartRef.current = chart;
  }, []);

  const getChart = useCallback(() => chartRef.current, []);

  return { chartRef, setChart, getChart };
}

export default useChart;
