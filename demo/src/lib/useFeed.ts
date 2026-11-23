import { useCallback, useState } from 'react';

import { randomStep } from '../data/samples';

import { useTicker } from './useLive';

interface FeedOptions {
  seed: number;
  count: number;
  start?: number;
  step?: number;
  min?: number;
  max?: number;
  intervalMs?: number;
}

interface Feed {
  /** State of the random source after the last value was drawn. */
  random: number;
  values: number[];
}

interface Walk {
  step: number;
  min: number;
  max: number;
}

/** Appends the next value of a wandering series, kept inside [min, max]. */
function advance(feed: Feed, previous: number, { step, min, max }: Walk): Feed {
  const [roll, random] = randomStep(feed.random);
  const next = Math.round(Math.min(max, Math.max(min, previous + (roll - 0.5) * 2 * step)));
  return { random, values: [...feed.values, next] };
}

/**
 * A synthetic live series: `count` values that drop the oldest and append a
 * new one on every tick while `live` is true.
 *
 * The random source's state is part of the React state and every step is a
 * pure function of it, so the series is the same on every load, in
 * development (where StrictMode runs initializers and updaters twice) and in
 * production.
 */
export function useFeed(options: FeedOptions, live: boolean): number[] {
  const { seed, count, start = 50, step = 12, min = 5, max = 95, intervalMs = 2000 } = options;

  const [feed, setFeed] = useState<Feed>(() => {
    let initial: Feed = { random: seed >>> 0, values: [] };
    for (let index = 0; index < count; index += 1) {
      const previous = initial.values[initial.values.length - 1] ?? start;
      initial = advance(initial, previous, { step, min, max });
    }
    return initial;
  });

  const tick = useCallback(() => {
    setFeed((current) => {
      const previous = current.values[current.values.length - 1] ?? start;
      const next = advance(current, previous, { step, min, max });
      return { random: next.random, values: next.values.slice(1) };
    });
  }, [start, step, min, max]);

  useTicker(tick, intervalMs, live);
  return feed.values;
}
