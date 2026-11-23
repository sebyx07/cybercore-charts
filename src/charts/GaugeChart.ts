/**
 * CyberCore Charts - Gauge Chart
 * Radial gauge with cyberpunk styling and threshold zones
 */

import { formatNumber } from '../utils/format';
import { clamp, degToRad, getEasing, lerp } from '../utils/math';
import {
  createCircle,
  createGroup,
  createLine,
  createPath,
  createText,
  describeArc,
} from '../utils/svg';
import { themeColor, uiColors } from '../utils/theme';

import { BaseChart } from './BaseChart';

import type { GaugeChartOptions } from '../types';
import type { UndefaultedOptionKeys } from './series';

// ============================================================================
// Types and Defaults
// ============================================================================

type GaugeDefaults = Required<Omit<GaugeChartOptions, 'value' | UndefaultedOptionKeys>>;
type ResolvedGaugeOptions = GaugeDefaults & GaugeChartOptions;

interface GaugeGeometry {
  centerX: number;
  centerY: number;
  radius: number;
}

/** Tick marks sit outside the arc: gap, tick, gap to the label, then the label itself */
const TICK_GAP = 5;
const TICK_LENGTH = 8;
const TICK_LABEL_OFFSET = 12;
const TICK_LABEL_SIZE = 10;
/** How far past the radius the tick labels reach, a full line of text included for the glyphs' ascent */
const TICK_LABEL_EXTENT = TICK_GAP + TICK_LENGTH + TICK_LABEL_OFFSET + TICK_LABEL_SIZE;

