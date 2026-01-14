/**
 * CyberCore Charts - Sparkline
 * Inline mini chart with cyberpunk styling
 */

import { getThemeColor } from '../utils/colors';
import { extent, createLinearScale, createInvertedScale, smoothPath } from '../utils/math';
import {
  createSVGRoot,
  createDefs,
  createGroup,
  createPath,
  createAreaPath,
  createCircle,
  createGlowFilter,
  createLinearGradient,
  pointsToPath,
  clearElement,
  svgToString,
  applyGlowFilter,
} from '../utils/svg';

import { BaseChart } from './BaseChart';

import type { GlowConfig, Point, SparklineOptions } from '../types';

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<SparklineOptions, 'data'>> = {
  width: 120,
  height: 32,
  theme: 'cyan',
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

// ============================================================================
// Sparkline Class
// ============================================================================

export class Sparkline extends BaseChart<
  Required<Omit<SparklineOptions, 'data'>> & { data: number[] },
  number[]
> {
  constructor(container: HTMLElement | string, options: SparklineOptions) {
    // Merge options with defaults before calling super
    const mergedOptions = Sparkline.mergeOptionsStatic(options);

    // Call parent constructor with merged options
    super(container, mergedOptions, { width: 120, height: 32 });

    // Validate and fix dimensions using BaseChart's method
    const dims = this.validateDimensions(this.options.width, this.options.height, 'Sparkline');
    this.options.width = dims.width;
    this.options.height = dims.height;

    // Initialize the chart
    this.init();
  }

  // ==========================================================================
  // Static Option Merging
  // ==========================================================================

  private static mergeOptionsStatic(
    options: SparklineOptions
  ): Required<Omit<SparklineOptions, 'data'>> & { data: number[] } {
    return {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  // ==========================================================================
  // Instance Option Merging (for setOptions)
  // ==========================================================================

  private mergeOptions(
    options: SparklineOptions
  ): Required<Omit<SparklineOptions, 'data'>> & { data: number[] } {
    return Sparkline.mergeOptionsStatic(options);
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private init(): void {
    clearElement(this.container);
    this.createSVG();
    this.createDefinitions();
    this.render();
  }

  private createSVG(): void {
    this.svg = createSVGRoot(this.options.width, this.options.height, {
      classPrefix: 'cyber-sparkline',
    });

    // Make SVG inline-friendly
    this.svg.style.display = 'inline-block';
    this.svg.style.verticalAlign = 'middle';

    this.container.appendChild(this.svg);
  }

  /**
   * Creates SVG definitions (filters, gradients, patterns).
   * Implements the abstract method from BaseChart.
   */
  protected createDefinitions(): void {
    if (!this.svg) {
      return;
    }

    this.defs = createDefs();
    this.svg.appendChild(this.defs);

    const theme = this.options.theme;
    const color = this.options.color || getThemeColor(theme);

    // Create glow filter
    if (this.options.glow) {
      const glowConfig: GlowConfig = { enabled: true, intensity: 0.8, blur: 3 };
      const filter = createGlowFilter(`sparkline-glow-${theme}`, theme, glowConfig);
      this.defs.appendChild(filter);
    }

    // Create area gradient
    if (this.options.showArea) {
      const gradient = createLinearGradient('sparkline-area-gradient', [
        { offset: '0%', color, opacity: this.options.areaOpacity },
        { offset: '100%', color, opacity: 0 },
      ]);
      this.defs.appendChild(gradient);
    }
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  /**
   * Renders the chart.
   * Implements the abstract method from BaseChart.
   */
  render(): void {
    if (!this.svg) {
      return;
    }

    // Remove existing content (except defs)
    const existingGroup = this.svg.querySelector('.cyber-sparkline__content');
    if (existingGroup) {
      this.svg.removeChild(existingGroup);
    }

    const group = createGroup('cyber-sparkline__content');
    this.svg.appendChild(group);

    if (this.options.data.length < 2) {
      return; // Not enough data to draw
    }

    const padding = 4;
    const chartWidth = this.options.width - padding * 2;
    const chartHeight = this.options.height - padding * 2;

    // Calculate scales
    const [minVal, maxVal] = extent(this.options.data);
    const yPadding = (maxVal - minVal) * 0.1 || 1;

    const xScale = createLinearScale(0, this.options.data.length - 1, 0, chartWidth);
    const yScale = createInvertedScale(minVal - yPadding, maxVal + yPadding, 0, chartHeight);

    // Convert data to points
    const points: Point[] = this.options.data.map((value, index) => ({
      x: padding + xScale(index),
      y: padding + yScale(value),
    }));

    const theme = this.options.theme;
    const color = this.options.color || getThemeColor(theme);

    // Render area fill
    if (this.options.showArea) {
      const areaPath = createAreaPath(points, this.options.height - padding, {
        fill: 'url(#sparkline-area-gradient)',
        className: 'cyber-sparkline__area',
      });
      group.appendChild(areaPath);
    }

    // Render line
    let pathData: string;
    if (this.options.interpolation === 'smooth') {
      pathData = smoothPath(points, 0.3);
    } else {
      pathData = pointsToPath(points);
    }

    const linePath = createPath(pathData, {
      stroke: color,
      strokeWidth: this.options.lineWidth,
      className: 'cyber-sparkline__line',
    });

    if (this.options.glow) {
      applyGlowFilter(linePath, `sparkline-glow-${theme}`);
    }

    // Add draw animation
    if (this.shouldAnimate()) {
      const length = this.approximatePathLength(points);
      linePath.style.strokeDasharray = String(length);
      linePath.style.strokeDashoffset = String(length);
      linePath.style.transition = `stroke-dashoffset ${this.options.animationDuration}ms ease-out`;

      requestAnimationFrame(() => {
        linePath.style.strokeDashoffset = '0';
      });
    }

    group.appendChild(linePath);

    // Render min/max points
    if (this.options.showMinMax) {
      const minIndex = this.options.data.indexOf(minVal);
      const maxIndex = this.options.data.indexOf(maxVal);

      // Min point
      const minPoint = createCircle(points[minIndex].x, points[minIndex].y, 3, {
        fill: getThemeColor('magenta'),
        className: 'cyber-sparkline__point cyber-sparkline__point--min',
      });
      group.appendChild(minPoint);

      // Max point
      const maxPoint = createCircle(points[maxIndex].x, points[maxIndex].y, 3, {
        fill: getThemeColor('green'),
        className: 'cyber-sparkline__point cyber-sparkline__point--max',
      });
      group.appendChild(maxPoint);
    }

    // Render end point
    if (this.options.showEndPoint) {
      const lastPoint = points[points.length - 1];
      const endPoint = createCircle(lastPoint.x, lastPoint.y, 3, {
        fill: color,
        className: 'cyber-sparkline__point cyber-sparkline__point--end',
      });

      if (this.options.glow) {
        applyGlowFilter(endPoint, `sparkline-glow-${theme}`);
      }

      // Animate end point
      if (this.shouldAnimate()) {
        endPoint.style.opacity = '0';
        endPoint.style.transform = 'scale(0)';
        endPoint.style.transformOrigin = `${lastPoint.x}px ${lastPoint.y}px`;
        endPoint.style.transition = `opacity ${this.options.animationDuration / 2}ms, transform ${this.options.animationDuration / 2}ms`;
        endPoint.style.transitionDelay = `${this.options.animationDuration}ms`;

        requestAnimationFrame(() => {
          endPoint.style.opacity = '1';
          endPoint.style.transform = 'scale(1)';
        });
      }

      group.appendChild(endPoint);
    }
  }

  private approximatePathLength(points: Point[]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update sparkline with new data.
   * Implements the abstract method from BaseChart.
   */
  update(data: number[]): void {
    this.options.data = data;
    this.render();
  }

  /**
   * Update sparkline options
   */
  setOptions(options: Partial<SparklineOptions>): void {
    this.options = this.mergeOptions({ ...this.options, ...options });

    if (this.defs) {
      clearElement(this.defs);
      this.createDefinitions();
    }

    this.render();
  }

  /**
   * Resize sparkline.
   * Implements the abstract method from BaseChart.
   */
  resize(width?: number, height?: number): void {
    if (width) {
      this.options.width = width;
    }
    if (height) {
      this.options.height = height;
    }

    // Use inherited helper to update SVG dimensions
    this.updateSVGDimensions(this.options.width, this.options.height);

    this.render();
  }

  /**
   * Destroy sparkline and clean up.
   * Overrides BaseChart's destroy to handle any Sparkline-specific cleanup.
   */
  override destroy(): void {
    // Call parent destroy to clean up base resources
    super.destroy();
  }

  /**
   * Export as SVG string
   */
  override toSVG(): string {
    if (!this.svg) {
      throw new Error('Sparkline not initialized');
    }
    return svgToString(this.svg);
  }

  /**
   * Get current data
   */
  getData(): number[] {
    return [...this.options.data];
  }

  /**
   * Get data statistics
   */
  getStats(): {
    min: number;
    max: number;
    first: number;
    last: number;
    trend: 'up' | 'down' | 'flat';
  } {
    const data = this.options.data;
    if (data.length === 0) {
      return { min: 0, max: 0, first: 0, last: 0, trend: 'flat' };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const first = data[0];
    const last = data[data.length - 1];

    let trend: 'up' | 'down' | 'flat' = 'flat';
    if (last > first) {
      trend = 'up';
    } else if (last < first) {
      trend = 'down';
    }

    return { min, max, first, last, trend };
  }
}

export default Sparkline;
