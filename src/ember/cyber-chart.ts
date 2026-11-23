/**
 * CyberCore Charts - Ember modifier
 * Renders a chart into the element it is attached to and keeps it in step
 * with its arguments through auto-tracking.
 */

import { registerDestructor } from '@ember/destroyable';
import Modifier from 'ember-modifier';

import { ChartBinding } from '../adapters/chart-binding';
import { BarChart } from '../charts/BarChart';
import { DonutChart } from '../charts/DonutChart';
import { GaugeChart } from '../charts/GaugeChart';
import { LineChart } from '../charts/LineChart';
import { Sparkline } from '../charts/Sparkline';

import type { ChartEventHandlers } from '../adapters/chart-binding';
import type {
  BarChartOptions,
  ChartEventHandler,
  ChartEventType,
  DonutChartOptions,
  GaugeChartOptions,
  LineChartOptions,
  SparklineOptions,
} from '../types';
import type Owner from '@ember/owner';
import type { ArgsFor } from 'ember-modifier';

/**
 * Chart names the modifier accepts as its first argument
 */
export type CyberChartType = 'line' | 'bar' | 'donut' | 'gauge' | 'sparkline';

/**
 * Options per chart type
 */
export interface CyberChartOptionsMap {
  line: LineChartOptions;
  bar: BarChartOptions;
  donut: DonutChartOptions;
  gauge: GaugeChartOptions;
  sparkline: SparklineOptions;
}

/**
 * Chart instance per chart type
 */
export interface CyberChartInstanceMap {
  line: LineChart;
  bar: BarChart;
  donut: DonutChart;
  gauge: GaugeChart;
  sparkline: Sparkline;
}

const EVENT_ARGS = {
  onPointHover: 'pointHover',
  onPointClick: 'pointClick',
  onSegmentHover: 'segmentHover',
  onSegmentClick: 'segmentClick',
  onBarHover: 'barHover',
  onBarClick: 'barClick',
  onLegendClick: 'legendClick',
  onResize: 'resize',
} as const satisfies Record<string, ChartEventType>;

/**
 * Named arguments that are not chart options: chart events and lifecycle hooks
 */
export type CyberChartCallbacks<T extends CyberChartType = CyberChartType> = {
  [K in keyof typeof EVENT_ARGS]?: ChartEventHandler;
} & {
  /** Called with the chart instance each time one is created */
  onCreated?: (chart: CyberChartInstanceMap[T]) => void;
  /** Called with the chart instance just before it is destroyed */
  onWillDestroy?: (chart: CyberChartInstanceMap[T]) => void;
};

/**
 * Signature of the `cyberChart` modifier
 */
export interface CyberChartSignature<T extends CyberChartType = CyberChartType> {
  Element: HTMLElement;
  Args: {
    Positional: [type: T];
    Named: CyberChartOptionsMap[T] & CyberChartCallbacks<T>;
  };
}

const CHARTS: {
  [K in CyberChartType]: new (
    element: HTMLElement,
    options: CyberChartOptionsMap[K]
  ) => CyberChartInstanceMap[K];
} = {
  line: LineChart,
  bar: BarChart,
  donut: DonutChart,
  gauge: GaugeChart,
  sparkline: Sparkline,
};

// Inside the modifier the chart type is only known at run time, so the
// binding is driven through the loosest shape every chart satisfies.
type AnyChart = CyberChartInstanceMap[CyberChartType];
type AnyOptions = Record<string, unknown>;
type AnyBinding = ChartBinding<AnyOptions, AnyChart>;
type AnyChartConstructor = new (element: HTMLElement, options: AnyOptions) => AnyChart;

interface SplitArgs {
  options: AnyOptions;
  handlers: ChartEventHandlers;
  onCreated?: (chart: AnyChart) => void;
  onWillDestroy?: (chart: AnyChart) => void;
}

function splitArgs(named: object): SplitArgs {
  const split: SplitArgs = { options: {}, handlers: {} };
  // Reading every argument here is also what subscribes the modifier to all
  // of them: Ember re-runs `modify` when any tracked value read in it changes.
  for (const [name, value] of Object.entries(named)) {
    if (name in EVENT_ARGS) {
      split.handlers[EVENT_ARGS[name as keyof typeof EVENT_ARGS]] = value as ChartEventHandler;
    } else if (name === 'onCreated' || name === 'onWillDestroy') {
      split[name] = value as (chart: AnyChart) => void;
    } else {
      split.options[name] = value;
    }
  }
  return split;
}

/**
 * Renders a CyberCore chart into an element.
 *
 * The first argument names the chart; every named argument is a chart option
 * or an event handler. The chart is created on insert, updated in place when
 * an argument changes, and destroyed with the element.
 *
 * @example Template tag (`.gjs` / `.gts`)
 * ```gts
 * import { cyberChart } from 'cybercore-charts/ember';
 *
 * <template>
 *   <div {{cyberChart "line" data=@points theme="cyan" showArea=true responsive=true}}></div>
 * </template>
 * ```
 *
 * @example Classic templates: re-export it once as `app/modifiers/cyber-chart.js`
 * ```js
 * export { default } from 'cybercore-charts/ember';
 * ```
 * ```hbs
 * <div {{cyber-chart "gauge" value=this.load max=100 label="Load" onCreated=this.keepChart}}></div>
 * ```
 */
export default class CyberChartModifier<T extends CyberChartType = CyberChartType> extends Modifier<
  CyberChartSignature<T>
> {
  private binding: AnyBinding | null = null;
  private type: CyberChartType | null = null;
  private onWillDestroy: ((chart: AnyChart) => void) | undefined;

  constructor(owner: Owner, args: ArgsFor<CyberChartSignature<T>>) {
    super(owner, args);
    registerDestructor(this, (modifier) => modifier.teardown());
  }

  override modify(
    element: HTMLElement,
    [type]: [type: T],
    named: CyberChartSignature<T>['Args']['Named']
  ): void {
    const ChartClass = (CHARTS as Record<string, unknown>)[type] as AnyChartConstructor | undefined;
    if (!ChartClass) {
      throw new Error(
        `cyberChart: unknown chart type "${String(type)}". Use one of: ${Object.keys(CHARTS).join(', ')}.`
      );
    }

    const { options, handlers, onCreated, onWillDestroy } = splitArgs(named);
    this.onWillDestroy = onWillDestroy;

    if (this.binding && this.type === type) {
      const before = this.binding.chart;
      this.binding.update(options, handlers);
      const after = this.binding.chart;
      // Removing an option rebuilds the chart; tell the host about the new one.
      if (after && after !== before) {
        onCreated?.(after);
      }
      return;
    }

    this.teardown();
    this.binding = new ChartBinding(ChartClass, element, options, handlers);
    this.type = type;
    if (this.binding.chart) {
      onCreated?.(this.binding.chart);
    }
  }

  private teardown(): void {
    const chart = this.binding?.chart;
    if (chart) {
      this.onWillDestroy?.(chart);
    }
    this.binding?.destroy();
    this.binding = null;
    this.type = null;
  }
}
