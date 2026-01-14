/**
 * CyberCore Charts - Gauge Chart
 * Radial gauge with cyberpunk styling and threshold zones
 */

import type {
  GaugeChartOptions,
  GaugeThreshold,
  ChartTheme,
  ChartEventType,
  ChartEventHandler,
  ChartEvent,
  GlowConfig,
} from '../types';
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
  svgToString,
  applyGlowFilter,
} from '../utils/svg';
import { degToRad, lerp, clamp } from '../utils/math';
import { getThemeColor, chartColors, hexToRGBA } from '../utils/colors';

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

export class GaugeChart {
  private container: HTMLElement;
  private options: Required<Omit<GaugeChartOptions, 'value'>> & { value: number };
  private svg: SVGSVGElement | null = null;
  private defs: SVGDefsElement | null = null;
  private chartArea: SVGGElement | null = null;
  private eventHandlers: Map<ChartEventType, Set<ChartEventHandler>> = new Map();
  private resizeObserver: ResizeObserver | null = null;
  private currentValue: number = 0;
  private animationFrame: number | null = null;

  constructor(container: HTMLElement | string, options: GaugeChartOptions) {
    if (typeof container === 'string') {
      const el = document.querySelector(container);
      if (!el) throw new Error(`Container not found: ${container}`);
      this.container = el as HTMLElement;
    } else {
      this.container = container;
    }

    this.options = this.mergeOptions(options);
    this.currentValue = this.options.min;
    this.init();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private mergeOptions(options: GaugeChartOptions): Required<Omit<GaugeChartOptions, 'value'>> & { value: number } {
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

  private init(): void {
    clearElement(this.container);
    this.createSVG();
    this.createDefinitions();
    this.render();

    if (this.options.animate) {
      this.animateToValue(this.options.value);
    } else {
      this.currentValue = this.options.value;
    }

    if (this.options.responsive) {
      this.setupResponsive();
    }
  }

  private createSVG(): void {
    this.svg = createSVGRoot(this.options.width, this.options.height, {
      classPrefix: `${this.options.classPrefix} ${this.options.classPrefix}--gauge`,
      ariaLabel: this.options.ariaLabel,
    });
    this.container.appendChild(this.svg);
  }

  private createDefinitions(): void {
    if (!this.svg) return;

    this.defs = createDefs();
    this.svg.appendChild(this.defs);

    // Create glow filters for each theme
    const themes: ChartTheme[] = ['cyan', 'magenta', 'green', 'yellow'];
    themes.forEach((theme) => {
      const glowConfig = typeof this.options.glow === 'object' ? this.options.glow : {};
      const filter = createGlowFilter(`glow-${theme}`, theme, glowConfig as GlowConfig);
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
    this.defs!.appendChild(gradient);

    // Create track gradient (dark)
    const trackGradient = createLinearGradient('gauge-track-gradient', [
      { offset: '0%', color: chartColors.background, opacity: 0.5 },
      { offset: '100%', color: chartColors.background, opacity: 0.8 },
    ]);
    this.defs!.appendChild(trackGradient);
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  private render(): void {
    if (!this.svg) return;

    if (this.chartArea) {
      this.svg.removeChild(this.chartArea);
    }

    this.chartArea = createGroup(`${this.options.classPrefix}__area`);
    this.svg.appendChild(this.chartArea);

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

    // Render background track
    this.renderTrack(centerX, centerY, outerRadius);

    // Render threshold zones
    if (this.options.thresholds.length > 0) {
      this.renderThresholds(centerX, centerY, outerRadius, innerRadius);
    }

    // Render value arc
    this.renderValueArc(centerX, centerY, outerRadius);

    // Render ticks
    if (this.options.showTicks) {
      this.renderTicks(centerX, centerY, outerRadius);
    }

    // Render center value
    if (this.options.showValue) {
      this.renderCenterValue(centerX, centerY);
    }

    // Render min/max labels
    if (this.options.showMinMax) {
      this.renderMinMaxLabels(centerX, centerY, outerRadius);
    }

    // Render label
    if (this.options.label) {
      this.renderLabel(centerX, centerY);
    }
  }

  private renderTrack(centerX: number, centerY: number, radius: number): void {
    if (!this.chartArea) return;

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

    this.chartArea.appendChild(track);
  }

  private renderThresholds(
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    if (!this.chartArea) return;

    const thresholdGroup = createGroup(`${this.options.classPrefix}__thresholds`);
    const sortedThresholds = [...this.options.thresholds].sort((a, b) => a.value - b.value);

    let prevAngle = this.options.startAngle;

    sortedThresholds.forEach((threshold, index) => {
      const progress = (threshold.value - this.options.min) / (this.options.max - this.options.min);
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

    this.chartArea.appendChild(thresholdGroup);
  }

  private renderValueArc(centerX: number, centerY: number, radius: number): void {
    if (!this.chartArea) return;

    const progress = clamp(
      (this.currentValue - this.options.min) / (this.options.max - this.options.min),
      0,
      1
    );
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

    const arcPath = describeArc(
      centerX,
      centerY,
      radius,
      this.options.startAngle,
      endAngle
    );

    const arc = createPath(arcPath, {
      stroke: arcColor,
      strokeWidth: this.options.thickness,
      strokeLinecap: 'round',
      className: `${this.options.classPrefix}__value-arc`,
    });

    if (this.options.glow) {
      applyGlowFilter(arc, `glow-${arcTheme}`);
    }

    this.chartArea.appendChild(arc);

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

    this.chartArea.appendChild(indicator);
  }

  private renderTicks(centerX: number, centerY: number, outerRadius: number): void {
    if (!this.chartArea) return;

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

    this.chartArea.appendChild(tickGroup);
  }

  private renderCenterValue(centerX: number, centerY: number): void {
    if (!this.chartArea) return;

    // Determine color based on thresholds
    let valueColor = getThemeColor(this.options.theme);
    for (const threshold of this.options.thresholds) {
      if (this.currentValue >= threshold.value) {
        valueColor = threshold.color || getThemeColor(threshold.theme || this.options.theme);
      }
    }

    const valueText = createText(
      centerX,
      centerY,
      this.options.formatValue(this.currentValue),
      {
        fill: valueColor,
        fontSize: 36,
        fontWeight: 'bold',
        className: `${this.options.classPrefix}__value-text`,
      }
    );

    this.chartArea.appendChild(valueText);
  }

  private renderMinMaxLabels(centerX: number, centerY: number, radius: number): void {
    if (!this.chartArea) return;

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
    this.chartArea.appendChild(minLabel);

    // Max label
    const maxAngle = degToRad(this.options.endAngle - 90);
    const maxX = centerX + labelRadius * Math.cos(maxAngle);
    const maxY = centerY + labelRadius * Math.sin(maxAngle);

    const maxLabel = createText(maxX, maxY, String(this.options.max), {
      fill: chartColors.textMuted,
      fontSize: 12,
      className: `${this.options.classPrefix}__max-label`,
    });
    this.chartArea.appendChild(maxLabel);
  }

  private renderLabel(centerX: number, centerY: number): void {
    if (!this.chartArea) return;

    const label = createText(centerX, centerY + 30, this.options.label, {
      fill: chartColors.text,
      fontSize: 14,
      className: `${this.options.classPrefix}__label`,
    });

    this.chartArea.appendChild(label);
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

      this.render();

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
  // Responsive
  // ==========================================================================

  private setupResponsive(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const size = Math.min(entry.contentRect.width, entry.contentRect.height);
        this.resize(size, size);
      }
    });
    this.resizeObserver.observe(this.container);
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update gauge value
   */
  update(value: number): void {
    this.options.value = value;

    if (this.options.animate) {
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
      if (this.options.animate) {
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
    if (width) this.options.width = width;
    if (height) this.options.height = height;

    if (this.svg) {
      this.svg.setAttribute('width', String(this.options.width));
      this.svg.setAttribute('height', String(this.options.height));
      this.svg.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
    }

    this.render();
    this.emit('resize', { type: 'resize', target: null, data: { width: this.options.width, height: this.options.height } });
  }

  /**
   * Destroy chart and clean up
   */
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    clearElement(this.container);

    this.svg = null;
    this.defs = null;
    this.chartArea = null;
    this.eventHandlers.clear();
  }

  /**
   * Get SVG element
   */
  getSVG(): SVGSVGElement {
    if (!this.svg) throw new Error('Chart not initialized');
    return this.svg;
  }

  /**
   * Export as SVG string
   */
  toSVG(): string {
    if (!this.svg) throw new Error('Chart not initialized');
    return svgToString(this.svg);
  }

  /**
   * Get current value
   */
  getValue(): number {
    return this.currentValue;
  }

  /**
   * Add event listener
   */
  on<T = unknown>(event: ChartEventType, handler: ChartEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as ChartEventHandler);
  }

  /**
   * Remove event listener
   */
  off(event: ChartEventType, handler?: ChartEventHandler): void {
    if (!handler) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.get(event)?.delete(handler);
    }
  }

  private emit<T = unknown>(event: ChartEventType, data: ChartEvent<T>): void {
    this.eventHandlers.get(event)?.forEach((handler) => handler(data as ChartEvent));
  }
}

export default GaugeChart;
