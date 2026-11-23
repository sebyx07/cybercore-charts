// @vitest-environment happy-dom
/**
 * ChartBinding: the framework-free core the React and Ember adapters share.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChartBinding, definedOptions, shallowEqual } from '../../src/adapters/chart-binding';
import { LineChart } from '../../src/charts/LineChart';
import { mount, resetDocument } from '../helpers/dom';

import type { ChartEvent, ChartEventHandler, ChartEventType } from '../../src/types';

interface FakeOptions {
  data: number[];
  theme?: string;
  axis?: { show: boolean };
}

/** Records every call the binding makes into a chart */
class FakeChart {
  static instances: FakeChart[] = [];
  readonly setOptions = vi.fn<(options: Partial<FakeOptions>) => void>();
  readonly destroy = vi.fn<() => void>();
  readonly element: HTMLElement;
  readonly options: FakeOptions;
  private readonly listeners = new Map<ChartEventType, ChartEventHandler[]>();

  constructor(element: HTMLElement, options: FakeOptions) {
    this.element = element;
    this.options = options;
    FakeChart.instances.push(this);
  }

  on(event: ChartEventType, handler: ChartEventHandler): void {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), handler]);
  }

  off(): void {}

  emit(event: ChartEventType): void {
    const payload: ChartEvent = { type: event, target: null, data: null };
    this.listeners.get(event)?.forEach((handler) => handler(payload));
  }
}

afterEach(() => {
  FakeChart.instances = [];
  resetDocument();
});

describe('definedOptions', () => {
  it('drops undefined values and keeps falsy ones', () => {
    expect(definedOptions({ a: undefined, b: 0, c: false, d: null, e: '' })).toEqual({
      b: 0,
      c: false,
      d: null,
      e: '',
    });
  });
});

describe('shallowEqual', () => {
  it('treats equal inline arrays and objects as unchanged', () => {
    expect(shallowEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(shallowEqual({ show: true }, { show: true })).toBe(true);
  });

  it('sees a changed element, length, key or value', () => {
    expect(shallowEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    expect(shallowEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(shallowEqual({ show: true }, { show: false })).toBe(false);
    expect(shallowEqual({ show: true }, { hide: true })).toBe(false);
  });

  it('compares one level only', () => {
    expect(shallowEqual([{ x: 1 }], [{ x: 1 }])).toBe(false);
  });
});

describe('ChartBinding', () => {
  it('creates the chart without undefined options', () => {
    const element = mount();
    const binding = new ChartBinding(FakeChart, element, { data: [1], theme: undefined });

    expect(FakeChart.instances).toHaveLength(1);
    expect(binding.chart?.options).toEqual({ data: [1] });
    expect(binding.chart?.element).toBe(element);
  });

  it('does not touch the chart when nothing changed', () => {
    const binding = new ChartBinding(FakeChart, mount(), { data: [1, 2], axis: { show: true } });

    binding.update({ data: [1, 2], axis: { show: true } });

    expect(binding.chart?.setOptions).not.toHaveBeenCalled();
  });

  it('sends only the options that changed', () => {
    const data = [1, 2];
    const binding = new ChartBinding(FakeChart, mount(), { data, theme: 'cyan' });

    binding.update({ data, theme: 'magenta' });

    expect(binding.chart?.setOptions).toHaveBeenCalledExactlyOnceWith({ theme: 'magenta' });
  });

  it('rebuilds the chart when an option is removed, so its default returns', () => {
    const initial: FakeOptions = { data: [1], theme: 'magenta' };
    const binding = new ChartBinding(FakeChart, mount(), initial);
    const first = binding.chart;

    binding.update({ data: [1], theme: undefined });

    expect(first?.destroy).toHaveBeenCalledOnce();
    expect(FakeChart.instances).toHaveLength(2);
    expect(binding.chart).not.toBe(first);
    expect(binding.chart?.options).toEqual({ data: [1] });
  });

  it('calls the handler of the latest update, without re-subscribing', () => {
    const first = vi.fn();
    const second = vi.fn();
    const binding = new ChartBinding(FakeChart, mount(), { data: [1] }, { pointClick: first });

    binding.update({ data: [1] }, { pointClick: second });
    binding.chart?.emit('pointClick');

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('destroys the chart once and ignores later calls', () => {
    const binding = new ChartBinding(FakeChart, mount(), { data: [1] });
    const chart = binding.chart;

    binding.destroy();
    binding.destroy();
    binding.update({ data: [2] });

    expect(chart?.destroy).toHaveBeenCalledOnce();
    expect(binding.chart).toBeNull();
    expect(chart?.setOptions).not.toHaveBeenCalled();
  });

  it('drives a real chart: renders, updates in place, cleans the element', () => {
    const element = mount();
    const binding = new ChartBinding(LineChart, element, {
      data: [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
      ],
      animate: false,
    });
    const svg = element.querySelector('svg');
    expect(svg).not.toBeNull();

    binding.update({
      data: [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 2 },
      ],
      animate: false,
    });
    expect(element.querySelector('svg')).toBe(svg);

    binding.destroy();
    expect(element.childNodes).toHaveLength(0);
  });
});
