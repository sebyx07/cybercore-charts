/**
 * Cybercore Charts - Chart Module Tests
 * Tests chart class imports, types, and basic functionality without DOM
 */

import { describe, it, expect } from 'vitest';

// Import chart classes
import { LineChart } from '../src/charts/LineChart';
import { BarChart } from '../src/charts/BarChart';
import { GaugeChart } from '../src/charts/GaugeChart';
import { DonutChart } from '../src/charts/DonutChart';
import { Sparkline } from '../src/charts/Sparkline';

// Import types
import type {
  DataPoint,
  DataSeries,
  LineChartOptions,
  BarChartOptions,
  GaugeChartOptions,
  DonutChartOptions,
  SparklineOptions,
  ChartTheme,
  ChartPadding,
} from '../src/types';

describe('Chart Classes - Imports', () => {
  it('should export LineChart class', () => {
    expect(LineChart).toBeDefined();
    expect(typeof LineChart).toBe('function');
  });

  it('should export BarChart class', () => {
    expect(BarChart).toBeDefined();
    expect(typeof BarChart).toBe('function');
  });

  it('should export GaugeChart class', () => {
    expect(GaugeChart).toBeDefined();
    expect(typeof GaugeChart).toBe('function');
  });

  it('should export DonutChart class', () => {
    expect(DonutChart).toBeDefined();
    expect(typeof DonutChart).toBe('function');
  });

  it('should export Sparkline class', () => {
    expect(Sparkline).toBeDefined();
    expect(typeof Sparkline).toBe('function');
  });
});

