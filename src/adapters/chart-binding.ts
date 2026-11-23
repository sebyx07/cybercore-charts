/**
 * CyberCore Charts - Chart Binding
 * Framework-free glue between a chart instance and a declarative host
 * (a React component, an Ember modifier). The host hands over the options it
 * currently wants; the binding works out the smallest call that gets the
 * chart there.
 */

import type { ChartEventHandler, ChartEventType } from '../types';

/**
 * The part of a chart instance the binding drives
 */
export interface BindableChart<TOptions extends object> {
  setOptions(options: Partial<TOptions>): void;
  destroy(): void;
  on(event: ChartEventType, handler: ChartEventHandler): void;
  off(event: ChartEventType, handler?: ChartEventHandler): void;
}

/**
 * A chart class the binding can instantiate
 */
export type ChartConstructor<
  TOptions extends object,
  TChart extends BindableChart<TOptions>,
> = new (container: HTMLElement, options: TOptions) => TChart;

/**
 * Event handlers keyed by chart event
 */
export type ChartEventHandlers = Partial<Record<ChartEventType, ChartEventHandler | undefined>>;

const CHART_EVENTS: readonly ChartEventType[] = [
  'pointHover',
  'pointClick',
  'segmentHover',
  'segmentClick',
  'barHover',
  'barClick',
  'legendClick',
  'resize',
];

/**
 * Drops keys whose value is undefined, so an omitted prop never overwrites a
 * chart default.
 */
export function definedOptions<TOptions extends object>(options: TOptions): TOptions {
  const defined: Partial<TOptions> = {};
  for (const key of Object.keys(options) as (keyof TOptions)[]) {
    if (options[key] !== undefined) {
      defined[key] = options[key];
    }
  }
  return defined as TOptions;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Identity, or one level of structural equality for arrays and plain objects.
 * One level is what makes inline literals (`xAxis={{ showGrid: true }}`,
 * `data={[4, 8, 15]}`) stable between renders without walking whole datasets.
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => key in b && Object.is(a[key], b[key]))
    );
  }
  return false;
}

/**
 * Owns one chart instance inside one element for as long as the host keeps
 * the element mounted.
 */
export class ChartBinding<TOptions extends object, TChart extends BindableChart<TOptions>> {
  private instance: TChart | null;
  private options: TOptions;
  private handlers: ChartEventHandlers;

  constructor(
    private readonly ChartClass: ChartConstructor<TOptions, TChart>,
    private readonly element: HTMLElement,
    options: TOptions,
    handlers: ChartEventHandlers = {}
  ) {
    this.options = definedOptions(options);
    this.handlers = handlers;
    this.instance = this.create();
  }

  /**
   * The live chart, or null once the binding is destroyed
   */
  get chart(): TChart | null {
    return this.instance;
  }

  /**
   * Moves the chart to a new set of options.
   * Unchanged options cost nothing, changed ones go through `setOptions`, and
   * an option that was removed rebuilds the chart so its default comes back.
   */
  update(options: TOptions, handlers: ChartEventHandlers = {}): void {
    this.handlers = handlers;
    if (!this.instance) {
      return;
    }

    const next = definedOptions(options);
    const previous = this.options;
    this.options = next;

    const removed = (Object.keys(previous) as (keyof TOptions)[]).some((key) => !(key in next));
    if (removed) {
      this.instance.destroy();
      this.instance = this.create();
      return;
    }

    const changed: Partial<TOptions> = {};
    let hasChanges = false;
    for (const key of Object.keys(next) as (keyof TOptions)[]) {
      if (!shallowEqual(previous[key], next[key])) {
        changed[key] = next[key];
        hasChanges = true;
      }
    }
    if (hasChanges) {
      this.instance.setOptions(changed);
    }
  }

  /**
   * Destroys the chart and empties the element. Safe to call twice.
   */
  destroy(): void {
    this.instance?.destroy();
    this.instance = null;
    this.handlers = {};
  }

  private create(): TChart {
    const chart = new this.ChartClass(this.element, { ...this.options });
    // One stable listener per event reads the current handler when it fires,
    // so a host passing a new function on every render never re-subscribes.
    for (const event of CHART_EVENTS) {
      chart.on(event, (payload) => this.handlers[event]?.(payload));
    }
    return chart;
  }
}
