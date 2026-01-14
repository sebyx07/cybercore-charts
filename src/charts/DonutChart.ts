/**
 * CyberCore Charts - Donut Chart
 * Donut/pie chart with cyberpunk styling and segment interactions
 */

import { chartColors, generateSeriesColors, getThemeColor } from '../utils/colors';
import { degToRad, sum } from '../utils/math';
import {
  createSVGRoot,
  createDefs,
  createGroup,
  createPath,
  createText,
  createGlowFilter,
  describeDonutSegment,
  clearElement,
  svgToString,
  applyGlowFilter,
} from '../utils/svg';

import type {
  ChartEvent,
  ChartEventHandler,
  ChartEventType,
  ChartTheme,
  DonutChartOptions,
  DonutSegment,
} from '../types';

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<DonutChartOptions, 'data'>> = {
  width: 300,
  height: 300,
  padding: { top: 20, right: 20, bottom: 20, left: 20 },
  theme: 'cyan',
  animate: true,
  animation: {
    enabled: true,
    duration: 1000,
    easing: 'easeOutCubic',
    delay: 0,
    stagger: 50,
  },
  tooltip: {
    enabled: true,
    followCursor: false,
  },
  glow: true,
  scanlines: false,
  classPrefix: 'cyber-chart',
  responsive: false,
  ariaLabel: 'Donut chart',
  innerRadius: 0.6,
  segmentGap: 2,
  showLabels: true,
  labelPosition: 'outside',
  showPercentages: true,
  centerText: '',
  centerSubtext: '',
  legend: {
    show: true,
    position: 'right',
    align: 'center',
  },
  startAngle: -90,
  sortSegments: false,
};

// ============================================================================
// DonutChart Class
// ============================================================================

export class DonutChart {
  private container: HTMLElement;
  private options: Required<Omit<DonutChartOptions, 'data'>> & { data: DonutSegment[] };
  private svg: SVGSVGElement | null = null;
  private defs: SVGDefsElement | null = null;
  private chartArea: SVGGElement | null = null;
  private segments: DonutSegment[] = [];
  private segmentAngles: Array<{ start: number; end: number; segment: DonutSegment }> = [];
  private eventHandlers: Map<ChartEventType, Set<ChartEventHandler>> = new Map();
  private resizeObserver: ResizeObserver | null = null;
  private tooltipElement: HTMLDivElement | null = null;
  private hoveredSegment: SVGPathElement | null = null;

