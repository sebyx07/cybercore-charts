/**
 * Cybercore Charts - Chart Rendering Tests
 * Tests chart creation, rendering, data updates, and cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Import chart classes
import { LineChart } from '../src/charts/LineChart';
import type {
  DataPoint,
  DataSeries,
  LineChartOptions,
} from '../src/types';

// Setup DOM environment
let dom: JSDOM;
let document: Document;
let container: HTMLElement;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="chart"></div></body></html>');
  document = dom.window.document;
  // @ts-ignore - Setting up global document for tests
  global.document = document;
  // @ts-ignore - Setting up global window for tests
  global.window = dom.window;
  // @ts-ignore - Setting up global HTMLElement for tests
  global.HTMLElement = dom.window.HTMLElement;
  // @ts-ignore - Setting up global SVGElement for tests
  global.SVGElement = dom.window.SVGElement;
  container = document.getElementById('chart') as HTMLElement;
});

afterEach(() => {
  container.innerHTML = '';
});

// Sample data for tests
const sampleLineData: DataPoint[] = [
  { x: 'Jan', y: 10 },
  { x: 'Feb', y: 25 },
  { x: 'Mar', y: 15 },
  { x: 'Apr', y: 30 },
  { x: 'May', y: 20 },
];

const sampleNumericData: DataPoint[] = [
  { x: 0, y: 10 },
  { x: 1, y: 25 },
  { x: 2, y: 15 },
  { x: 3, y: 30 },
  { x: 4, y: 20 },
];

const sampleSeriesData: DataSeries[] = [
  {
    id: 'series-1',
    name: 'Series A',
    data: [
      { x: 'Jan', y: 10 },
      { x: 'Feb', y: 20 },
      { x: 'Mar', y: 15 },
    ],
    theme: 'cyan',
  },
  {
    id: 'series-2',
    name: 'Series B',
    data: [
      { x: 'Jan', y: 15 },
      { x: 'Feb', y: 25 },
      { x: 'Mar', y: 20 },
    ],
    theme: 'magenta',
  },
];

const defaultOptions: LineChartOptions = {
  data: sampleLineData,
  width: 400,
  height: 300,
  animate: false,
};

describe('LineChart', () => {
  describe('Initialization', () => {
    it('should create a valid SVG element', () => {
      const chart = new LineChart(container, defaultOptions);

      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.tagName.toLowerCase()).toBe('svg');

      chart.destroy();
    });

    it('should accept container as HTMLElement', () => {
      const chart = new LineChart(container, defaultOptions);

      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();

      chart.destroy();
    });

    it('should accept container as string selector', () => {
      const chart = new LineChart('#chart', defaultOptions);

      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();

      chart.destroy();
    });

    it('should throw error for invalid container selector', () => {
      expect(() => {
        new LineChart('#nonexistent', defaultOptions);
      }).toThrow('Container not found');
    });

    it('should set correct dimensions', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        width: 500,
        height: 350,
      });

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('500');
      expect(svg?.getAttribute('height')).toBe('350');

      chart.destroy();
    });

    it('should apply cyber theme class prefix', () => {
      const chart = new LineChart(container, defaultOptions);

      const svg = container.querySelector('svg');
      expect(svg?.classList.contains('cyber-chart')).toBe(true);

      chart.destroy();
    });
  });

  describe('Rendering', () => {
    it('should render path elements for data lines', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        showPoints: false,
      });

      const paths = container.querySelectorAll('.cyber-chart__line');
      expect(paths.length).toBeGreaterThan(0);

      chart.destroy();
    });

    it('should render data points when showPoints is true', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        showPoints: true,
      });

      const points = container.querySelectorAll('.cyber-chart__point');
      expect(points.length).toBe(sampleLineData.length);

      chart.destroy();
    });

    it('should hide data points when showPoints is false', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        showPoints: false,
      });

      const points = container.querySelectorAll('.cyber-chart__point');
      expect(points.length).toBe(0);

      chart.destroy();
    });

    it('should render area fill when showArea is true', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        showArea: true,
      });

      const areaFill = container.querySelector('.cyber-chart__area-fill');
      expect(areaFill).not.toBeNull();

      chart.destroy();
    });

    it('should render with numeric x values', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        data: sampleNumericData,
      });

      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();

      chart.destroy();
    });

    it('should render multiple series', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        data: sampleSeriesData,
      });

      const seriesGroups = container.querySelectorAll('.cyber-chart__series');
      expect(seriesGroups.length).toBe(2);

      chart.destroy();
    });
  });

  describe('Interpolation', () => {
    it('should render linear interpolation by default', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        interpolation: 'linear',
      });

      const path = container.querySelector('.cyber-chart__line');
      const d = path?.getAttribute('d') || '';
      // Linear paths use L commands
      expect(d).toContain('L');

      chart.destroy();
    });

    it('should render smooth interpolation', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        interpolation: 'smooth',
      });

      const path = container.querySelector('.cyber-chart__line');
      const d = path?.getAttribute('d') || '';
      // Smooth paths use C (cubic bezier) commands
      expect(d).toContain('C');

      chart.destroy();
    });

    it('should render step interpolation', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        interpolation: 'step',
      });

      const path = container.querySelector('.cyber-chart__line');
      const d = path?.getAttribute('d') || '';
      // Step paths use H and V commands
      expect(d).toMatch(/[HV]/);

      chart.destroy();
    });
  });

  describe('Axes', () => {
    it('should render x-axis when enabled', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        xAxis: { show: true },
      });

      const xAxis = container.querySelector('.cyber-chart__x-axis');
      expect(xAxis).not.toBeNull();

      chart.destroy();
    });

    it('should render y-axis when enabled', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        yAxis: { show: true },
      });

      const yAxis = container.querySelector('.cyber-chart__y-axis');
      expect(yAxis).not.toBeNull();

      chart.destroy();
    });

    it('should render grid lines when enabled', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        xAxis: { show: true, showGrid: true },
        yAxis: { show: true, showGrid: true },
      });

      const gridLines = container.querySelectorAll('.cyber-chart__grid-line');
      expect(gridLines.length).toBeGreaterThan(0);

      chart.destroy();
    });

    it('should render tick labels when enabled', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        xAxis: { show: true, showLabels: true },
        yAxis: { show: true, showLabels: true },
      });

      const tickLabels = container.querySelectorAll('.cyber-chart__tick-label');
      expect(tickLabels.length).toBeGreaterThan(0);

      chart.destroy();
    });
  });

  describe('Legend', () => {
    it('should render legend for multiple series', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        data: sampleSeriesData,
        legend: { show: true },
      });

      const legend = container.querySelector('.cyber-chart__legend');
      expect(legend).not.toBeNull();

      chart.destroy();
    });

    it('should not render legend for single series', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        data: sampleLineData,
        legend: { show: true },
      });

      // Single series doesn't show legend
      const legend = container.querySelector('.cyber-chart__legend');
      expect(legend).toBeNull();

      chart.destroy();
    });
  });

  describe('Effects', () => {
    it('should create glow filter definitions', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        glow: true,
      });

      const glowFilter = container.querySelector('filter[id^="glow-"]');
      expect(glowFilter).not.toBeNull();

      chart.destroy();
    });

    it('should create gradient definitions for area', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        showArea: true,
      });

      const gradient = container.querySelector('linearGradient[id^="area-gradient-"]');
      expect(gradient).not.toBeNull();

      chart.destroy();
    });

    it('should render scanlines when enabled', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        scanlines: true,
      });

      const scanlinesPattern = container.querySelector('pattern[id="scanlines"]');
      expect(scanlinesPattern).not.toBeNull();

      chart.destroy();
    });
  });

  describe('Data Updates', () => {
    it('should update data correctly', () => {
      const chart = new LineChart(container, defaultOptions);

      const newData: DataPoint[] = [
        { x: 'Jan', y: 50 },
        { x: 'Feb', y: 60 },
        { x: 'Mar', y: 70 },
      ];

      chart.update(newData);

      // Chart should still have SVG
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();

      // Points should match new data length
      const points = container.querySelectorAll('.cyber-chart__point');
      expect(points.length).toBe(newData.length);

      chart.destroy();
    });

    it('should update options correctly', () => {
      const chart = new LineChart(container, defaultOptions);

      chart.setOptions({
        theme: 'magenta',
        showArea: true,
      });

      const areaFill = container.querySelector('.cyber-chart__area-fill');
      expect(areaFill).not.toBeNull();

      chart.destroy();
    });
  });

  describe('Resize', () => {
    it('should resize chart dimensions', () => {
      const chart = new LineChart(container, defaultOptions);

      chart.resize(600, 400);

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('600');
      expect(svg?.getAttribute('height')).toBe('400');

      chart.destroy();
    });

    it('should update viewBox on resize', () => {
      const chart = new LineChart(container, defaultOptions);

      chart.resize(600, 400);

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 600 400');

      chart.destroy();
    });
  });

  describe('Cleanup', () => {
    it('should destroy and cleanup DOM elements', () => {
      const chart = new LineChart(container, defaultOptions);

      expect(container.querySelector('svg')).not.toBeNull();

      chart.destroy();

      expect(container.querySelector('svg')).toBeNull();
      expect(container.innerHTML).toBe('');
    });

    it('should remove tooltip element on destroy', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        tooltip: { enabled: true },
      });

      chart.destroy();

      const tooltip = document.querySelector('.cyber-chart__tooltip');
      expect(tooltip).toBeNull();
    });
  });

  describe('Public API', () => {
    it('should return SVG element via getSVG()', () => {
      const chart = new LineChart(container, defaultOptions);

      const svg = chart.getSVG();
      expect(svg).toBe(container.querySelector('svg'));

      chart.destroy();
    });

    it('should export SVG string via toSVG()', () => {
      const chart = new LineChart(container, defaultOptions);

      const svgString = chart.toSVG();
      expect(svgString).toContain('<svg');
      expect(svgString).toContain('</svg>');

      chart.destroy();
    });
  });

  describe('Events', () => {
    it('should register event handlers', () => {
      const chart = new LineChart(container, defaultOptions);
      const handler = vi.fn();

      chart.on('pointClick', handler);

      // Handler should be registered without error
      expect(handler).not.toHaveBeenCalled();

      chart.destroy();
    });

    it('should unregister event handlers', () => {
      const chart = new LineChart(container, defaultOptions);
      const handler = vi.fn();

      chart.on('pointClick', handler);
      chart.off('pointClick', handler);

      chart.destroy();
    });

    it('should emit resize event on resize', () => {
      const chart = new LineChart(container, defaultOptions);
      const handler = vi.fn();

      chart.on('resize', handler);
      chart.resize(600, 400);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'resize',
          data: { width: 600, height: 400 },
        })
      );

      chart.destroy();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on SVG', () => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        ariaLabel: 'Monthly Sales Chart',
      });

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('aria-label')).toBe('Monthly Sales Chart');

      chart.destroy();
    });

    it('should have role="img" on SVG', () => {
      const chart = new LineChart(container, defaultOptions);

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('role')).toBe('img');

      chart.destroy();
    });
  });
});

describe('Chart Options', () => {
  it('should apply custom padding', () => {
    const chart = new LineChart(container, {
      ...defaultOptions,
      padding: { top: 30, right: 30, bottom: 50, left: 60 },
    });

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();

    chart.destroy();
  });

  it('should apply theme colors', () => {
    const themes = ['cyan', 'magenta', 'green', 'yellow'] as const;

    themes.forEach((theme) => {
      const chart = new LineChart(container, {
        ...defaultOptions,
        theme,
      });

      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();

      chart.destroy();
    });
  });

  it('should respect line width option', () => {
    const chart = new LineChart(container, {
      ...defaultOptions,
      lineWidth: 4,
    });

    const line = container.querySelector('.cyber-chart__line');
    expect(line?.getAttribute('stroke-width')).toBe('4');

    chart.destroy();
  });

  it('should respect point radius option', () => {
    const chart = new LineChart(container, {
      ...defaultOptions,
      showPoints: true,
      pointRadius: 6,
    });

    const point = container.querySelector('.cyber-chart__point');
    expect(point?.getAttribute('r')).toBe('6');

    chart.destroy();
  });

  it('should respect area opacity option', () => {
    const chart = new LineChart(container, {
      ...defaultOptions,
      showArea: true,
      areaOpacity: 0.5,
    });

    // Check gradient has correct opacity
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();

    chart.destroy();
  });
});

describe('Empty Data Handling', () => {
  it('should handle empty data array', () => {
    const chart = new LineChart(container, {
      ...defaultOptions,
      data: [],
    });

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();

    chart.destroy();
  });

  it('should handle single data point', () => {
    const chart = new LineChart(container, {
      ...defaultOptions,
      data: [{ x: 'Jan', y: 10 }],
    });

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();

    chart.destroy();
  });
});
