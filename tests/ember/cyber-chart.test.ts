// @vitest-environment happy-dom
/**
 * Ember adapter: the cyberChart modifier.
 *
 * Runs against the real `ember-modifier` base class and `@ember/destroyable`,
 * and calls the modifier the way Ember's modifier manager does (construct,
 * `modify` on install and on every tracked change, destroy). It does not boot
 * an Ember application or render a template.
 */

import { destroy as destroyDestroyable } from '@ember/destroyable';
import { run } from '@ember/runloop';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GaugeChart } from '../../src/charts/GaugeChart';
import { LineChart } from '../../src/charts/LineChart';
import CyberChartModifier, { cyberChart } from '../../src/ember';
import { mount, resetDocument } from '../helpers/dom';

import type { ChartEvent, DataPoint } from '../../src/types';

const POINTS: DataPoint[] = [
  { x: 0, y: 4 },
  { x: 1, y: 9 },
];

/** Installs the modifier on an element, as Ember does on first render */
function install(type: string, named: Record<string, unknown>) {
  const element = mount();
  const modifier = new CyberChartModifier({} as never, { positional: [type], named } as never);
  const modify = (nextType: string, nextNamed: Record<string, unknown>) =>
    modifier.modify(element, [nextType] as never, nextNamed as never);
  modify(type, named);
  return { element, modify, destroy: () => run(() => destroyDestroyable(modifier)) };
}

afterEach(() => {
  vi.restoreAllMocks();
  resetDocument();
});

describe('cyberChart modifier', () => {
  it('is exported as default and by name', () => {
    expect(cyberChart).toBe(CyberChartModifier);
  });

  it('renders the named chart into the element', () => {
    const { element } = install('line', { data: POINTS, animate: false });

    expect(element.querySelectorAll('svg')).toHaveLength(1);
  });

  it('hands the chart instance to onCreated', () => {
    const onCreated = vi.fn();

    install('gauge', { value: 30, animate: false, onCreated });

    expect(onCreated).toHaveBeenCalledOnce();
    expect(onCreated.mock.calls[0]?.[0]).toBeInstanceOf(GaugeChart);
  });

  it('updates the chart in place when an argument changes', () => {
    const setOptions = vi.spyOn(LineChart.prototype, 'setOptions');
    const onCreated = vi.fn();
    const { element, modify } = install('line', { data: POINTS, animate: false, onCreated });
    const svg = element.querySelector('svg');
    const next = [...POINTS, { x: 2, y: 6 }];

    modify('line', { data: next, animate: false, onCreated });

    expect(setOptions).toHaveBeenCalledExactlyOnceWith({ data: next });
    expect(element.querySelector('svg')).toBe(svg);
    expect(onCreated).toHaveBeenCalledOnce();
  });

  it('does nothing when re-run with the same arguments', () => {
    const setOptions = vi.spyOn(LineChart.prototype, 'setOptions');
    const { modify } = install('line', { data: POINTS, animate: false });

    modify('line', { data: POINTS, animate: false });

    expect(setOptions).not.toHaveBeenCalled();
  });

  it('replaces the chart when the type changes', () => {
    const onCreated = vi.fn();
    const onWillDestroy = vi.fn();
    const { element, modify } = install('line', {
      data: POINTS,
      animate: false,
      onCreated,
      onWillDestroy,
    });

    modify('gauge', { value: 50, animate: false, onCreated, onWillDestroy });

    expect(onWillDestroy).toHaveBeenCalledOnce();
    expect(onWillDestroy.mock.calls[0]?.[0]).toBeInstanceOf(LineChart);
    expect(onCreated.mock.calls[1]?.[0]).toBeInstanceOf(GaugeChart);
    expect(element.querySelectorAll('svg')).toHaveLength(1);
  });

  it('routes on* arguments to chart events, using the latest handler', () => {
    const first = vi.fn();
    const second = vi.fn<(event: ChartEvent) => void>();
    let chart: InstanceType<typeof LineChart> | undefined;
    const onCreated = (created: InstanceType<typeof LineChart>) => {
      chart = created;
    };
    const { modify } = install('line', {
      data: POINTS,
      animate: false,
      onResize: first,
      onCreated,
    });

    modify('line', { data: POINTS, animate: false, onResize: second, onCreated });
    chart?.resize(300, 200);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    expect(second.mock.calls[0]?.[0].type).toBe('resize');
  });

  it('destroys the chart with the element and reports it first', () => {
    const onWillDestroy = vi.fn();
    const { element, destroy } = install('line', { data: POINTS, animate: false, onWillDestroy });

    destroy();

    expect(onWillDestroy).toHaveBeenCalledOnce();
    expect(element.childNodes).toHaveLength(0);
  });

  it('rejects an unknown chart type with the valid names', () => {
    expect(() => install('radar', { data: POINTS })).toThrow(
      'cyberChart: unknown chart type "radar". Use one of: line, bar, donut, gauge, sparkline.'
    );
  });
});
