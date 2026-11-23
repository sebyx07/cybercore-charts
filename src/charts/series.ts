/**
 * CyberCore Charts - Series Helpers
 * Data normalisation, colours, table and summary shared by the
 * cartesian (line and bar) charts.
 */

import { formatDate, formatNumber } from '../utils/format';
import { seriesColor, themeColor } from '../utils/theme';

import type { ChartTheme, DataPoint, DataSeries } from '../types';
import type { ChartDataTable } from '../utils/a11y';

/** Options keys that have no default value */
export type UndefaultedOptionKeys = 'ariaLabel' | 'description' | 'locale';

/**
 * Accepts a flat point array or a series array and returns series.
 */
export function normalizeSeries(data: DataPoint[] | DataSeries[] | undefined): DataSeries[] {
  if (!data || data.length === 0) {
    return [];
  }
  const first = data[0] as Partial<DataSeries> | null;
  if (first && Array.isArray(first.data)) {
    return data as DataSeries[];
  }
  return [{ id: 'series-0', name: 'Series 1', data: data as DataPoint[] }];
}

/**
 * Colour of a series: its own colour or theme first; otherwise the chart
 * theme for a lone series, or the categorical palette by position.
 */
export function seriesPaint(
  series: DataSeries,
  index: number,
  count: number,
  chartTheme: ChartTheme
): string {
  if (series.color) {
    return series.color;
  }
  if (series.theme) {
    return themeColor(series.theme);
  }
  return count === 1 ? themeColor(chartTheme) : seriesColor(index, chartTheme);
}

/** Whether a value is neither null nor undefined */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/** Whether a point has a plottable y value */
export function hasValue(point: DataPoint | null | undefined): point is DataPoint {
  return isPresent(point) && typeof point.y === 'number' && Number.isFinite(point.y);
}

/** Stable key of an x value (Dates by time) */
export function xKey(x: DataPoint['x']): string {
  return x instanceof Date ? `t${x.getTime()}` : `${typeof x}:${String(x)}`;
}

/** Display text of an x value */
export function formatX(x: DataPoint['x'], locale?: string): string {
  return x instanceof Date ? formatDate(x, locale) : String(x);
}

/** Label of a point: its own label or its x value */
export function pointLabel(point: DataPoint, locale?: string): string {
  return point.label || formatX(point.x, locale);
}

/**
 * One row per distinct x value, one column per series. The row-header column is
 * named after the x axis, or "Label": an empty header cell is unnamed for screen readers.
 */
export function seriesTable(
  series: DataSeries[],
  caption: string,
  locale?: string,
  xLabel?: string
): ChartDataTable {
  const rows = new Map<string, string[]>();
  series.forEach((s, column) => {
    for (const point of s.data) {
      if (!isPresent(point)) {
        continue;
      }
      const key = xKey(point.x);
      let row = rows.get(key);
      if (!row) {
        row = [pointLabel(point, locale), ...series.map(() => '')];
        rows.set(key, row);
      }
      row[column + 1] = hasValue(point) ? formatNumber(point.y, locale) : '';
    }
  });
  return {
    caption,
    headers: [xLabel || 'Label', ...series.map((s) => s.name)],
    rows: [...rows.values()],
  };
}

/**
 * Plain-language summary: point count and each series' range.
 */
export function seriesSummary(series: DataSeries[], locale?: string): string {
  const parts: string[] = [];
  let total = 0;
  for (const s of series) {
    let min = Infinity;
    let max = -Infinity;
    for (const point of s.data) {
      if (hasValue(point)) {
        total++;
        min = Math.min(min, point.y);
        max = Math.max(max, point.y);
      }
    }
    if (min <= max && parts.length < 5) {
      parts.push(`${s.name}: min ${formatNumber(min, locale)}, max ${formatNumber(max, locale)}.`);
    }
  }
  const head = `${series.length} series, ${total} points.`;
  return [head, ...parts].join(' ');
}
