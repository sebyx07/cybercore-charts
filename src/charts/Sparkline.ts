/**
 * CyberCore Charts - Sparkline
 * Inline mini chart with cyberpunk styling
 */

import { formatNumber } from '../utils/format';
import { createInvertedScale, createLinearScale, smoothPath } from '../utils/math';
import {
  createCircle,
  createGroup,
  createLinearGradient,
  createPath,
  pointsToPath,
} from '../utils/svg';
import { themeColor } from '../utils/theme';

import { BaseChart } from './BaseChart';

import type { GlowConfig, Point, SparklineOptions } from '../types';

// ============================================================================
// Types and Defaults
// ============================================================================

type SparklineDefaults = Required<
  Omit<SparklineOptions, 'data' | 'ariaLabel' | 'description' | 'locale'>
>;
type ResolvedSparklineOptions = SparklineDefaults & SparklineOptions;

interface SparklineStats {
  min: number;
  max: number;
  first: number;
  last: number;
  trend: 'up' | 'down' | 'flat';
}

const DEFAULT_OPTIONS: SparklineDefaults = {
  width: 120,
  height: 32,
  theme: 'accent',
  color: '',
  lineWidth: 1.5,
  showArea: false,
  areaOpacity: 0.2,
  showEndPoint: true,
  showMinMax: false,
  glow: true,
  interpolation: 'linear',
  animate: true,
  animationDuration: 500,
};

const PADDING = 4;
const SPARKLINE_GLOW: GlowConfig = { enabled: true, intensity: 0.8, blur: 3 };

/** Min, max, first, last and trend of the finite values (loop, no spread) */
function statsOf(data: number[]): SparklineStats | null {
  let min = Infinity;
  let max = -Infinity;
  let first: number | null = null;
  let last = 0;
  for (const value of data) {
    if (!Number.isFinite(value)) {
      continue;
    }
    min = Math.min(min, value);
    max = Math.max(max, value);
    first ??= value;
    last = value;
  }
  if (first === null) {
    return null;
  }
  const trend = last > first ? 'up' : last < first ? 'down' : 'flat';
  return { min, max, first, last, trend };
}

// ============================================================================
// Sparkline Class
// ============================================================================

export class Sparkline extends BaseChart<ResolvedSparklineOptions, number[]> {
  constructor(container: HTMLElement | string, options: SparklineOptions) {
    super(container, { ...DEFAULT_OPTIONS, ...options }, { width: 120, height: 32 });
    this.applyDimensions();
    const svg = this.createRoot('cyber-sparkline', this.options.width, this.options.height);
    svg.style.display = 'inline-block';
    svg.style.verticalAlign = 'middle';
    this.createDefinitions();
    this.render();
  }

  private applyDimensions(): void {
    const dims = this.validateDimensions(this.options.width, this.options.height, 'Sparkline');
    this.options.width = dims.width;
    this.options.height = dims.height;
  }

  private color(): string {
    return this.options.color || themeColor(this.options.theme);
  }

  /** A sparkline has no focusable marks; its description tells the story */
  protected override keyboardEnabled(): boolean {
    return false;
  }

  // ==========================================================================
  // Definitions
  // ==========================================================================

