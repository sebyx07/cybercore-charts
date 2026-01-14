/**
 * Cybercore Charts - Type Validation Tests
 * Tests type definitions and interfaces
 */

import { describe, it, expect } from 'vitest';

// Import types from the actual types file
import type {
  DataPoint,
  DataSeries,
  ChartTheme,
  ChartPadding,
  AxisConfig,
  TooltipConfig,
  LegendConfig,
  AnimationConfig,
  GlowConfig,
  BaseChartOptions,
  LineChartOptions,
  BarChartOptions,
  GaugeChartOptions,
  DonutChartOptions,
  SparklineOptions,
  ChartInstance,
  ChartEventType,
  Point,
  BoundingBox,
  EasingFunction,
} from '../src/types';

describe('Type Definitions', () => {
  describe('DataPoint', () => {
    it('should accept valid data points', () => {
      const point: DataPoint = {
        x: 10,
        y: 20,
        label: 'Test Point',
      };

      expect(point.x).toBe(10);
      expect(point.y).toBe(20);
    });

    it('should accept string x values', () => {
      const point: DataPoint = {
        x: 'January',
        y: 100,
      };

      expect(point.x).toBe('January');
    });

    it('should accept Date x values', () => {
      const date = new Date('2024-01-01');
      const point: DataPoint = {
        x: date,
        y: 50,
      };

      expect(point.x).toBe(date);
    });

    it('should accept optional meta property', () => {
      const point: DataPoint = {
        x: 1,
        y: 2,
        meta: { custom: 'data' },
      };

      expect(point.meta?.custom).toBe('data');
    });
  });

  describe('DataSeries', () => {
    it('should accept valid data series', () => {
      const series: DataSeries = {
        id: 'series-1',
        name: 'Sales',
        data: [
          { x: 1, y: 10 },
          { x: 2, y: 20 },
        ],
        theme: 'cyan',
      };

      expect(series.data).toHaveLength(2);
      expect(series.name).toBe('Sales');
    });

    it('should accept optional properties', () => {
      const series: DataSeries = {
        id: 'series-2',
        name: 'Revenue',
        data: [{ x: 1, y: 100 }],
        color: '#ff00aa',
        visible: false,
      };

      expect(series.visible).toBe(false);
    });
  });

  describe('BaseChartOptions', () => {
    it('should accept minimal options', () => {
      const options: BaseChartOptions = {
        width: 400,
        height: 300,
      };

      expect(options.width).toBe(400);
      expect(options.height).toBe(300);
    });

    it('should accept full options', () => {
      const options: BaseChartOptions = {
        width: 600,
        height: 400,
        padding: { top: 20, right: 20, bottom: 40, left: 40 },
        theme: 'cyan',
        animate: true,
        responsive: true,
        glow: true,
        scanlines: true,
        ariaLabel: 'Sales Chart',
      };

      expect(options.theme).toBe('cyan');
      expect(options.animate).toBe(true);
    });

    it('should accept glow config object', () => {
      const options: BaseChartOptions = {
        glow: {
          enabled: true,
          intensity: 0.8,
          blur: 6,
          useThemeColor: true,
        },
      };

      expect((options.glow as GlowConfig).enabled).toBe(true);
    });
  });

  describe('LineChartOptions', () => {
    it('should accept line chart specific options', () => {
      const options: LineChartOptions = {
        data: [
          { x: 1, y: 10 },
          { x: 2, y: 20 },
        ],
        showArea: true,
        areaOpacity: 0.3,
        showPoints: true,
        pointRadius: 4,
        lineWidth: 2,
        interpolation: 'smooth',
      };

      expect(options.showArea).toBe(true);
      expect(options.interpolation).toBe('smooth');
    });
  });

  describe('BarChartOptions', () => {
    it('should accept bar chart specific options', () => {
      const options: BarChartOptions = {
        data: [
          { x: 'Q1', y: 100 },
          { x: 'Q2', y: 150 },
        ],
        orientation: 'vertical',
        groupMode: 'grouped',
        borderRadius: 4,
        barGap: 0.1,
        showValues: true,
      };

      expect(options.orientation).toBe('vertical');
      expect(options.groupMode).toBe('grouped');
    });
  });
});

