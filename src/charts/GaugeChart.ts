/**
 * CyberCore Charts - Gauge Chart
 * Radial gauge with cyberpunk styling and threshold zones
 */

import { CHART_THEMES, chartColors, getThemeColor, hexToRGBA } from '../utils/colors';
import { degToRad, lerp, clamp } from '../utils/math';
import { ResponsiveManager } from '../utils/ResponsiveManager';
import {
  createSVGRoot,
  createDefs,
  createGroup,
  createPath,
  createCircle,
  createText,
  createLine,
  createGlowFilter,
  createLinearGradient,
  describeArc,
  clearElement,
  applyGlowFilter,
} from '../utils/svg';

import { BaseChart } from './BaseChart';

import type { GaugeChartOptions } from '../types';

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<GaugeChartOptions, 'value'>> = {
  width: 300,
  height: 300,
  padding: { top: 20, right: 20, bottom: 20, left: 20 },
  theme: 'cyan',
  animate: true,
  animation: {
    enabled: true,
    duration: 1500,
    easing: 'easeOutCubic',
    delay: 0,
    stagger: 0,
  },
  tooltip: {
    enabled: false,
  },
  glow: true,
  scanlines: false,
  classPrefix: 'cyber-chart',
  responsive: false,
  ariaLabel: 'Gauge chart',
  min: 0,
  max: 100,
  startAngle: -135,
  endAngle: 135,
  thickness: 20,
  showValue: true,
  formatValue: (value: number) => String(Math.round(value)),
  showMinMax: true,
  label: '',
  thresholds: [],
  showTicks: true,
  tickCount: 10,
};

// ============================================================================
// GaugeChart Class
// ============================================================================

export class GaugeChart extends BaseChart<
  Required<Omit<GaugeChartOptions, 'value'>> & { value: number },
  number
