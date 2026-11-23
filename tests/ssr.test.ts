/**
 * Server-side rendering safety: the library must import without a DOM and
 * fail with a readable message when asked to render without one.
 */

import { describe, expect, it } from 'vitest';

describe('SSR safety', () => {
  it('imports every entry point without window or document', async () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const lib = await import('../src/index');
    const cdn = await import('../src/cdn');
    expect(lib.createChart).toBeTypeOf('function');
    expect(cdn.default.VERSION).toBe(lib.VERSION);
  });

  it('explains that a DOM is required instead of throwing a ReferenceError', async () => {
    const { createChart, LineChart } = await import('../src/index');
    expect(() => createChart('line', '#chart', { data: [] })).toThrow(/requires a DOM/);
    expect(() => new LineChart('#chart', { data: [] })).toThrow(/requires a DOM/);
  });
});
