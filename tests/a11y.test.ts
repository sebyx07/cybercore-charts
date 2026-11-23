// @vitest-environment happy-dom
/**
 * Accessibility: accessible names, descriptions, data table fallback,
 * keyboard navigation, reduced motion and high contrast.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BarChart } from '../src/charts/BarChart';
import { DonutChart } from '../src/charts/DonutChart';
import { GaugeChart } from '../src/charts/GaugeChart';
import { LineChart } from '../src/charts/LineChart';
import { Sparkline } from '../src/charts/Sparkline';

import { mount, press, resetDocument } from './helpers/dom';

import type { DataPoint, DataSeries } from '../src/types';

const quiet = { animate: false } as const;
const data: DataPoint[] = [
  { x: 'Jan', y: 10 },
  { x: 'Feb', y: 25 },
  { x: 'Mar', y: 15 },
];

beforeEach(() => {
  resetDocument();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stubMatchMedia(matching: string[]): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matching.includes(query),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('accessible name and description', () => {
  it('labels the SVG with <title> and <desc>', () => {
    const el = mount();
    new LineChart(el, {
      ...quiet,
      data,
      ariaLabel: 'Monthly revenue',
      description: 'Revenue peaked in February.',
    });
    const svg = el.querySelector('svg')!;
    const [titleId, descId] = [
      svg.getAttribute('aria-labelledby'),
      svg.getAttribute('aria-describedby'),
    ];
    expect(svg.querySelector(`[id="${titleId}"]`)!.tagName.toLowerCase()).toBe('title');
    expect(svg.querySelector(`[id="${titleId}"]`)!.textContent).toBe('Monthly revenue');
    expect(svg.querySelector(`[id="${descId}"]`)!.textContent).toBe('Revenue peaked in February.');
  });

  it('writes a summary description when none is given', () => {
    const el = mount();
    new LineChart(el, { ...quiet, data, locale: 'en-US' });
    const desc = el.querySelector('svg desc')!.textContent;
    expect(desc).toContain('3 points');
    expect(desc).toContain('10');
    expect(desc).toContain('25');
  });

  it('describes a gauge by its value and keeps it current', () => {
    const el = mount();
    const gauge = new GaugeChart(el, { ...quiet, value: 42, label: 'CPU', locale: 'en-US' });
    const svg = el.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('meter');
    expect(svg.getAttribute('aria-valuenow')).toBe('42');
    expect(svg.getAttribute('aria-valuemin')).toBe('0');
    expect(svg.getAttribute('aria-valuemax')).toBe('100');
    expect(svg.getAttribute('aria-valuetext')).toBe('42');
    gauge.update(77);
    expect(svg.getAttribute('aria-valuenow')).toBe('77');
  });

  it('describes a sparkline trend', () => {
    const el = mount();
    new Sparkline(el, { ...quiet, data: [3, 1, 9], ariaLabel: 'Load', locale: 'en-US' });
    const svg = el.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.querySelector('title')!.textContent).toBe('Load');
    expect(svg.querySelector('desc')!.textContent).toMatch(/up.*3.*9/);
  });
});

describe('data table fallback', () => {
  it('renders a visually hidden table of the data', () => {
    const el = mount();
    const series: DataSeries[] = [
      { id: 'a', name: 'Alpha', data },
      { id: 'b', name: 'Beta', data: data.map((p) => ({ ...p, y: p.y * 2 })) },
    ];
    new BarChart(el, { ...quiet, data: series, ariaLabel: 'Sales', locale: 'en-US' });
    const table = el.querySelector('table')!;
    expect(table.querySelector('caption')!.textContent).toBe('Sales');
    expect(
      Array.from(table.querySelectorAll('th[scope="col"]')).map((th) => th.textContent)
    ).toEqual(['Label', 'Alpha', 'Beta']);
    expect(table.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(table.querySelector('tbody tr')!.textContent).toContain('Jan');
    expect(table.style.position).toBe('absolute');
  });

  it('names every column header, after the category axis when it has a label', () => {
    const headers = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('th[scope="col"]')).map((th) => th.textContent);
    const line = mount();
    new LineChart(line, { ...quiet, data, xAxis: { label: 'Month' } });
    expect(headers(line)).toEqual(['Month', 'Series 1']);
    const bar = mount();
    new BarChart(bar, { ...quiet, data, orientation: 'horizontal', yAxis: { label: 'Month' } });
    expect(headers(bar)[0]).toBe('Month');
    const donut = mount();
    new DonutChart(donut, { ...quiet, data: [{ label: 'A', value: 1 }] });
    expect(headers(donut)).toEqual(['Label', 'Value', 'Share']);
    for (const th of document.querySelectorAll('th')) {
      expect(th.textContent).not.toBe('');
    }
  });

  it('keeps the table in sync with updates and can be turned off', () => {
    const el = mount();
    const chart = new DonutChart(el, {
      ...quiet,
      data: [
        { label: 'A', value: 1 },
        { label: 'B', value: 3 },
      ],
    });
    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
    chart.update([{ label: 'C', value: 1 }]);
    expect(el.querySelectorAll('tbody tr')).toHaveLength(1);
    chart.setOptions({ dataTable: false });
    expect(el.querySelector('table')).toBeNull();
  });
});

describe('keyboard navigation', () => {
  it('exposes one tab stop and moves between points with arrow keys', () => {
    const el = mount();
    const chart = new LineChart(el, { ...quiet, data });
    const hovered: unknown[] = [];
    const clicked: unknown[] = [];
    chart.on<{ point: DataPoint }>('pointHover', (e) => hovered.push(e.data.point));
    chart.on<{ point: DataPoint }>('pointClick', (e) => clicked.push(e.data.point));

    const points = Array.from(el.querySelectorAll<SVGElement>('.cyber-chart__point'));
    expect(points.map((p) => p.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    expect(points[1].getAttribute('aria-label')).toContain('Feb');

    points[0].focus();
    expect(hovered).toEqual([data[0]]);
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();

    press(points[0], 'ArrowRight');
    expect(document.activeElement).toBe(points[1]);
    expect(points[1].getAttribute('tabindex')).toBe('0');
    expect(points[0].getAttribute('tabindex')).toBe('-1');

    press(points[1], 'End');
    expect(document.activeElement).toBe(points[2]);
    press(points[2], 'Enter');
    expect(clicked).toEqual([data[2]]);

    press(points[2], 'Escape');
    expect((document.querySelector('[role="tooltip"]') as HTMLElement).style.opacity).toBe('0');
  });

  it('makes the chart a labelled group when it has focusable marks', () => {
    const el = mount();
    new BarChart(el, { ...quiet, data });
    expect(el.querySelector('svg')!.getAttribute('role')).toBe('group');
    expect(el.querySelector('.cyber-chart__bar')!.getAttribute('role')).toBe('img');
  });

  it('can turn keyboard interaction off', () => {
    const el = mount();
    new DonutChart(el, { ...quiet, data: [{ label: 'A', value: 1 }], keyboard: false });
    expect(el.querySelector('[tabindex="0"]')).toBeNull();
    expect(el.querySelector('svg')!.getAttribute('role')).toBe('img');
  });
});

describe('reduced motion', () => {
  it('skips animations when the OS asks for reduced motion', () => {
    stubMatchMedia(['(prefers-reduced-motion: reduce)']);
    const el = mount();
    new LineChart(el, { data, animate: true });
    const line = el.querySelector<SVGElement>('.cyber-chart__line')!;
    expect(line.style.strokeDasharray).toBe('');
    expect(el.querySelector<SVGElement>('.cyber-chart__point')!.style.opacity).toBe('');
  });

  it('skips animations inside [data-motion="reduce"]', () => {
    stubMatchMedia([]);
    document.documentElement.setAttribute('data-motion', 'reduce');
    const el = mount();
    new BarChart(el, { data, animate: true });
    expect(el.querySelector<SVGElement>('.cyber-chart__bar')!.style.transition).toBe('');
  });
});

describe('high contrast', () => {
  it('drops glow filters inside [data-contrast="high"]', () => {
    stubMatchMedia([]);
    document.documentElement.setAttribute('data-contrast', 'high');
    const el = mount();
    new LineChart(el, { ...quiet, data, glow: true });
    expect(el.querySelector('[filter]')).toBeNull();
  });

  it('drops glow filters when the OS prefers more contrast', () => {
    stubMatchMedia(['(prefers-contrast: more)']);
    const el = mount();
    new GaugeChart(el, { ...quiet, value: 10, glow: true });
    expect(el.querySelector('[filter]')).toBeNull();
  });
});