describe('Chart Classes - Constructor Types', () => {
  it('LineChart constructor should expect container and options', () => {
    // Verify the constructor signature is correct by checking it's a class
    expect(LineChart.prototype.constructor).toBeDefined();
    expect(LineChart.prototype.constructor.length).toBeGreaterThanOrEqual(2);
  });

  it('BarChart constructor should expect container and options', () => {
    expect(BarChart.prototype.constructor).toBeDefined();
    expect(BarChart.prototype.constructor.length).toBeGreaterThanOrEqual(2);
  });

  it('GaugeChart constructor should expect container and options', () => {
    expect(GaugeChart.prototype.constructor).toBeDefined();
    expect(GaugeChart.prototype.constructor.length).toBeGreaterThanOrEqual(2);
  });

  it('DonutChart constructor should expect container and options', () => {
    expect(DonutChart.prototype.constructor).toBeDefined();
    expect(DonutChart.prototype.constructor.length).toBeGreaterThanOrEqual(2);
  });

  it('Sparkline constructor should expect container and options', () => {
    expect(Sparkline.prototype.constructor).toBeDefined();
    expect(Sparkline.prototype.constructor.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Chart Classes - Prototype Methods', () => {
  describe('LineChart', () => {
    it('should have update method', () => {
      expect(typeof LineChart.prototype.update).toBe('function');
    });

    it('should have setOptions method', () => {
      expect(typeof LineChart.prototype.setOptions).toBe('function');
    });

    it('should have resize method', () => {
      expect(typeof LineChart.prototype.resize).toBe('function');
    });

    it('should have destroy method', () => {
      expect(typeof LineChart.prototype.destroy).toBe('function');
    });

    it('should have getSVG method', () => {
      expect(typeof LineChart.prototype.getSVG).toBe('function');
    });

    it('should have toSVG method', () => {
      expect(typeof LineChart.prototype.toSVG).toBe('function');
    });

    it('should have on method for event handling', () => {
      expect(typeof LineChart.prototype.on).toBe('function');
    });

    it('should have off method for event handling', () => {
      expect(typeof LineChart.prototype.off).toBe('function');
    });
  });

  describe('BarChart', () => {
    it('should have update method', () => {
      expect(typeof BarChart.prototype.update).toBe('function');
    });

    it('should have destroy method', () => {
      expect(typeof BarChart.prototype.destroy).toBe('function');
    });

    it('should have getSVG method', () => {
      expect(typeof BarChart.prototype.getSVG).toBe('function');
    });
  });

  describe('GaugeChart', () => {
    it('should have update method', () => {
      expect(typeof GaugeChart.prototype.update).toBe('function');
    });

    it('should have resize method', () => {
      expect(typeof GaugeChart.prototype.resize).toBe('function');
    });

    it('should have destroy method', () => {
      expect(typeof GaugeChart.prototype.destroy).toBe('function');
    });
  });

  describe('DonutChart', () => {
    it('should have update method', () => {
      expect(typeof DonutChart.prototype.update).toBe('function');
    });

    it('should have destroy method', () => {
      expect(typeof DonutChart.prototype.destroy).toBe('function');
    });
  });

  describe('Sparkline', () => {
    it('should have update method', () => {
      expect(typeof Sparkline.prototype.update).toBe('function');
    });

    it('should have destroy method', () => {
      expect(typeof Sparkline.prototype.destroy).toBe('function');
    });
  });
});

describe('Type Definitions', () => {
  it('should accept valid DataPoint structure', () => {
    const dataPoint: DataPoint = { x: 'Jan', y: 10 };
    expect(dataPoint.x).toBe('Jan');
    expect(dataPoint.y).toBe(10);
  });

  it('should accept DataPoint with numeric x', () => {
    const dataPoint: DataPoint = { x: 0, y: 25 };
    expect(dataPoint.x).toBe(0);
    expect(dataPoint.y).toBe(25);
  });

  it('should accept DataPoint with optional label', () => {
    const dataPoint: DataPoint = { x: 'Feb', y: 15, label: 'February' };
    expect(dataPoint.label).toBe('February');
  });

  it('should accept valid DataSeries structure', () => {
    const series: DataSeries = {
      id: 'series-1',
      name: 'Sales',
      data: [
        { x: 'Jan', y: 10 },
        { x: 'Feb', y: 20 },
      ],
    };
    expect(series.id).toBe('series-1');
    expect(series.name).toBe('Sales');
    expect(series.data).toHaveLength(2);
  });

  it('should accept DataSeries with theme and color', () => {
    const series: DataSeries = {
      id: 'series-2',
      name: 'Revenue',
      data: [{ x: 0, y: 100 }],
      theme: 'cyan',
      color: '#00f0ff',
    };
    expect(series.theme).toBe('cyan');
    expect(series.color).toBe('#00f0ff');
  });

  it('should accept valid ChartTheme values', () => {
    const themes: ChartTheme[] = ['cyan', 'magenta', 'green', 'yellow'];
    expect(themes).toContain('cyan');
    expect(themes).toContain('magenta');
    expect(themes).toContain('green');
    expect(themes).toContain('yellow');
  });

  it('should accept valid ChartPadding structure', () => {
    const padding: ChartPadding = {
      top: 20,
      right: 20,
      bottom: 40,
      left: 50,
    };
    expect(padding.top).toBe(20);
    expect(padding.left).toBe(50);
  });
});

describe('Options Type Validation', () => {
  it('should accept minimal LineChartOptions', () => {
    const options: LineChartOptions = {
      data: [{ x: 'Jan', y: 10 }],
    };
    expect(options.data).toHaveLength(1);
  });

  it('should accept full LineChartOptions', () => {
    const options: LineChartOptions = {
      data: [{ x: 'Jan', y: 10 }],
      width: 400,
      height: 300,
      theme: 'magenta',
      animate: false,
      showArea: true,
      showPoints: true,
      interpolation: 'smooth',
    };
    expect(options.width).toBe(400);
    expect(options.theme).toBe('magenta');
  });

  it('should accept minimal BarChartOptions', () => {
    const options: BarChartOptions = {
      data: [{ x: 'A', y: 50 }],
    };
    expect(options.data).toBeDefined();
  });

  it('should accept full BarChartOptions', () => {
    const options: BarChartOptions = {
      data: [{ x: 'A', y: 50 }],
      width: 500,
      height: 400,
      theme: 'green',
      orientation: 'horizontal',
      barWidth: 0.7,
    };
    expect(options.orientation).toBe('horizontal');
  });

  it('should accept minimal GaugeChartOptions', () => {
    const options: GaugeChartOptions = {
      value: 75,
    };
    expect(options.value).toBe(75);
  });

  it('should accept full GaugeChartOptions', () => {
    const options: GaugeChartOptions = {
      value: 75,
      min: 0,
      max: 100,
      theme: 'yellow',
      arcWidth: 20,
      showValue: true,
      label: 'Progress',
    };
    expect(options.min).toBe(0);
    expect(options.max).toBe(100);
  });

  it('should accept minimal DonutChartOptions', () => {
    const options: DonutChartOptions = {
      data: [{ label: 'A', value: 30 }],
    };
    expect(options.data).toHaveLength(1);
  });

  it('should accept minimal SparklineOptions', () => {
    const options: SparklineOptions = {
      data: [10, 20, 15, 25],
    };
    expect(options.data).toHaveLength(4);
  });
});

describe('Index Exports', () => {
  it('should export all charts from index', async () => {
    const index = await import('../src/charts/index');
    expect(index.LineChart).toBeDefined();
    expect(index.BarChart).toBeDefined();
    expect(index.GaugeChart).toBeDefined();
    expect(index.DonutChart).toBeDefined();
    expect(index.Sparkline).toBeDefined();
  });

  it('should export from main index', async () => {
    const mainIndex = await import('../src/index');
    expect(mainIndex.LineChart).toBeDefined();
    expect(mainIndex.BarChart).toBeDefined();
  });
});
