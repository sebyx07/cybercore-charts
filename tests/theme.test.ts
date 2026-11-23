// @vitest-environment happy-dom
/**
 * Theming: colours come from cybercore-css custom properties when present,
 * with the built-in neon palette as fallback.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BarChart } from '../src/charts/BarChart';
import { LineChart } from '../src/charts/LineChart';
import { SERIES_PALETTE, seriesColor, themeColor, uiColors } from '../src/utils/theme';

import { mount, resetDocument } from './helpers/dom';

import type { DataSeries } from '../src/types';

const quiet = { animate: false } as const;
const data = [
  { x: 'a', y: 1 },
  { x: 'b', y: 2 },
];

beforeEach(() => {
  resetDocument();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function paint(el: Element, prop: 'fill' | 'stroke'): string {
  return (el as SVGElement).style.getPropertyValue(prop) || el.getAttribute(prop) || '';
}

describe('themeColor', () => {
  it('follows the cybercore-css accent by default', () => {
    expect(themeColor('accent')).toBe('var(--color-accent, #00f0ff)');
    expect(themeColor('accent', 'light')).toBe('var(--color-accent-light, #4dffff)');
  });

  it('maps named hues to palette tokens with fallbacks', () => {
    expect(themeColor('magenta')).toBe('var(--cyber-magenta-500, #ff00aa)');
    expect(themeColor('green', 'dark')).toBe('var(--cyber-green-700, #00a858)');
  });
});

describe('seriesColor', () => {
  it('walks a fixed colour-blind-checked order', () => {
    expect(SERIES_PALETTE.map((entry) => entry.token)).toEqual([
      '--cyber-cyan-500',
      '--cyber-magenta-500',
      '--cyber-yellow-500',
      '--cyber-violet-500',
      '--cyber-green-500',
      '--cyber-amber-500',
    ]);
    expect(seriesColor(1)).toBe('var(--cyber-magenta-500, #ff00aa)');
  });

  it('starts at the chosen hue', () => {
    expect(seriesColor(0, 'yellow')).toBe('var(--cyber-yellow-500, #f0ff00)');
    expect(seriesColor(1, 'yellow')).toBe('var(--cyber-violet-500, #a35cff)');
  });

  it('repeats rather than inventing hues past the palette', () => {
    expect(seriesColor(SERIES_PALETTE.length)).toBe(seriesColor(0));
  });
});

describe('chart colours', () => {
  it('paints a single series with the accent token so [data-theme] retints it', () => {
    const el = mount();
    new LineChart(el, { ...quiet, data });
    expect(paint(el.querySelector('.cyber-chart__line')!, 'stroke')).toBe(
      'var(--color-accent, #00f0ff)'
    );
  });

  it('uses the explicit theme hue when one is given', () => {
    const el = mount();
    new LineChart(el, { ...quiet, data, theme: 'magenta' });
    expect(paint(el.querySelector('.cyber-chart__line')!, 'stroke')).toContain(
      '--cyber-magenta-500'
    );
  });

  it('honours per-series colours', () => {
    const el = mount();
    const series: DataSeries[] = [
      { id: 'a', name: 'A', data, color: '#123456' },
      { id: 'b', name: 'B', data, theme: 'green' },
    ];
    new LineChart(el, { ...quiet, data: series });
    const [a, b] = Array.from(el.querySelectorAll('.cyber-chart__line'));
    expect(paint(a, 'stroke')).toBe('#123456');
    expect(paint(b, 'stroke')).toContain('--cyber-green-500');
  });

  it('draws text, grid and axes with semantic tokens', () => {
    const el = mount();
    new BarChart(el, { ...quiet, data });
    expect(paint(el.querySelector('.cyber-chart__tick-label')!, 'fill')).toBe(uiColors.text);
    expect(uiColors.text).toMatch(/^var\(--color-text-secondary, #/);
    expect(uiColors.grid).toMatch(/^var\(--color-border-default, /);
  });

  it('switches hue on setOptions({ theme })', () => {
    const el = mount();
    const chart = new BarChart(el, { ...quiet, data });
    chart.setOptions({ theme: 'yellow' });
    const stop = el.querySelector('stop')!;
    expect(paint(stop, 'stop-color' as 'fill')).toContain('--cyber-yellow');
  });
});