> {
  private currentValue: number = 0;
  private targetValue: number = 0;
  private responsiveManager: ResponsiveManager | null = null;

  // Cached elements for optimized animation updates
  private valueArcElement: SVGPathElement | null = null;
  private indicatorElement: SVGCircleElement | null = null;
  private valueTextElement: SVGTextElement | null = null;
  private staticElementsGroup: SVGGElement | null = null;
  private dynamicElementsGroup: SVGGElement | null = null;

  constructor(container: HTMLElement | string, options: GaugeChartOptions) {
    // Create merged options first, then pass to super
    const mergedOptions = GaugeChart.mergeOptionsStatic(options);
    super(container, mergedOptions, { width: 300, height: 300 });

    // Validate and apply dimensions
    const { width, height } = this.validateDimensions(
      this.options.width,
      this.options.height,
      'GaugeChart'
    );
    this.options.width = width;
    this.options.height = height;

    // Validate min/max range to avoid division by zero
    if (this.options.min === this.options.max) {
      console.warn('GaugeChart: min and max are equal, adjusting range');
      this.options.max = this.options.min + 100;
    }
    if (!isFinite(this.options.min) || !isFinite(this.options.max)) {
      console.warn('GaugeChart: Invalid min/max values, using defaults (0-100)');
      this.options.min = 0;
      this.options.max = 100;
    }

    this.currentValue = this.options.min;
    this.targetValue = this.options.value;
    this.init();
  }

  // ==========================================================================
  // Static Option Merging
  // ==========================================================================

  private static mergeOptionsStatic(
    options: GaugeChartOptions
  ): Required<Omit<GaugeChartOptions, 'value'>> & { value: number } {
    const merged = {
      ...DEFAULT_OPTIONS,
      ...options,
      padding: { ...DEFAULT_OPTIONS.padding, ...options.padding },
      animation: { ...DEFAULT_OPTIONS.animation, ...options.animation },
      tooltip: { ...DEFAULT_OPTIONS.tooltip, ...options.tooltip },
    };

    if (typeof options.glow === 'boolean') {
      merged.glow = options.glow;
    } else if (options.glow) {
      merged.glow = { enabled: true, ...options.glow };
    }

    return merged as Required<Omit<GaugeChartOptions, 'value'>> & { value: number };
  }

  private mergeOptions(
    options: GaugeChartOptions
  ): Required<Omit<GaugeChartOptions, 'value'>> & { value: number } {
    return GaugeChart.mergeOptionsStatic(options);
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private init(): void {
    clearElement(this.container);
    this.createSVG();
    this.createDefinitions();
    this.render();

    if (this.shouldAnimate()) {
      this.animateToValue(this.targetValue);
    } else {
      this.currentValue = this.targetValue;
    }

    if (this.options.responsive) {
      this.responsiveManager = new ResponsiveManager(
        this.container,
        (width, height) => {
          const size = Math.min(width, height);
          this.resize(size, size);
        },
        true
      );
      this.responsiveManager.setup();
    }
  }

  private createSVG(): void {
    this.svg = createSVGRoot(this.options.width, this.options.height, {
      classPrefix: `${this.options.classPrefix} ${this.options.classPrefix}--gauge`,
      ariaLabel: this.options.ariaLabel,
    });
    this.container.appendChild(this.svg);
  }

  protected createDefinitions(): void {
    if (!this.svg) {
      return;
    }

    this.defs = createDefs();
    this.svg.appendChild(this.defs);

    // Create glow filters for each theme
    CHART_THEMES.forEach((theme) => {
      const glowConfig = typeof this.options.glow === 'object' ? this.options.glow : {};
      const filter = createGlowFilter(`glow-${theme}`, theme, glowConfig);
      this.defs!.appendChild(filter);
    });

    // Create gradient for main arc
    const theme = this.options.theme;
    const color = getThemeColor(theme);
    const lightColor = getThemeColor(theme, 400);

    const gradient = createLinearGradient('gauge-gradient', [
      { offset: '0%', color: lightColor },
      { offset: '100%', color },
    ]);
    this.defs.appendChild(gradient);

    // Create track gradient (dark)
    const trackGradient = createLinearGradient('gauge-track-gradient', [
      { offset: '0%', color: chartColors.background, opacity: 0.5 },
      { offset: '100%', color: chartColors.background, opacity: 0.8 },
    ]);
    this.defs.appendChild(trackGradient);
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  render(): void {
    if (!this.svg) {
      return;
    }

    if (this.chartArea) {
      this.svg.removeChild(this.chartArea);
    }

    this.chartArea = createGroup(`${this.options.classPrefix}__area`);
    this.svg.appendChild(this.chartArea);

    // Create separate groups for static and dynamic elements
    this.staticElementsGroup = createGroup(`${this.options.classPrefix}__static`);
    this.dynamicElementsGroup = createGroup(`${this.options.classPrefix}__dynamic`);

    const centerX = this.options.width / 2;
    const centerY = this.options.height / 2;
    const padding = Math.max(
      this.options.padding.top!,
      this.options.padding.right!,
      this.options.padding.bottom!,
      this.options.padding.left!
    );
    const outerRadius = Math.min(centerX, centerY) - padding;
    const innerRadius = outerRadius - this.options.thickness;

    // Render static elements (only need to render once)
    // Render background track
    this.renderTrack(centerX, centerY, outerRadius);

    // Render threshold zones
    if (this.options.thresholds.length > 0) {
      this.renderThresholds(centerX, centerY, outerRadius, innerRadius);
    }

    // Render ticks
    if (this.options.showTicks) {
      this.renderTicks(centerX, centerY, outerRadius);
    }

    // Render min/max labels
    if (this.options.showMinMax) {
      this.renderMinMaxLabels(centerX, centerY, outerRadius);
    }

    // Render label
    if (this.options.label) {
      this.renderLabel(centerX, centerY);
    }

    // Add static elements group first (background)
    this.chartArea.appendChild(this.staticElementsGroup);

    // Render dynamic elements (value arc, indicator, center value)
    this.renderValueArc(centerX, centerY, outerRadius);

    // Render center value
    if (this.options.showValue) {
      this.renderCenterValue(centerX, centerY);
    }

    // Add dynamic elements group on top
    this.chartArea.appendChild(this.dynamicElementsGroup);
  }

  /**
   * Optimized update for animation - only updates dynamic elements
   * instead of re-rendering the entire chart
   */
  private updateDynamicElements(): void {
    if (!this.svg || !this.dynamicElementsGroup) {
      // Fall back to full render if groups aren't set up
      this.render();
      return;
    }

    const centerX = this.options.width / 2;
    const centerY = this.options.height / 2;
    const padding = Math.max(
      this.options.padding.top!,
      this.options.padding.right!,
      this.options.padding.bottom!,
      this.options.padding.left!
    );
    const outerRadius = Math.min(centerX, centerY) - padding;

    // Calculate arc parameters
    const range = this.options.max - this.options.min;
    const progress = range === 0 ? 0 : clamp((this.currentValue - this.options.min) / range, 0, 1);
    const endAngle = lerp(this.options.startAngle, this.options.endAngle, progress);

    // Determine color based on thresholds
    let arcColor = getThemeColor(this.options.theme);
    let arcTheme = this.options.theme;

    for (const threshold of this.options.thresholds) {
      if (this.currentValue >= threshold.value) {
        arcTheme = threshold.theme || this.options.theme;
        arcColor = threshold.color || getThemeColor(arcTheme);
      }
    }

    // Update value arc path
    if (this.valueArcElement) {
      const arcPath = describeArc(centerX, centerY, outerRadius, this.options.startAngle, endAngle);
      this.valueArcElement.setAttribute('d', arcPath);
      this.valueArcElement.setAttribute('stroke', arcColor);
      if (this.options.glow) {
        applyGlowFilter(this.valueArcElement, `glow-${arcTheme}`);
      }
    }

    // Update indicator position
    if (this.indicatorElement) {
      const indicatorAngle = degToRad(endAngle - 90);
      const indicatorX = centerX + outerRadius * Math.cos(indicatorAngle);
      const indicatorY = centerY + outerRadius * Math.sin(indicatorAngle);
      this.indicatorElement.setAttribute('cx', String(indicatorX));
      this.indicatorElement.setAttribute('cy', String(indicatorY));
      this.indicatorElement.setAttribute('fill', arcColor);
      if (this.options.glow) {
        applyGlowFilter(this.indicatorElement, `glow-${arcTheme}`);
      }
    }

    // Update center value text
    if (this.valueTextElement && this.options.showValue) {
      this.valueTextElement.textContent = this.options.formatValue(this.currentValue);
      this.valueTextElement.setAttribute('fill', arcColor);
    }
  }

  private renderTrack(centerX: number, centerY: number, radius: number): void {
    if (!this.staticElementsGroup) {
      return;
    }

    const trackPath = describeArc(
      centerX,
      centerY,
      radius,
      this.options.startAngle,
      this.options.endAngle
    );

    const track = createPath(trackPath, {
      stroke: chartColors.grid,
      strokeWidth: this.options.thickness,
      strokeLinecap: 'round',
      className: `${this.options.classPrefix}__track`,
    });

    this.staticElementsGroup.appendChild(track);
  }

  private renderThresholds(
    centerX: number,
    centerY: number,
    outerRadius: number,
    _innerRadius: number
  ): void {
    if (!this.staticElementsGroup) {
      return;
    }

    const thresholdGroup = createGroup(`${this.options.classPrefix}__thresholds`);
    const sortedThresholds = [...this.options.thresholds].sort((a, b) => a.value - b.value);

    let prevAngle = this.options.startAngle;

    // Guard against division by zero when min === max
    const range = this.options.max - this.options.min;

    sortedThresholds.forEach((threshold, index) => {
      const progress = range === 0 ? 0 : (threshold.value - this.options.min) / range;
      const angle = lerp(this.options.startAngle, this.options.endAngle, progress);

      const thresholdTheme = threshold.theme || this.options.theme;
      const thresholdColor = threshold.color || getThemeColor(thresholdTheme, 700);

      const thresholdPath = describeArc(
        centerX,
        centerY,
        outerRadius - this.options.thickness / 2,
        prevAngle,
        angle
      );

      const segment = createPath(thresholdPath, {
        stroke: hexToRGBA(thresholdColor, 0.3),
        strokeWidth: this.options.thickness,
        strokeLinecap: index === sortedThresholds.length - 1 ? 'round' : 'butt',
        className: `${this.options.classPrefix}__threshold`,
      });

      thresholdGroup.appendChild(segment);
      prevAngle = angle;
    });

    this.staticElementsGroup.appendChild(thresholdGroup);
  }

  private renderValueArc(centerX: number, centerY: number, radius: number): void {
    if (!this.dynamicElementsGroup) {
      return;
    }

    // Guard against division by zero when min === max
    const range = this.options.max - this.options.min;
    const progress = range === 0 ? 0 : clamp((this.currentValue - this.options.min) / range, 0, 1);
    const endAngle = lerp(this.options.startAngle, this.options.endAngle, progress);

    // Determine color based on thresholds
    let arcColor = getThemeColor(this.options.theme);
    let arcTheme = this.options.theme;

    for (const threshold of this.options.thresholds) {
      if (this.currentValue >= threshold.value) {
        arcTheme = threshold.theme || this.options.theme;
        arcColor = threshold.color || getThemeColor(arcTheme);
      }
    }

    const arcPath = describeArc(centerX, centerY, radius, this.options.startAngle, endAngle);

    const arc = createPath(arcPath, {
      stroke: arcColor,
      strokeWidth: this.options.thickness,
      strokeLinecap: 'round',
      className: `${this.options.classPrefix}__value-arc`,
    });

    if (this.options.glow) {
      applyGlowFilter(arc, `glow-${arcTheme}`);
    }

    // Store reference for optimized updates
    this.valueArcElement = arc;
    this.dynamicElementsGroup.appendChild(arc);

    // Add needle/indicator at the end
    const indicatorAngle = degToRad(endAngle - 90);
    const indicatorX = centerX + radius * Math.cos(indicatorAngle);
    const indicatorY = centerY + radius * Math.sin(indicatorAngle);

    const indicator = createCircle(indicatorX, indicatorY, this.options.thickness / 2 + 2, {
      fill: arcColor,
      className: `${this.options.classPrefix}__indicator`,
    });

    if (this.options.glow) {
      applyGlowFilter(indicator, `glow-${arcTheme}`);
    }

    // Store reference for optimized updates
    this.indicatorElement = indicator;
    this.dynamicElementsGroup.appendChild(indicator);
  }

  private renderTicks(centerX: number, centerY: number, outerRadius: number): void {
    if (!this.staticElementsGroup) {
      return;
    }

    const tickGroup = createGroup(`${this.options.classPrefix}__ticks`);
    const tickLength = 8;
    const tickRadius = outerRadius + 5;

    for (let i = 0; i <= this.options.tickCount; i++) {
      const progress = i / this.options.tickCount;
      const angle = lerp(this.options.startAngle, this.options.endAngle, progress);
      const angleRad = degToRad(angle - 90);

      const x1 = centerX + tickRadius * Math.cos(angleRad);
      const y1 = centerY + tickRadius * Math.sin(angleRad);
      const x2 = centerX + (tickRadius + tickLength) * Math.cos(angleRad);
      const y2 = centerY + (tickRadius + tickLength) * Math.sin(angleRad);

      const tick = createLine(x1, y1, x2, y2, {
        stroke: chartColors.axis,
        strokeWidth: i % 5 === 0 ? 2 : 1,
        className: `${this.options.classPrefix}__tick`,
      });

      tickGroup.appendChild(tick);

      // Add tick label for major ticks
      if (i % 5 === 0) {
        const value = lerp(this.options.min, this.options.max, progress);
        const labelRadius = tickRadius + tickLength + 12;
        const labelX = centerX + labelRadius * Math.cos(angleRad);
        const labelY = centerY + labelRadius * Math.sin(angleRad);

        const label = createText(labelX, labelY, String(Math.round(value)), {
          fill: chartColors.textMuted,
          fontSize: 10,
          className: `${this.options.classPrefix}__tick-label`,
        });

        tickGroup.appendChild(label);
      }
    }

    this.staticElementsGroup.appendChild(tickGroup);
  }

  private renderCenterValue(centerX: number, centerY: number): void {
    if (!this.dynamicElementsGroup) {
      return;
    }

    // Determine color based on thresholds
    let valueColor = getThemeColor(this.options.theme);
    for (const threshold of this.options.thresholds) {
      if (this.currentValue >= threshold.value) {
        valueColor = threshold.color || getThemeColor(threshold.theme || this.options.theme);
      }
    }

    const valueText = createText(centerX, centerY, this.options.formatValue(this.currentValue), {
      fill: valueColor,
      fontSize: 36,
      fontWeight: 'bold',
      className: `${this.options.classPrefix}__value-text`,
    });

    // Store reference for optimized updates
    this.valueTextElement = valueText;
    this.dynamicElementsGroup.appendChild(valueText);
  }

  private renderMinMaxLabels(centerX: number, centerY: number, radius: number): void {
    if (!this.staticElementsGroup) {
      return;
    }

    const labelRadius = radius - this.options.thickness - 15;

    // Min label
    const minAngle = degToRad(this.options.startAngle - 90);
    const minX = centerX + labelRadius * Math.cos(minAngle);
    const minY = centerY + labelRadius * Math.sin(minAngle);

    const minLabel = createText(minX, minY, String(this.options.min), {
      fill: chartColors.textMuted,
      fontSize: 12,
      className: `${this.options.classPrefix}__min-label`,
    });
    this.staticElementsGroup.appendChild(minLabel);

    // Max label
    const maxAngle = degToRad(this.options.endAngle - 90);
    const maxX = centerX + labelRadius * Math.cos(maxAngle);
    const maxY = centerY + labelRadius * Math.sin(maxAngle);

    const maxLabel = createText(maxX, maxY, String(this.options.max), {
      fill: chartColors.textMuted,
      fontSize: 12,
      className: `${this.options.classPrefix}__max-label`,
    });
    this.staticElementsGroup.appendChild(maxLabel);
  }

  private renderLabel(centerX: number, centerY: number): void {
    if (!this.staticElementsGroup) {
      return;
    }

    const label = createText(centerX, centerY + 30, this.options.label, {
      fill: chartColors.text,
      fontSize: 14,
      className: `${this.options.classPrefix}__label`,
    });

    this.staticElementsGroup.appendChild(label);
  }

  // ==========================================================================
  // Animation
  // ==========================================================================

  private animateToValue(targetValue: number): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const startValue = this.currentValue;
    const startTime = performance.now();
    const duration = this.options.animation.duration!;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing
      const easedProgress = this.easeOutCubic(progress);
      this.currentValue = lerp(startValue, targetValue, easedProgress);

      // Use optimized update instead of full render
      this.updateDynamicElements();

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update gauge value
   */
  update(value: number): void {
    this.options.value = value;
    this.targetValue = value;

    if (this.shouldAnimate()) {
      this.animateToValue(value);
    } else {
      this.currentValue = value;
      this.render();
    }
  }

  /**
   * Update chart options
   */
  setOptions(options: Partial<GaugeChartOptions>): void {
    this.options = this.mergeOptions({ ...this.options, ...options });

    if (this.defs) {
      clearElement(this.defs);
      this.createDefinitions();
    }

    if (options.value !== undefined) {
      this.targetValue = options.value;
      if (this.shouldAnimate()) {
        this.animateToValue(options.value);
      } else {
        this.currentValue = options.value;
        this.render();
      }
    } else {
      this.render();
    }
  }

  /**
   * Resize chart
   */
  resize(width?: number, height?: number): void {
    if (width) {
      this.options.width = width;
    }
    if (height) {
      this.options.height = height;
    }

    this.updateSVGDimensions(this.options.width, this.options.height);

    this.render();
    this.emit('resize', {
      type: 'resize',
      target: null,
      data: { width: this.options.width, height: this.options.height },
    });
  }

  /**
   * Destroy chart and clean up
   */
  override destroy(): void {
    // Cancel gauge-specific animation frame first
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Clean up ResponsiveManager
    if (this.responsiveManager) {
      this.responsiveManager.destroy();
      this.responsiveManager = null;
    }

    // Clear cached element references
    this.valueArcElement = null;
    this.indicatorElement = null;
    this.valueTextElement = null;
    this.staticElementsGroup = null;
    this.dynamicElementsGroup = null;

    // Call parent destroy for common cleanup
    super.destroy();
  }

  /**
   * Get current value
   */
  getValue(): number {
    return this.currentValue;
  }
}

export default GaugeChart;