  constructor(container: HTMLElement | string, options: DonutChartOptions) {
    if (typeof container === 'string') {
      const el = document.querySelector(container);
      if (!el) {throw new Error(`Container not found: ${container}`);}
      this.container = el as HTMLElement;
    } else {
      this.container = container;
    }

    this.options = this.mergeOptions(options);
    this.segments = this.processSegments(this.options.data);
    this.init();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private mergeOptions(options: DonutChartOptions): Required<Omit<DonutChartOptions, 'data'>> & { data: DonutSegment[] } {
    const merged = {
      ...DEFAULT_OPTIONS,
      ...options,
      padding: { ...DEFAULT_OPTIONS.padding, ...options.padding },
      animation: { ...DEFAULT_OPTIONS.animation, ...options.animation },
      tooltip: { ...DEFAULT_OPTIONS.tooltip, ...options.tooltip },
      legend: { ...DEFAULT_OPTIONS.legend, ...options.legend },
    };

    if (typeof options.glow === 'boolean') {
      merged.glow = options.glow;
    } else if (options.glow) {
      merged.glow = { enabled: true, ...options.glow };
    }

    return merged as Required<Omit<DonutChartOptions, 'data'>> & { data: DonutSegment[] };
  }

  private processSegments(data: DonutSegment[]): DonutSegment[] {
    let processed = [...data];

    // Sort if requested
    if (this.options.sortSegments) {
      const direction = this.options.sortSegments === 'asc' ? 1 : -1;
      processed.sort((a, b) => (a.value - b.value) * direction);
    }

    // Generate colors for segments without explicit colors
    const colors = generateSeriesColors(processed.length, this.options.theme);
    processed = processed.map((segment, index) => ({
      ...segment,
      color: segment.color || colors[index],
    }));

    return processed;
  }

  private init(): void {
    clearElement(this.container);
    this.createSVG();
    this.createDefinitions();
    this.calculateAngles();
    this.render();

    if (this.options.responsive) {
      this.setupResponsive();
    }

    if (this.options.tooltip.enabled) {
      this.createTooltip();
    }
  }

  private createSVG(): void {
    this.svg = createSVGRoot(this.options.width, this.options.height, {
      classPrefix: `${this.options.classPrefix} ${this.options.classPrefix}--donut`,
      ariaLabel: this.options.ariaLabel,
    });
    this.container.appendChild(this.svg);
  }

  private createDefinitions(): void {
    if (!this.svg) {return;}

    this.defs = createDefs();
    this.svg.appendChild(this.defs);

    // Create glow filters for each theme
    const themes: ChartTheme[] = ['cyan', 'magenta', 'green', 'yellow'];
    themes.forEach((theme) => {
      const glowConfig = typeof this.options.glow === 'object' ? this.options.glow : {};
      const filter = createGlowFilter(`glow-${theme}`, theme, glowConfig);
      this.defs!.appendChild(filter);
    });
  }

  private calculateAngles(): void {
    const total = sum(this.segments.map((s) => s.value));
    if (total === 0) {
      this.segmentAngles = [];
      return;
    }

    let currentAngle = this.options.startAngle;
    const gapAngle = this.options.segmentGap;

    this.segmentAngles = this.segments.map((segment) => {
      const segmentAngle = (segment.value / total) * 360 - gapAngle;
      const startAngle = currentAngle + gapAngle / 2;
      const endAngle = startAngle + segmentAngle;

      currentAngle = endAngle + gapAngle / 2;

      return { start: startAngle, end: endAngle, segment };
    });
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  private render(): void {
    if (!this.svg) {return;}

    if (this.chartArea) {
      this.svg.removeChild(this.chartArea);
    }

    this.chartArea = createGroup(`${this.options.classPrefix}__area`);
    this.svg.appendChild(this.chartArea);

    // Calculate dimensions
    const legendWidth = this.options.legend.show ? 120 : 0;
    const chartWidth = this.options.width - legendWidth;
    const centerX = chartWidth / 2;
    const centerY = this.options.height / 2;
    const padding = Math.max(
      this.options.padding.top!,
      this.options.padding.right!,
      this.options.padding.bottom!,
      this.options.padding.left!
    );
    const outerRadius = Math.min(centerX, centerY) - padding - (this.options.showLabels ? 30 : 0);
    const innerRadius = outerRadius * this.options.innerRadius;

    // Render segments
    this.renderSegments(centerX, centerY, outerRadius, innerRadius);

    // Render labels
    if (this.options.showLabels) {
      this.renderLabels(centerX, centerY, outerRadius);
    }

    // Render center text
    if (this.options.innerRadius > 0 && (this.options.centerText || this.options.centerSubtext)) {
      this.renderCenterText(centerX, centerY);
    }

    // Render legend
    if (this.options.legend.show) {
      this.renderLegend(chartWidth);
    }
  }

  private renderSegments(
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    if (!this.chartArea) {return;}

    const segmentsGroup = createGroup(`${this.options.classPrefix}__segments`);

    this.segmentAngles.forEach(({ start, end, segment }, index) => {
      const theme = segment.theme || this.options.theme;
      const color = segment.color || getThemeColor(theme);

      const pathData = describeDonutSegment(
        centerX,
        centerY,
        outerRadius,
        innerRadius,
        start,
        end
      );

      const path = createPath(pathData, {
        fill: color,
        stroke: chartColors.background,
        strokeWidth: 1,
        className: `${this.options.classPrefix}__segment`,
      });

      path.setAttribute('data-index', String(index));
      path.setAttribute('data-value', String(segment.value));
      path.setAttribute('data-label', segment.label);

      // Apply glow
      if (this.options.glow) {
        applyGlowFilter(path, `glow-${theme}`);
      }

      // Add interaction
      path.addEventListener('mouseenter', (e) => {
        this.handleSegmentHover(segment, e, path);
      });
      path.addEventListener('mouseleave', () => {
        this.handleSegmentLeave(path);
      });
      path.addEventListener('click', (e) => {
        this.emit('segmentClick', {
          type: 'segmentClick',
          target: path,
          data: segment,
          originalEvent: e,
        });
      });

      // Add animation
      if (this.options.animate) {
        const delay = this.options.animation.delay! + index * this.options.animation.stagger!;
        path.style.opacity = '0';
        path.style.transform = `scale(0.8)`;
        path.style.transformOrigin = `${centerX}px ${centerY}px`;
        path.style.transition = `opacity ${this.options.animation.duration}ms, transform ${this.options.animation.duration}ms`;
        path.style.transitionDelay = `${delay}ms`;

        requestAnimationFrame(() => {
          path.style.opacity = '1';
          path.style.transform = 'scale(1)';
        });
      }

      segmentsGroup.appendChild(path);
    });

    this.chartArea.appendChild(segmentsGroup);
  }

  private renderLabels(centerX: number, centerY: number, outerRadius: number): void {
    if (!this.chartArea) {return;}

    const labelsGroup = createGroup(`${this.options.classPrefix}__labels`);
    const total = sum(this.segments.map((s) => s.value));
    const labelRadius = outerRadius + 20;

    this.segmentAngles.forEach(({ start, end, segment }) => {
      const midAngle = (start + end) / 2;
      const angleRad = degToRad(midAngle - 90);

      const labelX = centerX + labelRadius * Math.cos(angleRad);
      const labelY = centerY + labelRadius * Math.sin(angleRad);

      const percentage = total > 0 ? ((segment.value / total) * 100).toFixed(1) : '0';
      const labelText = this.options.showPercentages
        ? `${segment.label} (${percentage}%)`
        : segment.label;

      const textAnchor = midAngle > 90 && midAngle < 270 ? 'end' : 'start';

      const label = createText(labelX, labelY, labelText, {
        fill: chartColors.text,
        fontSize: 11,
        textAnchor,
        className: `${this.options.classPrefix}__label`,
      });

      // Add animation
      if (this.options.animate) {
        label.style.opacity = '0';
        label.style.transition = `opacity ${this.options.animation.duration}ms`;
        label.style.transitionDelay = `${this.options.animation.duration}ms`;

        requestAnimationFrame(() => {
          label.style.opacity = '1';
        });
      }

      labelsGroup.appendChild(label);
    });

    this.chartArea.appendChild(labelsGroup);
  }

  private renderCenterText(centerX: number, centerY: number): void {
    if (!this.chartArea) {return;}

    const centerGroup = createGroup(`${this.options.classPrefix}__center`);

    if (this.options.centerText) {
      const mainText = createText(
        centerX,
        centerY - (this.options.centerSubtext ? 10 : 0),
        this.options.centerText,
        {
          fill: getThemeColor(this.options.theme),
          fontSize: 24,
          fontWeight: 'bold',
          className: `${this.options.classPrefix}__center-text`,
        }
      );
      centerGroup.appendChild(mainText);
    }

    if (this.options.centerSubtext) {
      const subText = createText(
        centerX,
        centerY + 15,
        this.options.centerSubtext,
        {
          fill: chartColors.textMuted,
          fontSize: 12,
          className: `${this.options.classPrefix}__center-subtext`,
        }
      );
      centerGroup.appendChild(subText);
    }

    this.chartArea.appendChild(centerGroup);
  }

  private renderLegend(chartWidth: number): void {
    if (!this.svg) {return;}

    const legendGroup = createGroup(`${this.options.classPrefix}__legend`);
    const startX = chartWidth + 20;
    const itemHeight = 24;
    const iconSize = 12;
    const total = sum(this.segments.map((s) => s.value));

    const startY = (this.options.height - this.segments.length * itemHeight) / 2;

    this.segments.forEach((segment, index) => {
      const theme = segment.theme || this.options.theme;
      const color = segment.color || getThemeColor(theme);
      const y = startY + index * itemHeight;

      // Legend icon (small square)
      const iconPath = `M ${startX} ${y - iconSize / 2} h ${iconSize} v ${iconSize} h -${iconSize} Z`;
      const icon = createPath(iconPath, {
        fill: color,
        className: `${this.options.classPrefix}__legend-icon`,
      });
      legendGroup.appendChild(icon);

      // Legend text
      const percentage = total > 0 ? ((segment.value / total) * 100).toFixed(0) : '0';
      const label = createText(startX + iconSize + 8, y, `${segment.label} (${percentage}%)`, {
        fill: chartColors.text,
        fontSize: 11,
        textAnchor: 'start',
        className: `${this.options.classPrefix}__legend-text`,
      });
      legendGroup.appendChild(label);
    });

    this.svg.appendChild(legendGroup);
  }

  // ==========================================================================
  // Interactions
  // ==========================================================================

  private handleSegmentHover(
    segment: DonutSegment,
    event: MouseEvent,
    element: SVGPathElement
  ): void {
    // Scale up the hovered segment
    this.hoveredSegment = element;
    element.style.transform = 'scale(1.05)';
    element.style.filter = element.getAttribute('filter') || '';

    this.emit('segmentHover', {
      type: 'segmentHover',
      target: element,
      data: segment,
      originalEvent: event,
    });

    // Show tooltip
    if (this.options.tooltip.enabled) {
      const total = sum(this.segments.map((s) => s.value));
      const percentage = total > 0 ? ((segment.value / total) * 100).toFixed(1) : '0';
      const theme = segment.theme || this.options.theme;
      const color = segment.color || getThemeColor(theme);

      const content = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="width: 10px; height: 10px; background: ${color}; border-radius: 2px;"></span>
          <strong>${segment.label}</strong>
        </div>
        <div>Value: <strong style="color: ${color}">${segment.value}</strong></div>
        <div>Percentage: <strong style="color: ${color}">${percentage}%</strong></div>
      `;

      this.showTooltip(content, event.clientX, event.clientY);
    }
  }

  private handleSegmentLeave(element: SVGPathElement): void {
    element.style.transform = 'scale(1)';
    this.hoveredSegment = null;
    this.hideTooltip();
  }

  // ==========================================================================
  // Tooltip
  // ==========================================================================

  private createTooltip(): void {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = `${this.options.classPrefix}__tooltip`;
    this.tooltipElement.style.cssText = `
      position: fixed;
      pointer-events: none;
      background: ${chartColors.tooltipBg};
      border: 1px solid ${chartColors.tooltipBorder};
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 12px;
      color: ${chartColors.text};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.15s;
    `;
    document.body.appendChild(this.tooltipElement);
  }

  private showTooltip(content: string, x: number, y: number): void {
    if (!this.tooltipElement) {return;}

    this.tooltipElement.innerHTML = content;
    this.tooltipElement.style.opacity = '1';
    this.tooltipElement.style.left = `${x + 15}px`;
    this.tooltipElement.style.top = `${y - 10}px`;
  }

  private hideTooltip(): void {
    if (!this.tooltipElement) {return;}
    this.tooltipElement.style.opacity = '0';
  }

  // ==========================================================================
  // Responsive
  // ==========================================================================

  private setupResponsive(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        this.resize(width, height);
      }
    });
    this.resizeObserver.observe(this.container);
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update chart with new data
   */
  update(data: DonutSegment[]): void {
    this.segments = this.processSegments(data);
    this.options.data = data;
    this.calculateAngles();
    this.render();
  }

  /**
   * Update chart options
   */
  setOptions(options: Partial<DonutChartOptions>): void {
    this.options = this.mergeOptions({ ...this.options, ...options });
    if (options.data) {
      this.segments = this.processSegments(options.data);
    }
    this.calculateAngles();
    this.render();
  }

  /**
   * Resize chart
   */
  resize(width?: number, height?: number): void {
    if (width) {this.options.width = width;}
    if (height) {this.options.height = height;}

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
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
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
    if (!this.svg) {throw new Error('Chart not initialized');}
    return this.svg;
  }

  /**
   * Export as SVG string
   */
  toSVG(): string {
    if (!this.svg) {throw new Error('Chart not initialized');}
    return svgToString(this.svg);
  }

  /**
   * Get total value
   */
  getTotal(): number {
    return sum(this.segments.map((s) => s.value));
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

export default DonutChart;
