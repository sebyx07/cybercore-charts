// @vitest-environment happy-dom
/**
 * Chart rendering behaviour against a real DOM: edge-case data, lifecycle,
 * multiple charts per page, XSS, RTL and locale formatting.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BarChart } from '../src/charts/BarChart';
import { DonutChart } from '../src/charts/DonutChart';
import { GaugeChart } from '../src/charts/GaugeChart';
import { LineChart } from '../src/charts/LineChart';
import { Sparkline } from '../src/charts/Sparkline';
import { simplifyPath } from '../src/utils/math';

import { markup, mount, numbers, resetDocument, texts } from './helpers/dom';

import type { DataPoint, DataSeries } from '../src/types';

const quiet = { animate: false } as const;

beforeEach(() => {
  resetDocument();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function months(values: number[]): DataPoint[] {
  return values.map((y, i) => ({ x: `M${i + 1}`, y }));
}

function yTickLabels(container: Element): string[] {
  return texts(container, '.cyber-chart__y-axis .cyber-chart__tick-label');
}

describe('multiple charts per page', () => {
  it('gives every chart its own SVG ids', () => {
    new LineChart(mount(), { ...quiet, data: months([1, 2, 3]), showArea: true, scanlines: true });
    new LineChart(mount(), { ...quiet, data: months([3, 2, 1]), showArea: true, scanlines: true });
    new BarChart(mount(), { ...quiet, data: months([1, 2]) });
    new DonutChart(mount(), { ...quiet, data: [{ label: 'a', value: 1 }] });
    new GaugeChart(mount(), { ...quiet, value: 10 });
    new Sparkline(mount(), { ...quiet, data: [1, 2, 3], showArea: true });

    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references ids defined inside the same SVG', () => {
    const a = mount();
    const b = mount();
    new LineChart(a, { ...quiet, data: months([1, 5, 2]), showArea: true });
    new BarChart(b, { ...quiet, data: months([1, 5, 2]) });

    for (const container of [a, b]) {
      const svg = container.querySelector('svg')!;
      const refs = svg.outerHTML.match(/url\(#([^)]+)\)/g) ?? [];
      expect(refs.length).toBeGreaterThan(0);
      for (const ref of refs) {
        const id = ref.slice(5, -1);
        expect(svg.querySelector(`[id="${id}"]`), id).not.toBeNull();
      }
    }
  });
});

describe('LineChart', () => {
  it('derives the y-axis ticks from the data, not a fixed 0-100 range', () => {
    const el = mount();
    new LineChart(el, { ...quiet, data: months([200, 900, 400]), locale: 'en-US' });
    const labels = yTickLabels(el);
    expect(labels[labels.length - 1]).toBe('1,000');
    expect(labels).not.toContain('100');
  });

  it('keeps tick positions inside the plot area', () => {
    const el = mount();
    new LineChart(el, { ...quiet, data: months([-40, 25, 90]) });
    const ys = numbers(el, '.cyber-chart__y-axis .cyber-chart__tick-label', 'y');
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(240);
    }
  });

  it('does not duplicate <defs> on update', () => {
    const el = mount();
    const chart = new LineChart(el, { ...quiet, data: months([1, 2, 3]), showArea: true });
    chart.update(months([4, 5, 6]));
    chart.update(months([7, 8, 9]));
    expect(el.querySelectorAll('defs')).toHaveLength(1);
  });

  it('breaks the line at missing values instead of drawing NaN', () => {
    const el = mount();
    const data = [
      { x: 'a', y: 1 },
      { x: 'b', y: 2 },
      { x: 'c', y: NaN },
      { x: 'd', y: null as unknown as number },
      { x: 'e', y: 4 },
      { x: 'f', y: 5 },
    ];
    const chart = new LineChart(el, { ...quiet, data, showArea: true });
    expect(markup(el)).not.toMatch(/NaN|Infinity/);
    const d = el.querySelector('.cyber-chart__line')!.getAttribute('d')!;
    expect(d.match(/M/g)).toHaveLength(2);
    expect(el.querySelectorAll('.cyber-chart__point')).toHaveLength(4);

    chart.setOptions({ connectNulls: true });
    const joined = el.querySelector('.cyber-chart__line')!.getAttribute('d')!;
    expect(joined.match(/M/g)).toHaveLength(1);
  });

  it('renders empty data without NaN', () => {
    const el = mount();
    new LineChart(el, { ...quiet, data: [] });
    expect(el.querySelector('svg')).not.toBeNull();
    expect(markup(el)).not.toMatch(/NaN|Infinity/);
  });

  it('centres a single numeric point', () => {
    const el = mount();
    new LineChart(el, { ...quiet, data: [{ x: 5, y: 10 }] });
    const [cx] = numbers(el, '.cyber-chart__point', 'cx');
    expect(cx).toBeCloseTo((400 - 50 - 20) / 2, 0);
    expect(markup(el)).not.toMatch(/NaN|Infinity/);
  });

  it('handles all-equal and all-zero values', () => {
    for (const value of [0, 7, -3]) {
      const el = mount();
      new LineChart(el, { ...quiet, data: months([value, value, value]) });
      expect(markup(el)).not.toMatch(/NaN|Infinity/);
    }
  });

  it('fills the area down to zero, not the bottom edge, when values are negative', () => {
    const el = mount();
    new LineChart(el, { ...quiet, data: months([-10, 10, -10]), showArea: true });
    const area = el.querySelector('.cyber-chart__area-fill')!.getAttribute('d')!;
    // plot height 240, domain [-10, 10]: zero sits at y = 120
    expect(area).toMatch(/L [\d.]+ 120 L [\d.]+ 120 Z$/);
  });

  it('plots Date x values on a time scale with readable labels', () => {
    const el = mount();
    const data = [0, 1, 2, 3].map((i) => ({ x: new Date(Date.UTC(2024, 0, 1 + i)), y: i }));
    new LineChart(el, { ...quiet, data, locale: 'en-US' });
    expect(markup(el)).not.toMatch(/NaN|GMT/);
    const xs = numbers(el, '.cyber-chart__point', 'cx');
    expect(xs[0]).toBeLessThan(xs[3]);
  });

  it('gives multiple series distinct default colours', () => {
    const el = mount();
    const series: DataSeries[] = ['a', 'b', 'c'].map((id) => ({
      id,
      name: id,
      data: months([1, 2, 3]),
    }));
    new LineChart(el, { ...quiet, data: series });
    const strokes = Array.from(el.querySelectorAll('.cyber-chart__line')).map(
      (path) => (path as SVGElement).style.getPropertyValue('stroke') || path.getAttribute('stroke')
    );
    expect(new Set(strokes).size).toBe(3);
  });

  it('maps reduced points back to their own data (10k points)', () => {
    const el = mount();
    const data = Array.from({ length: 10_000 }, (_, i) => ({ x: i, y: Math.sin(i / 300) * 100 }));
    const started = performance.now();
    const chart = new LineChart(el, { ...quiet, data, maxPoints: 1000 });
    const elapsed = performance.now() - started;

    const circles = el.querySelectorAll('.cyber-chart__point');
    expect(circles.length).toBeLessThanOrEqual(1000);
    expect(el.querySelectorAll('*').length).toBeLessThan(5000);
    expect(elapsed).toBeLessThan(2000);

    const clicked: DataPoint[] = [];
    chart.on<{ point: DataPoint }>('pointClick', (event) => clicked.push(event.data.point));
    const last = circles[circles.length - 1];
    last.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clicked[0]).toBe(data[data.length - 1]);
  });

  it('keeps stagger delays bounded for many points', () => {
    const el = mount();
    const data = Array.from({ length: 500 }, (_, i) => ({ x: i, y: i }));
    new LineChart(el, { data, animate: true, animation: { duration: 800, stagger: 50 } });
    const delays = Array.from(el.querySelectorAll<SVGElement>('.cyber-chart__point')).map((c) =>
      parseFloat(c.style.transitionDelay)
    );
    expect(Math.max(...delays)).toBeLessThanOrEqual(800);
  });

  it('formats tick labels with the configured locale', () => {
    const el = mount();
    new LineChart(el, { ...quiet, data: months([1000, 5000]), locale: 'de-DE' });
    expect(yTickLabels(el)).toContain('5.000');
  });

  it('truncates long category labels and keeps the full text in a <title>', () => {
    const el = mount();
    const long = 'An extraordinarily long category label that cannot fit';
    new LineChart(el, {
      ...quiet,
      data: [
        { x: long, y: 1 },
        { x: `${long} 2`, y: 2 },
      ],
    });
    const label = el.querySelector('.cyber-chart__x-axis .cyber-chart__tick-label')!;
    const shown = label.lastChild!.textContent!;
    expect(shown.length).toBeLessThan(long.length);
    expect(shown).toMatch(/…$/);
    expect(label.querySelector('title')?.textContent).toBe(long);
  });
});

describe('BarChart', () => {
  function valueTicks(el: Element): string[] {
    return texts(el, '.cyber-chart__value-axis .cyber-chart__tick-label');
  }

  it('derives value ticks from the data', () => {
    const el = mount();
    new BarChart(el, { ...quiet, data: months([120, 480]) });
    expect(valueTicks(el)).toContain('500');
  });

  it('keeps bars inside the plot area', () => {
    const el = mount();
    new BarChart(el, { ...quiet, data: months([5, 10, 15, 20]) });
    for (const x of numbers(el, '.cyber-chart__bar', 'x')) {
      expect(x).toBeGreaterThanOrEqual(0);
    }
    for (const [i, x] of numbers(el, '.cyber-chart__bar', 'x').entries()) {
      const w = numbers(el, '.cyber-chart__bar', 'width')[i];
      expect(x + w).toBeLessThanOrEqual(330);
    }
  });

  it('draws all-negative bars downward from zero', () => {
    const el = mount();
    new BarChart(el, { ...quiet, data: months([-5, -20, -10]) });
    const ys = numbers(el, '.cyber-chart__bar', 'y');
    const heights = numbers(el, '.cyber-chart__bar', 'height');
    expect(markup(el)).not.toMatch(/NaN|Infinity/);
    ys.forEach((y, i) => {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y + heights[i]).toBeLessThanOrEqual(240.0001);
    });
    expect(Math.min(...ys)).toBeCloseTo(0, 5);
  });

  it('scales stacked bars to the stacked total', () => {
    const el = mount();
    const series: DataSeries[] = [
      { id: 'a', name: 'A', data: months([60, 60]) },
      { id: 'b', name: 'B', data: months([60, 60]) },
    ];
    new BarChart(el, { ...quiet, data: series, groupMode: 'stacked' });
    for (const y of numbers(el, '.cyber-chart__bar', 'y')) {
      expect(y).toBeGreaterThanOrEqual(0);
    }
  });

  it('stacks negative values below zero separately from positive ones', () => {
    const el = mount();
    const series: DataSeries[] = [
      { id: 'a', name: 'A', data: [{ x: 'q', y: 10 }] },
      { id: 'b', name: 'B', data: [{ x: 'q', y: -10 }] },
    ];
    new BarChart(el, { ...quiet, data: series, groupMode: 'stacked' });
    const [posY, negY] = numbers(el, '.cyber-chart__bar', 'y');
    const [posH] = numbers(el, '.cyber-chart__bar', 'height');
    expect(posY + posH).toBeCloseTo(negY, 5);
  });

  it('skips non-finite values', () => {
    const el = mount();
    new BarChart(el, { ...quiet, data: months([1, NaN, Infinity, 4]) });
    expect(markup(el)).not.toMatch(/NaN|Infinity/);
    expect(el.querySelectorAll('.cyber-chart__bar')).toHaveLength(2);
  });

  it('applies new dimensions passed to setOptions', () => {
    const el = mount();
    const chart = new BarChart(el, { ...quiet, data: months([1, 2]) });
    chart.setOptions({ width: 640, height: 200 });
    const svg = el.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('640');
    expect(svg.getAttribute('viewBox')).toBe('0 0 640 200');
  });
});

describe('DonutChart', () => {
  function firstArc(d: string): { start: number[]; end: number[] } {
    const nums = d.match(/-?[\d.]+(e-?\d+)?/g)!.map(Number);
    return { start: nums.slice(0, 2), end: nums.slice(7, 9) };
  }

  it('draws a single 100% segment as a visible ring', () => {
    const el = mount();
    new DonutChart(el, { ...quiet, data: [{ label: 'all', value: 3 }], segmentGap: 0 });
    const d = el.querySelector('.cyber-chart__segment')!.getAttribute('d')!;
    const { start, end } = firstArc(d);
    expect(Math.hypot(start[0] - end[0], start[1] - end[1])).toBeGreaterThan(1);
  });

  it('never produces negative sweeps for tiny or zero segments', () => {
    const el = mount();
    new DonutChart(el, {
      ...quiet,
      segmentGap: 4,
      data: [
        { label: 'big', value: 1000 },
        { label: 'tiny', value: 1 },
        { label: 'zero', value: 0 },
      ],
    });
    expect(markup(el)).not.toMatch(/NaN|Infinity/);
    // the tiny segment stays visible (its gap shrinks), the zero one is not drawn
    expect(el.querySelectorAll('.cyber-chart__segment')).toHaveLength(2);
  });

  it('anchors labels on the left half to the end', () => {
    const el = mount(500, 300);
    new DonutChart(el, {
      ...quiet,
      legend: { show: false },
      data: [
        { label: 'right', value: 1 },
        { label: 'left', value: 1 },
      ],
      startAngle: 0,
    });
    const labels = Array.from(el.querySelectorAll('.cyber-chart__label'));
    const left = labels.find((l) => l.textContent.startsWith('left'))!;
    const right = labels.find((l) => l.textContent.startsWith('right'))!;
    expect(left.getAttribute('text-anchor')).toBe('end');
    expect(right.getAttribute('text-anchor')).toBe('start');
  });

  it('renders an all-zero dataset without NaN', () => {
    const el = mount();
    new DonutChart(el, { ...quiet, data: [{ label: 'a', value: 0 }] });
    expect(markup(el)).not.toMatch(/NaN|Infinity/);
  });

  it('shrinks the ring so outside labels fit instead of cutting them', () => {
    const el = mount(300, 300);
    new DonutChart(el, {
      ...quiet,
      width: 300,
      height: 300,
      legend: { show: false },
      data: [
        { label: 'HTTPS', value: 54 },
        { label: 'WebSocket', value: 21 },
        { label: 'gRPC', value: 14 },
        { label: 'SSH', value: 7 },
        { label: 'Other', value: 4 },
      ],
    });
    const labels = Array.from(el.querySelectorAll('.cyber-chart__label'));
    expect(labels).toHaveLength(5);
    for (const label of labels) {
      expect(label.textContent).not.toContain('…');
    }
  });

  it('keeps the ring at least half its size when labels cannot fit', () => {
    const el = mount(160, 160);
    const long = 'A label far too long for any narrow chart';
    new DonutChart(el, {
      ...quiet,
      width: 160,
      height: 160,
      legend: { show: false },
      data: [
        { label: long, value: 1 },
        { label: long, value: 1 },
      ],
      startAngle: 0,
    });
    // ring without labels: 80 - padding 20 - label space 30 = 30
    const d = el.querySelector('.cyber-chart__segment')!.getAttribute('d')!;
    expect(d).toMatch(/A 15 15 /);
    expect(el.querySelector('.cyber-chart__label')!.textContent).toContain('…');
  });

  it('survives a container too small for its padding', () => {
    const el = mount(40, 40);
    new DonutChart(el, { ...quiet, width: 40, height: 40, data: [{ label: 'a', value: 1 }] });
    expect(markup(el)).not.toMatch(/NaN|Infinity|A -/);
  });
});

describe('GaugeChart', () => {
  it('treats a non-finite value as the minimum', () => {
    const el = mount();
    const chart = new GaugeChart(el, { ...quiet, value: NaN });
    expect(markup(el)).not.toMatch(/NaN|Infinity/);
    chart.update(Infinity);
    expect(markup(el)).not.toMatch(/NaN|Infinity/);
  });

  function textBox(el: Element, selector: string): { top: number; bottom: number } {
    const text = el.querySelector(selector)!;
    const y = Number(text.getAttribute('y'));
    const size = Number(text.getAttribute('font-size'));
    return { top: y - size / 2, bottom: y + size / 2 };
  }

  it('keeps the label clear of the value at small sizes', () => {
    for (const [width, height] of [
      [120, 90],
      [160, 110],
      [300, 300],
    ]) {
      const el = mount(width, height);
      new GaugeChart(el, { ...quiet, width, height, value: 72, label: 'Memory' });
      const value = textBox(el, '.cyber-chart__value-text');
      const label = textBox(el, '.cyber-chart__label');
      expect(label.top).toBeGreaterThan(value.bottom);
    }
  });

  it('keeps full-size text on a large gauge and drops min/max labels on a small one', () => {
    const large = mount();
    new GaugeChart(large, { ...quiet, value: 72, label: 'Memory' });
    expect(large.querySelector('.cyber-chart__value-text')!.getAttribute('font-size')).toBe('36');
    expect(textBox(large, '.cyber-chart__label').top).toBe(150 + 30 - 7);
    expect(large.querySelector('.cyber-chart__min-label')).not.toBeNull();

    const small = mount(160, 110);
    new GaugeChart(small, { ...quiet, width: 160, height: 110, value: 72 });
    expect(small.querySelector('.cyber-chart__min-label')).toBeNull();
    expect(small.querySelector('.cyber-chart__max-label')).toBeNull();
  });

  it('keeps every tick label inside the SVG at every size', () => {
    for (const [width, height] of [
      [120, 90],
      [160, 110],
      [300, 150],
      [300, 300],
      [600, 200],
    ]) {
      const el = mount(width, height);
      new GaugeChart(el, { ...quiet, width, height, value: 72 });
      const labels = Array.from(el.querySelectorAll('.cyber-chart__tick-label'));
      expect(labels).toHaveLength(3);
      for (const label of labels) {
        const x = Number(label.getAttribute('x'));
        const y = Number(label.getAttribute('y'));
        const size = Number(label.getAttribute('font-size'));
        expect(y - size).toBeGreaterThanOrEqual(0);
        expect(y + size / 2).toBeLessThanOrEqual(height);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(width);
      }
    }
  });

  it('does not duplicate <defs> on setOptions', () => {
    const el = mount();
    const chart = new GaugeChart(el, { ...quiet, value: 10 });
    chart.setOptions({ theme: 'magenta' });
    chart.setOptions({ theme: 'green' });
    expect(el.querySelectorAll('defs')).toHaveLength(1);
  });
});

describe('Sparkline', () => {
  it('skips non-finite values', () => {
    const el = mount();
    new Sparkline(el, { ...quiet, data: [1, NaN, 3, Infinity, 2], showMinMax: true });
    expect(markup(el)).not.toMatch(/NaN|Infinity/);
  });

  it('computes stats on huge datasets without overflowing the stack', () => {
    const el = mount();
    const data = Array.from({ length: 300_000 }, (_, i) => i % 1000);
    const spark = new Sparkline(el, { ...quiet, data });
    expect(spark.getStats()).toMatchObject({ min: 0, max: 999 });
  });
});

describe('simplifyPath', () => {
  it('does not overflow the stack on long monotonic curves', () => {
    const points = Array.from({ length: 50_000 }, (_, i) => ({ x: i, y: Math.exp(i / 2000) }));
    expect(() => simplifyPath(points, 0.0001)).not.toThrow();
  });
});

describe('lifecycle', () => {
  it('creates no tooltip nodes until a point is hovered', () => {
    const before = document.body.children.length;
    new LineChart(mount(), { ...quiet, data: months([1, 2]) });
    new BarChart(mount(), { ...quiet, data: months([1, 2]) });
    new DonutChart(mount(), { ...quiet, data: [{ label: 'a', value: 1 }] });
    expect(document.body.children.length).toBe(before + 3);
  });

  it('removes its tooltip and disconnects its observer on destroy', () => {
    const disconnect = vi.fn();
    const observe = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe;
        disconnect = disconnect;
        unobserve = vi.fn();
      }
    );
    const el = mount();
    const chart = new LineChart(el, { ...quiet, data: months([1, 2]), responsive: true });
    el.querySelector('.cyber-chart__point')!.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true })
    );
    expect(document.body.lastElementChild!.getAttribute('role')).toBe('tooltip');

    chart.destroy();
    expect(observe).toHaveBeenCalledWith(el);
    expect(disconnect).toHaveBeenCalled();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    expect(el.childNodes).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('cancels queued animation frames on destroy', () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    let next = 1;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      callbacks.set(next, cb);
      return next++;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id));

    const chart = new LineChart(mount(), { data: months([1, 2, 3]), animate: true });
    expect(callbacks.size).toBeGreaterThan(0);
    chart.destroy();
    expect(callbacks.size).toBe(0);

    const gauge = new GaugeChart(mount(), { value: 50, animate: true });
    gauge.destroy();
    expect(callbacks.size).toBe(0);
    vi.unstubAllGlobals();
  });

  it('tolerates update, resize and destroy after destroy', () => {
    const line = new LineChart(mount(), { ...quiet, data: months([1]) });
    const charts = [
      line,
      new BarChart(mount(), { ...quiet, data: months([1]) }),
      new DonutChart(mount(), { ...quiet, data: [{ label: 'a', value: 1 }] }),
    ];
    for (const chart of charts) {
      chart.destroy();
      expect(() => chart.destroy()).not.toThrow();
      expect(() => chart.resize(100, 100)).not.toThrow();
    }
    expect(() => line.update(months([2]))).not.toThrow();
    expect(() => line.setOptions({ responsive: true })).not.toThrow();
    expect(document.body.querySelectorAll('svg')).toHaveLength(0);
  });

  it('does not re-render when the observed size is unchanged', async () => {
    let fire: (w: number, h: number) => void = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: ResizeObserverCallback) {
          fire = (width, height) =>
            cb([{ contentRect: { width, height } } as ResizeObserverEntry], this);
        }
        observe() {}
        disconnect() {}
        unobserve() {}
      }
    );
    const el = mount();
    const chart = new LineChart(el, { ...quiet, data: months([1, 2]), responsive: true });
    const onResize = vi.fn();
    chart.on('resize', onResize);
    fire(400, 300);
    expect(onResize).not.toHaveBeenCalled();
    fire(500, 300);
    // resizes are throttled to one per animation frame
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(onResize).toHaveBeenCalledTimes(1);
    expect(el.querySelector('svg')!.getAttribute('width')).toBe('500');
    vi.unstubAllGlobals();
  });

  it('does not replay entry animations on resize', () => {
    const el = mount();
    const chart = new LineChart(el, { data: months([1, 2]), animate: true });
    chart.resize(500, 300);
    const point = el.querySelector<SVGElement>('.cyber-chart__point')!;
    expect(point.style.opacity).toBe('');
  });
});

describe('XSS', () => {
  const payload = '<img src=x onerror="window.__pwned=1">';

  it('renders hostile labels as text everywhere', () => {
    const el = mount();
    const chart = new LineChart(el, {
      ...quiet,
      data: [
        { id: 's1', name: payload, data: [{ x: payload, y: 1 }] },
        { id: 's2', name: 'B', data: [{ x: payload, y: 2 }] },
      ] as DataSeries[],
    });
    el.querySelector('.cyber-chart__point')!.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true })
    );
    expect(document.querySelector('img')).toBeNull();
    const tooltip = document.querySelector('[role="tooltip"]')!;
    expect(tooltip.textContent).toContain(payload);
    expect(tooltip.textContent).not.toContain('&lt;');
    chart.destroy();
  });

  it('does not let a series colour inject CSS into the tooltip', () => {
    const el = mount();
    new BarChart(el, {
      ...quiet,
      data: [
        {
          id: 's',
          name: 'S',
          color: 'red; background-image: url(https://evil.example/x)',
          data: [{ x: 'a', y: 1 }],
        },
      ],
    });
    el.querySelector('.cyber-chart__bar')!.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true })
    );
    expect(document.querySelector('[role="tooltip"]')!.outerHTML).not.toContain('evil');
  });
});

describe('RTL', () => {
  it('keeps chart geometry left-to-right inside RTL documents', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const el = mount();
    new BarChart(el, { ...quiet, data: months([1, 2]) });
    expect(el.querySelector('svg')!.getAttribute('direction')).toBe('ltr');
    document.documentElement.removeAttribute('dir');
  });
});
