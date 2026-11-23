// @vitest-environment happy-dom
/**
 * React adapter: lifecycle under StrictMode, prop updates, refs, events and
 * server rendering.
 */

import { cleanup, render } from '@testing-library/react';
import { createElement, createRef, StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LineChart } from '../../src/charts/LineChart';
import {
  CyberBarChart,
  CyberDonutChart,
  CyberGaugeChart,
  CyberLineChart,
  CyberSparkline,
  useChart,
} from '../../src/react';
import { resetDocument } from '../helpers/dom';

import type {
  CyberDonutChartRef,
  CyberGaugeChartRef,
  CyberLineChartRef,
  CyberSparklineRef,
} from '../../src/react';
import type { DataPoint, DonutSegment } from '../../src/types';

const POINTS: DataPoint[] = [
  { x: 'Mon', y: 12 },
  { x: 'Tue', y: 30 },
  { x: 'Wed', y: 18 },
];
const SEGMENTS: DonutSegment[] = [
  { label: 'Online', value: 70 },
  { label: 'Idle', value: 30 },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetDocument();
});

describe('React components', () => {
  it.each([
    ['CyberLineChart', () => createElement(CyberLineChart, { data: POINTS, animate: false })],
    ['CyberBarChart', () => createElement(CyberBarChart, { data: POINTS, animate: false })],
    ['CyberDonutChart', () => createElement(CyberDonutChart, { data: SEGMENTS, animate: false })],
    ['CyberGaugeChart', () => createElement(CyberGaugeChart, { value: 42, animate: false })],
    ['CyberSparkline', () => createElement(CyberSparkline, { data: [1, 5, 3], animate: false })],
  ])('%s renders one SVG and removes it on unmount', (_name, element) => {
    const { container, unmount } = render(element());

    expect(container.querySelectorAll('svg')).toHaveLength(1);

    unmount();
    expect(document.querySelectorAll('svg')).toHaveLength(0);
  });

  it('survives the StrictMode double mount with a single chart', () => {
    const destroy = vi.spyOn(LineChart.prototype, 'destroy');

    const { container, unmount } = render(
      createElement(
        StrictMode,
        null,
        createElement(CyberLineChart, { data: POINTS, animate: false, tooltip: { enabled: true } })
      )
    );

    // Mounted twice, torn down once in between: one SVG and one tooltip remain.
    expect(destroy).toHaveBeenCalledOnce();
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(document.querySelectorAll('[class$="__tooltip"]').length).toBeLessThanOrEqual(1);

    unmount();
    expect(destroy).toHaveBeenCalledTimes(2);
    expect(document.querySelectorAll('svg, [class$="__tooltip"]')).toHaveLength(0);
  });

  it('does not call into the chart when a re-render changes nothing', () => {
    const setOptions = vi.spyOn(LineChart.prototype, 'setOptions');
    const props = () => ({ data: POINTS, animate: false, xAxis: { showGrid: true } });

    const { rerender } = render(createElement(CyberLineChart, props()));
    rerender(createElement(CyberLineChart, props()));

    expect(setOptions).not.toHaveBeenCalled();
  });

  it('updates the existing chart in place when a prop changes', () => {
    const setOptions = vi.spyOn(LineChart.prototype, 'setOptions');
    const { container, rerender } = render(
      createElement(CyberLineChart, { data: POINTS, animate: false })
    );
    const svg = container.querySelector('svg');
    const next = [...POINTS, { x: 'Thu', y: 44 }];

    rerender(createElement(CyberLineChart, { data: next, animate: false }));

    expect(setOptions).toHaveBeenCalledExactlyOnceWith({ data: next });
    expect(container.querySelector('svg')).toBe(svg);
  });

  it('keeps chart defaults when an optional prop is undefined', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { container } = render(
      createElement(CyberLineChart, {
        data: POINTS,
        animate: false,
        width: undefined,
        height: undefined,
        theme: undefined,
      })
    );

    expect(warn).not.toHaveBeenCalled();
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('400');
  });

  it('passes DOM attributes to the container and options to the chart', () => {
    const { container } = render(
      createElement(CyberLineChart, {
        data: POINTS,
        animate: false,
        className: 'panel',
        id: 'throughput',
        'data-testid': 'chart',
      } as Parameters<typeof CyberLineChart>[0])
    );
    const host = container.firstElementChild;

    expect(host?.className).toBe('cyber-chart-container panel');
    expect(host?.id).toBe('throughput');
    expect(host?.hasAttribute('animate')).toBe(false);
    expect(host?.hasAttribute('data')).toBe(false);
  });

  it('renders the sparkline in a span so it can sit inside text', () => {
    const { container } = render(
      createElement('p', null, 'Load ', createElement(CyberSparkline, { data: [1, 2, 3] }))
    );

    expect(container.querySelector('p > span.cyber-sparkline-container > svg')).not.toBeNull();
  });
});

describe('React refs', () => {
  it('exposes the chart instance and its methods', () => {
    const ref = createRef<CyberLineChartRef>();
    const { container, unmount } = render(
      createElement(CyberLineChart, { ref, data: POINTS, animate: false })
    );

    expect(ref.current?.getChart()).toBeInstanceOf(LineChart);
    expect(ref.current?.getSVG()).toBe(container.querySelector('svg'));
    expect(ref.current?.toSVG()).toContain('<svg');

    unmount();
    expect(ref.current).toBeNull();
  });

  it('exposes chart-specific getters', () => {
    const donut = createRef<CyberDonutChartRef>();
    const gauge = createRef<CyberGaugeChartRef>();
    const sparkline = createRef<CyberSparklineRef>();
    render(
      createElement(
        'div',
        null,
        createElement(CyberDonutChart, { ref: donut, data: SEGMENTS, animate: false }),
        createElement(CyberGaugeChart, { ref: gauge, value: 42, animate: false }),
        createElement(CyberSparkline, { ref: sparkline, data: [1, 5, 3], animate: false })
      )
    );

    expect(donut.current?.getTotal()).toBe(100);
    expect(gauge.current?.getValue()).toBe(42);
    expect(sparkline.current?.getData()).toEqual([1, 5, 3]);
    expect(sparkline.current?.getStats()).toMatchObject({ min: 1, max: 5, trend: 'up' });
  });
});

describe('React events', () => {
  it('fires the handler of the latest render', () => {
    const first = vi.fn();
    const second = vi.fn();
    const ref = createRef<CyberLineChartRef>();
    const view = (onResize: () => void) =>
      createElement(CyberLineChart, { ref, data: POINTS, animate: false, onResize });

    const { rerender } = render(view(first));
    rerender(view(second));
    ref.current?.resize(320, 200);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});

describe('useChart', () => {
  it('mounts a chart class into the returned ref', () => {
    function Custom() {
      const ref = useChart(LineChart, { data: POINTS, animate: false });
      return createElement('div', { ref, 'data-testid': 'host' });
    }

    const { getByTestId } = render(createElement(Custom));

    expect(getByTestId('host').querySelector('svg')).not.toBeNull();
  });
});

describe('server rendering', () => {
  it('renders an empty container without touching the DOM', () => {
    const html = renderToString(
      createElement(CyberLineChart, { data: POINTS, className: 'panel', 'aria-label': 'Traffic' })
    );

    expect(html).toBe('<div class="cyber-chart-container panel" aria-label="Traffic"></div>');
  });

  it('renders the sparkline container inline', () => {
    const html = renderToString(createElement(CyberSparkline, { data: [1, 2, 3] }));

    expect(html).toBe(
      '<span class="cyber-sparkline-container" style="display:inline-block"></span>'
    );
  });
});