const DEFAULT_OPTIONS: GaugeDefaults = {
  width: 300,
  height: 300,
  padding: { top: 20, right: 20, bottom: 20, left: 20 },
  theme: 'accent',
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
  dataTable: false,
  keyboard: false,
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

export class GaugeChart extends BaseChart<ResolvedGaugeOptions, number> {
  private currentValue: number = 0;
  private targetValue: number = 0;

  // Cached elements for animation frames, which only move the value
  private valueArcElement: SVGPathElement | null = null;
  private indicatorElement: SVGCircleElement | null = null;
  private valueTextElement: SVGTextElement | null = null;

  constructor(container: HTMLElement | string, options: GaugeChartOptions) {
    super(container, GaugeChart.mergeOptions(options), { width: 300, height: 300 });
    this.validateOptions();
    this.currentValue = this.options.min;
    this.targetValue = this.sanitizeValue(this.options.value);

    this.createRoot(
      `${this.options.classPrefix} ${this.options.classPrefix}--gauge`,
      this.options.width,
      this.options.height
    );
    this.createDefinitions();
    this.render();
    this.showValue(this.targetValue);
    this.syncResponsive();
  }

  // ==========================================================================
  // Options
  // ==========================================================================

  private static mergeOptions(options: GaugeChartOptions): ResolvedGaugeOptions {
    const merged: ResolvedGaugeOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      padding: { ...DEFAULT_OPTIONS.padding, ...options.padding },
      animation: { ...DEFAULT_OPTIONS.animation, ...options.animation },
      tooltip: { ...DEFAULT_OPTIONS.tooltip, ...options.tooltip },
    };
    if (typeof options.glow === 'object') {
      merged.glow = { enabled: true, ...options.glow };
    }
    return merged;
  }

  private validateOptions(): void {
    const dims = this.validateDimensions(this.options.width, this.options.height, 'GaugeChart');
    this.options.width = dims.width;
    this.options.height = dims.height;

    if (!isFinite(this.options.min) || !isFinite(this.options.max)) {
      console.warn('GaugeChart: Invalid min/max values, using defaults (0-100)');
      this.options.min = 0;
      this.options.max = 100;
    }
    if (this.options.min === this.options.max) {
      console.warn('GaugeChart: min and max are equal, adjusting range');
      this.options.max = this.options.min + 100;
    }
  }

  /** Non-finite values render as the minimum */
  private sanitizeValue(value: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      console.warn(`GaugeChart: Invalid value (${value}), showing the minimum`);
      return this.options.min;
    }
    return value;
  }

  // ==========================================================================
  // Definitions
  // ==========================================================================

  protected createDefinitions(): void {
    this.addEffectDefinitions(this.options.glow);
  }

  // ==========================================================================
  // Geometry
  // ==========================================================================

  private geometry(): GaugeGeometry {
    const centerX = this.options.width / 2;
    const centerY = this.options.height / 2;
    const padding = Math.max(
      this.options.padding.top ?? 0,
      this.options.padding.right ?? 0,
      this.options.padding.bottom ?? 0,
      this.options.padding.left ?? 0
    );
    // Tick labels are drawn outside the arc, so they need at least their own room
    const inset = this.options.showTicks ? Math.max(padding, TICK_LABEL_EXTENT) : padding;
    return { centerX, centerY, radius: Math.max(0, Math.min(centerX, centerY) - inset) };
  }

  /** Value and label font sizes: full size on a large gauge, scaled down on a small one */
  private textSizes(radius: number): { value: number; label: number } {
    return { value: clamp(radius * 0.4, 14, 36), label: clamp(radius * 0.16, 10, 14) };
  }

  private angleFor(value: number): number {
    const { min, max, startAngle, endAngle } = this.options;
    return lerp(startAngle, endAngle, clamp((value - min) / (max - min), 0, 1));
  }

  /** Arc colour: the last threshold reached, else the theme */
  private colorFor(value: number): string {
    let color = themeColor(this.options.theme);
    for (const threshold of [...this.options.thresholds].sort((a, b) => a.value - b.value)) {
      if (value >= threshold.value) {
        color = threshold.color || themeColor(threshold.theme ?? this.options.theme);
      }
    }
    return color;
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  render(): void {
    if (!this.svg) {
      return;
    }
    this.chartArea?.remove();
    const prefix = this.options.classPrefix;
    this.chartArea = createGroup(`${prefix}__area`);
    this.svg.appendChild(this.chartArea);

    const geometry = this.geometry();
    const staticGroup = createGroup(`${prefix}__static`);
    staticGroup.setAttribute('aria-hidden', 'true');
    this.renderTrack(staticGroup, geometry);
    if (this.options.thresholds.length > 0) {
      this.renderThresholds(staticGroup, geometry);
    }
    if (this.options.showTicks) {
      this.renderTicks(staticGroup, geometry);
    }
    const text = this.textSizes(geometry.radius);
    if (this.options.showMinMax) {
      this.renderMinMaxLabels(staticGroup, geometry, text.value);
    }
    if (this.options.label) {
      // Under the value, clear of it at every size
      const below = this.options.showValue ? text.value / 2 + text.label / 2 + 5 : 0;
      staticGroup.appendChild(
        createText(geometry.centerX, geometry.centerY + below, this.options.label, {
          fill: uiColors.text,
          fontSize: text.label,
          className: `${prefix}__label`,
        })
      );
    }
    this.chartArea.appendChild(staticGroup);

    const dynamicGroup = createGroup(`${prefix}__dynamic`);
    dynamicGroup.setAttribute('aria-hidden', 'true');
    this.valueArcElement = createPath('', {
      strokeWidth: this.options.thickness,
      strokeLinecap: 'round',
      className: `${prefix}__value-arc`,
    });
    this.indicatorElement = createCircle(0, 0, this.options.thickness / 2 + 2, {
      className: `${prefix}__indicator`,
    });
    this.applyGlow(this.valueArcElement);
    this.applyGlow(this.indicatorElement);
    dynamicGroup.append(this.valueArcElement, this.indicatorElement);
    this.valueTextElement = this.options.showValue
      ? createText(geometry.centerX, geometry.centerY, '', {
          fontSize: text.value,
          fontWeight: 'bold',
          className: `${prefix}__value-text`,
        })
      : null;
    if (this.valueTextElement) {
      dynamicGroup.appendChild(this.valueTextElement);
    }
    this.chartArea.appendChild(dynamicGroup);

    this.drawValue();
    this.updateAccessibility(this.options.label || 'Gauge chart', this.summary());
    this.updateMeter();
  }

  /** Moves the value arc, indicator and readout to `currentValue` */
  private drawValue(): void {
    const { centerX, centerY, radius } = this.geometry();
    const endAngle = this.angleFor(this.currentValue);
    const color = this.colorFor(this.currentValue);

    if (this.valueArcElement) {
      this.valueArcElement.setAttribute(
        'd',
        describeArc(centerX, centerY, radius, this.options.startAngle, endAngle)
      );
      this.valueArcElement.style.setProperty('stroke', color);
    }
    if (this.indicatorElement) {
      const angle = degToRad(endAngle - 90);
      this.indicatorElement.setAttribute('cx', String(centerX + radius * Math.cos(angle)));
      this.indicatorElement.setAttribute('cy', String(centerY + radius * Math.sin(angle)));
      this.indicatorElement.style.setProperty('fill', color);
    }
    if (this.valueTextElement) {
      this.valueTextElement.textContent = this.options.formatValue(this.currentValue);
      this.valueTextElement.style.setProperty('fill', color);
    }
  }

  private renderTrack(group: SVGGElement, { centerX, centerY, radius }: GaugeGeometry): void {
    group.appendChild(
      createPath(
        describeArc(centerX, centerY, radius, this.options.startAngle, this.options.endAngle),
        {
          stroke: uiColors.grid,
          strokeWidth: this.options.thickness,
          strokeLinecap: 'round',
          className: `${this.options.classPrefix}__track`,
        }
      )
    );
  }

  private renderThresholds(group: SVGGElement, { centerX, centerY, radius }: GaugeGeometry): void {
    const thresholdGroup = createGroup(`${this.options.classPrefix}__thresholds`);
    const sorted = [...this.options.thresholds].sort((a, b) => a.value - b.value);
    let previous = this.options.startAngle;

    sorted.forEach((threshold, index) => {
      const angle = this.angleFor(threshold.value);
      const zone = createPath(describeArc(centerX, centerY, radius, previous, angle), {
        stroke: threshold.color || themeColor(threshold.theme ?? this.options.theme, 'dark'),
        strokeWidth: this.options.thickness,
        strokeLinecap: index === sorted.length - 1 ? 'round' : 'butt',
        opacity: 0.3,
        className: `${this.options.classPrefix}__threshold`,
      });
      thresholdGroup.appendChild(zone);
      previous = angle;
    });

    group.appendChild(thresholdGroup);
  }

  private renderTicks(group: SVGGElement, { centerX, centerY, radius }: GaugeGeometry): void {
    const tickGroup = createGroup(`${this.options.classPrefix}__ticks`);
    const tickRadius = radius + TICK_GAP;
    const count = Math.max(1, this.options.tickCount);

    for (let i = 0; i <= count; i++) {
      const progress = i / count;
      const angleRad = degToRad(
        lerp(this.options.startAngle, this.options.endAngle, progress) - 90
      );
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      const major = i % 5 === 0;
      tickGroup.appendChild(
        createLine(
          centerX + tickRadius * cos,
          centerY + tickRadius * sin,
          centerX + (tickRadius + TICK_LENGTH) * cos,
          centerY + (tickRadius + TICK_LENGTH) * sin,
          {
            stroke: uiColors.axis,
            strokeWidth: major ? 2 : 1,
            className: `${this.options.classPrefix}__tick`,
          }
        )
      );
      if (major) {
        const labelRadius = tickRadius + TICK_LENGTH + TICK_LABEL_OFFSET;
        const value = lerp(this.options.min, this.options.max, progress);
        tickGroup.appendChild(
          createText(
            centerX + labelRadius * cos,
            centerY + labelRadius * sin,
            formatNumber(Math.round(value), this.options.locale),
            {
              fill: uiColors.textMuted,
              fontSize: TICK_LABEL_SIZE,
              className: `${this.options.classPrefix}__tick-label`,
            }
          )
        );
      }
    }

    group.appendChild(tickGroup);
  }

  private renderMinMaxLabels(
    group: SVGGElement,
    { centerX, centerY, radius }: GaugeGeometry,
    valueSize: number
  ): void {
    const labelRadius = radius - this.options.thickness - 15;
    // On a small gauge they would land on the value; aria-valuemin and aria-valuemax still say them
    if (labelRadius < valueSize) {
      return;
    }
    const ends: Array<[number, number, string]> = [
      [this.options.startAngle, this.options.min, 'min'],
      [this.options.endAngle, this.options.max, 'max'],
    ];
    for (const [angle, value, name] of ends) {
      const rad = degToRad(angle - 90);
      group.appendChild(
        createText(
          centerX + labelRadius * Math.cos(rad),
          centerY + labelRadius * Math.sin(rad),
          formatNumber(value, this.options.locale),
          {
            fill: uiColors.textMuted,
            fontSize: 12,
            className: `${this.options.classPrefix}__${name}-label`,
          }
        )
      );
    }
  }

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  private summary(): string {
    const { min, max, locale } = this.options;
    return `${this.options.formatValue(this.targetValue)} on a scale from ${formatNumber(min, locale)} to ${formatNumber(max, locale)}.`;
  }

  /** The gauge is a meter: expose its target value, not the animated one */
  private updateMeter(): void {
    if (!this.svg) {
      return;
    }
    this.svg.setAttribute('role', 'meter');
    this.svg.setAttribute('aria-valuemin', String(this.options.min));
    this.svg.setAttribute('aria-valuemax', String(this.options.max));
    this.svg.setAttribute('aria-valuenow', String(this.targetValue));
    this.svg.setAttribute('aria-valuetext', this.options.formatValue(this.targetValue));
  }

  // ==========================================================================
  // Animation
  // ==========================================================================

  /** Animates (or jumps) to a value */
  private showValue(value: number): void {
    this.targetValue = value;
    if (this.svg) {
      this.updateAccessibility(this.options.label || 'Gauge chart', this.summary());
      this.updateMeter();
    }
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (!this.shouldAnimate()) {
      this.currentValue = value;
      this.drawValue();
      return;
    }

    const startValue = this.currentValue;
    const startTime = performance.now();
    const duration = this.options.animation.duration ?? 1500;
    const ease = getEasing(this.options.animation.easing ?? 'easeOutCubic');

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      this.currentValue = lerp(startValue, value, ease(progress));
      this.drawValue();
      this.animationFrame = progress < 1 ? requestAnimationFrame(step) : null;
    };
    this.animationFrame = requestAnimationFrame(step);
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update gauge value
   */
  update(value: number): void {
    this.options.value = value;
    this.showValue(this.sanitizeValue(value));
  }

  /**
   * Update chart options
   */
  setOptions(options: Partial<GaugeChartOptions>): void {
    this.options = GaugeChart.mergeOptions({ ...this.options, ...options });
    if (!this.svg) {
      return;
    }
    this.validateOptions();
    this.refresh();
    if (options.value !== undefined) {
      this.showValue(this.sanitizeValue(options.value));
    }
  }

  /** Keeps the gauge square inside its container */
  protected override handleContainerResize(width: number, height: number): void {
    const size = Math.round(Math.min(width, height));
    this.resize(size, size);
  }

  /**
   * Destroy chart and clean up
   */
  override destroy(): void {
    this.valueArcElement = null;
    this.indicatorElement = null;
    this.valueTextElement = null;
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
