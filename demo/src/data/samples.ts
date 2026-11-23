import type { DataPoint, DataSeries, DonutSegment, GaugeThreshold } from '@cybercore-charts/types';

/**
 * Synthetic data for the previews. Everything is generated from a seeded
 * random source, so a page looks the same on every load until its live feed
 * (if it has one) starts ticking.
 */

/**
 * One step of a small deterministic random source (mulberry32): takes the
 * generator state, returns a value in [0, 1) and the next state. Pure, so it
 * can run inside a React state updater.
 */
export function randomStep(state: number): [value: number, next: number] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let mixed = next;
  mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
  return [((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296, next];
}

/** The same source as a stateful function, for building fixed sample data. */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    const [value, next] = randomStep(state);
    state = next;
    return value;
  };
}

/** A wandering series: each value drifts from the one before it. */
export function walk(
  random: () => number,
  count: number,
  { start = 50, step = 12, min = 5, max = 95 } = {}
): number[] {
  const values: number[] = [];
  let value = start;
  for (let index = 0; index < count; index += 1) {
    value = nextValue(random, value, { step, min, max });
    values.push(value);
  }
  return values;
}

/** The next value of a wandering series, kept inside [min, max]. */
function nextValue(
  random: () => number,
  previous: number,
  { step = 12, min = 5, max = 95 } = {}
): number {
  const next = previous + (random() - 0.5) * 2 * step;
  return Math.round(Math.min(max, Math.max(min, next)));
}

const HOURS = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];

function points(labels: string[], values: number[]): DataPoint[] {
  return labels.map((label, index) => ({ x: label, y: values[index] ?? 0 }));
}

export const LINE_SINGLE: DataPoint[] = points(HOURS, [22, 18, 31, 54, 71, 64, 82, 47]);

export const LINE_SERIES: DataSeries[] = [
  { id: 'inbound', name: 'Inbound', data: points(HOURS, [22, 18, 31, 54, 71, 64, 82, 47]) },
  { id: 'outbound', name: 'Outbound', data: points(HOURS, [14, 12, 19, 33, 48, 52, 44, 30]) },
];

export const BAR_SINGLE: DataPoint[] = [
  { x: 'Tokyo', y: 84 },
  { x: 'Lagos', y: 61 },
  { x: 'Berlin', y: 47 },
  { x: 'Lima', y: 38 },
  { x: 'Oslo', y: 22 },
];

export const BAR_SERIES: DataSeries[] = [
  {
    id: 'blocked',
    name: 'Blocked',
    data: [
      { x: 'Q1', y: 42 },
      { x: 'Q2', y: 58 },
      { x: 'Q3', y: 35 },
      { x: 'Q4', y: 66 },
    ],
  },
  {
    id: 'flagged',
    name: 'Flagged',
    data: [
      { x: 'Q1', y: 18 },
      { x: 'Q2', y: 24 },
      { x: 'Q3', y: 29 },
      { x: 'Q4', y: 21 },
    ],
  },
  {
    id: 'cleared',
    name: 'Cleared',
    data: [
      { x: 'Q1', y: 30 },
      { x: 'Q2', y: 22 },
      { x: 'Q3', y: 41 },
      { x: 'Q4', y: 37 },
    ],
  },
];

export const DONUT_PROTOCOLS: DonutSegment[] = [
  { label: 'HTTPS', value: 54 },
  { label: 'WebSocket', value: 21 },
  { label: 'gRPC', value: 14 },
  { label: 'SSH', value: 7 },
  { label: 'Other', value: 4 },
];

export const DONUT_STORAGE: DonutSegment[] = [
  { label: 'Used', value: 68 },
  { label: 'Reserved', value: 12 },
  { label: 'Free', value: 20 },
];

export const GAUGE_ZONES: GaugeThreshold[] = [
  { value: 60, theme: 'green', label: 'Nominal' },
  { value: 85, theme: 'yellow', label: 'Elevated' },
  { value: 100, theme: 'magenta', label: 'Critical' },
];

export const SPARK_UP: number[] = [12, 14, 13, 17, 21, 19, 24, 28, 26, 33, 37, 41];
export const SPARK_DOWN: number[] = [48, 44, 46, 39, 35, 37, 30, 26, 27, 21, 18, 14];
export const SPARK_NOISY: number[] = walk(seeded(7), 32, { start: 40, step: 18 });