describe('Configuration Types', () => {
  describe('ChartPadding', () => {
    it('should accept full padding specification', () => {
      const padding: ChartPadding = {
        top: 20,
        right: 30,
        bottom: 40,
        left: 50,
      };
      expect(padding.top).toBe(20);
      expect(padding.left).toBe(50);
    });
  });

  describe('AxisConfig', () => {
    it('should accept axis configuration', () => {
      const axis: AxisConfig = {
        show: true,
        showGrid: true,
        showLabels: true,
        min: 0,
        max: 100,
        ticks: 5,
        label: 'X Axis',
      };
      expect(axis.label).toBe('X Axis');
      expect(axis.ticks).toBe(5);
    });

    it('should accept custom tick formatter', () => {
      const axis: AxisConfig = {
        formatLabel: (value) => `${value}%`,
      };
      expect(axis.formatLabel?.(50)).toBe('50%');
    });
  });

  describe('TooltipConfig', () => {
    it('should accept tooltip configuration', () => {
      const tooltip: TooltipConfig = {
        enabled: true,
        followCursor: true,
      };
      expect(tooltip.enabled).toBe(true);
    });

    it('should accept custom formatter', () => {
      const tooltip: TooltipConfig = {
        formatter: (point) => `Value: ${point.y}`,
      };
      const result = tooltip.formatter?.({ x: 1, y: 100 });
      expect(result).toBe('Value: 100');
    });
  });

  describe('LegendConfig', () => {
    it('should accept legend configuration', () => {
      const legend: LegendConfig = {
        show: true,
        position: 'bottom',
        align: 'center',
      };
      expect(legend.position).toBe('bottom');
    });

    it('should allow all position values', () => {
      const positions: LegendConfig['position'][] = ['top', 'bottom', 'left', 'right'];
      expect(positions).toContain('top');
      expect(positions).toContain('bottom');
    });
  });

  describe('AnimationConfig', () => {
    it('should accept animation configuration', () => {
      const animation: AnimationConfig = {
        enabled: true,
        duration: 500,
        easing: 'easeOut',
        delay: 100,
        stagger: 50,
      };
      expect(animation.duration).toBe(500);
      expect(animation.easing).toBe('easeOut');
    });
  });

  describe('GlowConfig', () => {
    it('should accept glow configuration', () => {
      const glow: GlowConfig = {
        enabled: true,
        intensity: 0.8,
        blur: 6,
        useThemeColor: true,
      };
      expect(glow.intensity).toBe(0.8);
    });
  });
});

describe('Type Exports', () => {
  it('should export ChartTheme union', () => {
    const themes: ChartTheme[] = ['cyan', 'magenta', 'green', 'yellow'];
    expect(themes).toHaveLength(4);
  });

  it('should export EasingFunction union', () => {
    const easings: EasingFunction[] = [
      'linear',
      'easeIn',
      'easeOut',
      'easeInOut',
      'easeInCubic',
      'easeOutCubic',
      'easeInOutCubic',
    ];
    expect(easings).toContain('easeOut');
  });

  it('should export ChartEventType union', () => {
    const events: ChartEventType[] = [
      'pointHover',
      'pointClick',
      'segmentHover',
      'segmentClick',
      'barHover',
      'barClick',
      'legendClick',
      'resize',
    ];
    expect(events).toContain('pointClick');
  });
});

describe('ChartInstance Interface', () => {
  it('should define required methods', () => {
    // This is a compile-time check - if ChartInstance is missing methods, TypeScript will error
    const mockInstance: ChartInstance = {
      update: (data) => {},
      setOptions: (options) => {},
      destroy: () => {},
      resize: (width, height) => {},
      getSVG: () => document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
      toSVG: () => '<svg></svg>',
      on: (event, handler) => {},
      off: (event, handler) => {},
    };

    expect(typeof mockInstance.update).toBe('function');
    expect(typeof mockInstance.destroy).toBe('function');
    expect(typeof mockInstance.resize).toBe('function');
    expect(typeof mockInstance.getSVG).toBe('function');
    expect(typeof mockInstance.toSVG).toBe('function');
    expect(typeof mockInstance.on).toBe('function');
    expect(typeof mockInstance.off).toBe('function');
  });
});

describe('Utility Types', () => {
  describe('Point', () => {
    it('should accept coordinates', () => {
      const point: Point = { x: 10, y: 20 };
      expect(point.x).toBe(10);
      expect(point.y).toBe(20);
    });
  });

  describe('BoundingBox', () => {
    it('should accept bounding box values', () => {
      const box: BoundingBox = {
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      };
      expect(box.width).toBe(100);
    });
  });
});

describe('Specialized Chart Options', () => {
  describe('GaugeChartOptions', () => {
    it('should accept gauge chart specific options', () => {
      const options: GaugeChartOptions = {
        value: 75,
        min: 0,
        max: 100,
        startAngle: -135,
        endAngle: 135,
        thickness: 10,
        showValue: true,
        label: 'Progress',
        showTicks: true,
        tickCount: 10,
      };
      expect(options.value).toBe(75);
      expect(options.label).toBe('Progress');
    });
  });

  describe('DonutChartOptions', () => {
    it('should accept donut chart specific options', () => {
      const options: DonutChartOptions = {
        data: [
          { label: 'A', value: 30 },
          { label: 'B', value: 70 },
        ],
        innerRadius: 0.5,
        segmentGap: 2,
        showLabels: true,
        showPercentages: true,
        centerText: 'Total',
      };
      expect(options.innerRadius).toBe(0.5);
      expect(options.centerText).toBe('Total');
    });
  });

  describe('SparklineOptions', () => {
    it('should accept sparkline specific options', () => {
      const options: SparklineOptions = {
        data: [1, 4, 2, 6, 3, 8, 5],
        width: 100,
        height: 30,
        theme: 'cyan',
        showArea: true,
        areaOpacity: 0.2,
        showEndPoint: true,
        showMinMax: true,
        glow: true,
        interpolation: 'smooth',
        animate: true,
      };
      expect(options.data).toHaveLength(7);
      expect(options.interpolation).toBe('smooth');
    });
  });
});