  protected createDefinitions(): void {
    if (!this.defs) {
      return;
    }
    this.addEffectDefinitions(this.options.glow ? SPARKLINE_GLOW : false);
    if (this.options.showArea) {
      const color = this.color();
      this.defs.appendChild(
        createLinearGradient(this.ref('area'), [
          { offset: '0%', color, opacity: this.options.areaOpacity },
          { offset: '100%', color, opacity: 0 },
        ])
      );
    }
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  render(): void {
    if (!this.svg) {
      return;
    }
    const animate = this.takeEntryAnimation();
    this.chartArea?.remove();
    this.chartArea = createGroup('cyber-sparkline__content');
    this.chartArea.setAttribute('aria-hidden', 'true');
    this.svg.appendChild(this.chartArea);
    this.updateAccessibility('Sparkline', this.summary());

    const stats = statsOf(this.options.data);
    if (!stats) {
      return;
    }

    const chartWidth = Math.max(0, this.options.width - PADDING * 2);
    const chartHeight = Math.max(0, this.options.height - PADDING * 2);
    const yPadding = (stats.max - stats.min) * 0.1 || 1;
    const xScale = createLinearScale(0, Math.max(1, this.options.data.length - 1), 0, chartWidth);
    const yScale = createInvertedScale(stats.min - yPadding, stats.max + yPadding, 0, chartHeight);

    // Non-finite values break the line into runs
    const runs: Point[][] = [[]];
    const points: Array<Point | null> = this.options.data.map((value, index) => {
      if (!Number.isFinite(value)) {
        if (runs[runs.length - 1].length > 0) {
          runs.push([]);
        }
        return null;
      }
      const point = { x: PADDING + xScale(index), y: PADDING + yScale(value) };
      runs[runs.length - 1].push(point);
      return point;
    });
    const drawable = runs.filter((run) => run.length > 1);
    const color = this.color();

    if (this.options.showArea) {
      const baseline = this.options.height - PADDING;
      const area = drawable
        .map(
          (run) =>
            `${pointsToPath(run)} L ${run[run.length - 1].x} ${baseline} L ${run[0].x} ${baseline} Z`
        )
        .join(' ');
      if (area) {
        this.chartArea.appendChild(
          createPath(area, {
            fill: this.url('area'),
            stroke: 'none',
            className: 'cyber-sparkline__area',
          })
        );
      }
    }

    if (drawable.length > 0) {
      const pathData = drawable
        .map((run) =>
          this.options.interpolation === 'smooth' ? smoothPath(run, 0.3) : pointsToPath(run)
        )
        .join(' ');
      const line = createPath(pathData, {
        stroke: color,
        strokeWidth: this.options.lineWidth,
        className: 'cyber-sparkline__line',
      });
      this.applyGlow(line);
      if (animate) {
        this.animateLine(line, drawable);
      }
      this.chartArea.appendChild(line);
    }

    if (this.options.showMinMax) {
      const minPoint = points[this.options.data.indexOf(stats.min)];
      const maxPoint = points[this.options.data.indexOf(stats.max)];
      if (minPoint && maxPoint) {
        this.chartArea.append(
          createCircle(minPoint.x, minPoint.y, 3, {
            fill: themeColor('magenta'),
            className: 'cyber-sparkline__point cyber-sparkline__point--min',
          }),
          createCircle(maxPoint.x, maxPoint.y, 3, {
            fill: themeColor('green'),
            className: 'cyber-sparkline__point cyber-sparkline__point--max',
          })
        );
      }
    }

    const lastPoint = [...points].reverse().find((point) => point !== null);
    if (this.options.showEndPoint && lastPoint) {
      const endPoint = createCircle(lastPoint.x, lastPoint.y, 3, {
        fill: color,
        className: 'cyber-sparkline__point cyber-sparkline__point--end',
      });
      this.applyGlow(endPoint);
      if (animate) {
        const half = this.options.animationDuration / 2;
        endPoint.style.opacity = '0';
        endPoint.style.transform = 'scale(0)';
        endPoint.style.transformOrigin = `${lastPoint.x}px ${lastPoint.y}px`;
        endPoint.style.transition = `opacity ${half}ms, transform ${half}ms`;
        endPoint.style.transitionDelay = `${this.options.animationDuration}ms`;
        this.nextFrame(() => {
          endPoint.style.opacity = '1';
          endPoint.style.transform = 'scale(1)';
        });
      }
      this.chartArea.appendChild(endPoint);
    }
  }

  private animateLine(line: SVGPathElement, runs: Point[][]): void {
    let length = 0;
    for (const run of runs) {
      for (let i = 1; i < run.length; i++) {
        length += Math.hypot(run[i].x - run[i - 1].x, run[i].y - run[i - 1].y);
      }
    }
    line.style.strokeDasharray = String(length);
    line.style.strokeDashoffset = String(length);
    line.style.transition = `stroke-dashoffset ${this.options.animationDuration}ms ease-out`;
    this.nextFrame(() => {
      line.style.strokeDashoffset = '0';
    });
  }

  private summary(): string {
    const stats = statsOf(this.options.data);
    if (!stats) {
      return 'No data.';
    }
    const n = (value: number) => formatNumber(value, this.options.locale);
    return `Trend ${stats.trend} from ${n(stats.first)} to ${n(stats.last)}, min ${n(stats.min)}, max ${n(stats.max)}.`;
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update sparkline with new data.
   */
  update(data: number[]): void {
    this.options.data = data;
    this.requestEntryAnimation();
    this.render();
  }

  /**
   * Update sparkline options
   */
  setOptions(options: Partial<SparklineOptions>): void {
    this.options = { ...this.options, ...options };
    if (!this.svg) {
      return;
    }
    this.applyDimensions();
    if (options.data) {
      this.requestEntryAnimation();
    }
    this.refresh();
  }

  /**
   * Get current data
   */
  getData(): number[] {
    return [...this.options.data];
  }

  /**
   * Get statistics of the finite values
   */
  getStats(): SparklineStats {
    return statsOf(this.options.data) ?? { min: 0, max: 0, first: 0, last: 0, trend: 'flat' };
  }
}

export default Sparkline;
