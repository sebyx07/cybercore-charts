/**
 * CyberCore Charts - Donut Chart
 * Donut/pie chart with cyberpunk styling and segment interactions
 */

import { fitLabel, formatNumber, textWidth } from '../utils/format';
import { degToRad, sum } from '../utils/math';
import {
  createGroup,
  createPath,
  createRect,
  createText,
  describeDonutSegment,
} from '../utils/svg';
import { seriesColor, themeColor, uiColors } from '../utils/theme';
import { TooltipManager } from '../utils/TooltipManager';

import { BaseChart } from './BaseChart';

import type { DonutChartOptions, DonutSegment } from '../types';
import type { ChartDataTable } from '../utils/a11y';
import type { UndefaultedOptionKeys } from './series';

// ============================================================================
// Types and Defaults
// ============================================================================

type DonutDefaults = Required<Omit<DonutChartOptions, 'data' | UndefaultedOptionKeys>>;
type ResolvedDonutOptions = DonutDefaults & DonutChartOptions;

interface SegmentArc {
  start: number;
  end: number;
  segment: DonutSegment;
}

const DEFAULT_OPTIONS: DonutDefaults = {
  width: 300,
  height: 300,
  padding: { top: 20, right: 20, bottom: 20, left: 20 },
  theme: 'accent',
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
  dataTable: true,
  keyboard: true,
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

/** Width reserved for the legend; it is dropped on charts narrower than twice this */
const LEGEND_WIDTH = 120;
const LABEL_FONT_SIZE = 11;
/** Gap between the ring and its outside labels */
const LABEL_OFFSET = 20;
/** Gap between a label and the plot edge */
const LABEL_EDGE = 4;

// ============================================================================
// DonutChart Class
// ============================================================================

export class DonutChart extends BaseChart<ResolvedDonutOptions, DonutSegment[]> {
  private segments: DonutSegment[] = [];
  private segmentAngles: SegmentArc[] = [];

  constructor(container: HTMLElement | string, options: DonutChartOptions) {
    super(container, DonutChart.mergeOptions(options), { width: 300, height: 300 });
    this.applyDimensions();
    this.setSegments(this.options.data);
    this.createRoot(
      `${this.options.classPrefix} ${this.options.classPrefix}--donut`,
      this.options.width,
      this.options.height
    );
    this.createDefinitions();
    this.render();
    this.syncResponsive();
  }

  // ==========================================================================
  // Options and Data
  // ==========================================================================

  private static mergeOptions(options: DonutChartOptions): ResolvedDonutOptions {
    const merged: ResolvedDonutOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      padding: { ...DEFAULT_OPTIONS.padding, ...options.padding },
      animation: { ...DEFAULT_OPTIONS.animation, ...options.animation },
      tooltip: { ...DEFAULT_OPTIONS.tooltip, ...options.tooltip },
      legend: { ...DEFAULT_OPTIONS.legend, ...options.legend },
    };
    if (typeof options.glow === 'object') {
      merged.glow = { enabled: true, ...options.glow };
    }
    return merged;
  }

  private applyDimensions(): void {
    const dims = this.validateDimensions(this.options.width, this.options.height, 'DonutChart');
    this.options.width = dims.width;
    this.options.height = dims.height;
  }

  /** Keeps finite, non-negative segments, sorted if asked */
  private setSegments(data: DonutSegment[] | undefined): void {
    const valid = (data ?? []).filter((segment) => {
      if (typeof segment?.value !== 'number' || !isFinite(segment.value) || segment.value < 0) {
        console.warn(`DonutChart: Segment "${segment?.label}" has an invalid value, skipping`);
        return false;
      }
      return true;
    });
    if (this.options.sortSegments) {
      const direction = this.options.sortSegments === 'asc' ? 1 : -1;
      valid.sort((a, b) => (a.value - b.value) * direction);
    }
    this.segments = valid;
    this.calculateAngles();
  }

  private colorOf(segment: DonutSegment, index: number): string {
    if (segment.color) {
      return segment.color;
    }
    return segment.theme ? themeColor(segment.theme) : seriesColor(index, this.options.theme);
  }

  /**
   * Angles per segment. Zero segments take no arc; the gap shrinks on thin
   * segments so they never get a negative sweep.
   */
  private calculateAngles(): void {
    const total = this.getTotal();
    this.segmentAngles = [];
    if (total === 0) {
      return;
    }
    let current = this.options.startAngle;
    for (const segment of this.segments) {
      const sweep = (segment.value / total) * 360;
      const gap = Math.min(this.options.segmentGap, sweep / 2);
      if (sweep > 0) {
        this.segmentAngles.push({
          start: current + gap / 2,
          end: current + sweep - gap / 2,
          segment,
        });
      }
      current += sweep;
    }
  }

  private percentage(value: number, digits: number): string {
    const total = this.getTotal();
    return `${formatNumber(total > 0 ? Number(((value / total) * 100).toFixed(digits)) : 0, this.options.locale)}%`;
  }

  // ==========================================================================
  // Definitions
  // ==========================================================================

  protected createDefinitions(): void {
    this.addEffectDefinitions(this.options.glow);
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  render(): void {
    if (!this.svg) {
      return;
    }
    const animate = this.takeEntryAnimation();
    this.resetItems();
    this.chartArea?.remove();
    this.chartArea = createGroup(`${this.options.classPrefix}__area`);
    this.svg.appendChild(this.chartArea);

    const { width, height } = this.options;
    const legendWidth = this.options.legend.show && width >= LEGEND_WIDTH * 2 ? LEGEND_WIDTH : 0;
    const plotWidth = width - legendWidth;
    const centerX = plotWidth / 2;
    const centerY = height / 2;
    const padding = Math.max(
      this.options.padding.top ?? 0,
      this.options.padding.right ?? 0,
      this.options.padding.bottom ?? 0,
      this.options.padding.left ?? 0
    );
    const labelSpace = this.options.showLabels ? 30 : 0;
    const ringRadius = Math.max(0, Math.min(centerX, centerY) - padding - labelSpace);
    const outerRadius = this.options.showLabels ? this.fitLabels(centerX, ringRadius) : ringRadius;
    const innerRadius = outerRadius * Math.max(0, Math.min(1, this.options.innerRadius));

    this.renderSegments(centerX, centerY, outerRadius, innerRadius, animate);
    if (this.options.showLabels) {
      this.renderLabels(centerX, centerY, outerRadius, plotWidth, animate);
    }
    if (this.options.innerRadius > 0 && (this.options.centerText || this.options.centerSubtext)) {
      this.renderCenterText(centerX, centerY);
    }
    if (legendWidth > 0) {
      this.renderSegmentLegend(plotWidth);
    }

    this.updateAccessibility('Donut chart', this.summary());
  }

  private renderSegments(
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
    animate: boolean
  ): void {
    const prefix = this.options.classPrefix;
    const group = createGroup(`${prefix}__segments`);
    const count = this.segmentAngles.length;

    this.segmentAngles.forEach(({ start, end, segment }, index) => {
      const color = this.colorOf(segment, this.segments.indexOf(segment));
      const path = createPath(
        describeDonutSegment(centerX, centerY, outerRadius, innerRadius, start, end),
        {
          fill: color,
          stroke: uiColors.background,
          strokeWidth: 1,
          className: `${prefix}__segment`,
        }
      );
      path.setAttribute('data-index', String(index));
      path.setAttribute('data-value', String(segment.value));
      path.setAttribute('data-label', segment.label);
      path.style.transformOrigin = `${centerX}px ${centerY}px`;
      this.applyGlow(path);
      this.addSegmentItem(path, segment, color);

      if (animate) {
        const { duration } = this.options.animation;
        path.style.opacity = '0';
        path.style.transform = 'scale(0.8)';
        path.style.transition = `opacity ${duration}ms, transform ${duration}ms`;
        path.style.transitionDelay = `${this.staggerDelay(index, count)}ms`;
        this.nextFrame(() => {
          path.style.opacity = '1';
          path.style.transform = 'scale(1)';
        });
      }
      group.appendChild(path);
    });

    this.chartArea?.appendChild(group);
  }

  private addSegmentItem(path: SVGPathElement, segment: DonutSegment, color: string): void {
    const value = formatNumber(segment.value, this.options.locale);
    const percentage = this.percentage(segment.value, 1);
    this.addItem({
      element: path,
      label: `${segment.label}: ${value} (${percentage})`,
      enter: (event) => {
        path.style.transform = 'scale(1.05)';
        this.emit('segmentHover', {
          type: 'segmentHover',
          target: path,
          data: segment,
          originalEvent: event,
        });
        this.showTooltip(
          TooltipManager.createSegmentContent(segment.label, color, value, percentage),
          path,
          event
        );
      },
      leave: () => {
        path.style.transform = 'scale(1)';
        this.hideTooltip();
      },
      activate: (event) =>
        this.emit('segmentClick', {
          type: 'segmentClick',
          target: path,
          data: segment,
          originalEvent: event,
        }),
    });
  }

  private labelText(segment: DonutSegment): string {
    return this.options.showPercentages
      ? `${segment.label} (${this.percentage(segment.value, 1)})`
      : segment.label;
  }

  /**
   * Shrinks the ring until every side label fits between it and the plot edge, down to half
   * its size: below that the ring stops being readable and the labels are shortened instead.
   */
  private fitLabels(centerX: number, radius: number): number {
    let fitted = radius;
    for (const { start, end, segment } of this.segmentAngles) {
      const reach = Math.abs(Math.cos(degToRad((start + end) / 2 - 90)));
      const room = centerX - LABEL_EDGE - textWidth(this.labelText(segment), LABEL_FONT_SIZE);
      if (reach > 0.01) {
        fitted = Math.min(fitted, room / reach - LABEL_OFFSET);
      }
    }
    return Math.max(radius / 2, fitted);
  }

  private renderLabels(
    centerX: number,
    centerY: number,
    outerRadius: number,
    plotWidth: number,
    animate: boolean
  ): void {
    const group = createGroup(`${this.options.classPrefix}__labels`);
    group.setAttribute('aria-hidden', 'true');
    const labelRadius = outerRadius + LABEL_OFFSET;

    for (const { start, end, segment } of this.segmentAngles) {
      const midAngle = (start + end) / 2;
      const angleRad = degToRad(midAngle - 90);
      // 0° is twelve o'clock; the left half runs from 180° to 360°
      const normalized = ((midAngle % 360) + 360) % 360;
      const text = this.labelText(segment);
      const x = centerX + labelRadius * Math.cos(angleRad);
      const leftHalf = normalized > 180 && normalized < 360;
      // Shorten labels to the room between the ring and the plot edge
      const room = leftHalf ? x - LABEL_EDGE : plotWidth - x - LABEL_EDGE;
      const label = createText(
        x,
        centerY + labelRadius * Math.sin(angleRad),
        fitLabel(text, room, LABEL_FONT_SIZE),
        {
          fill: uiColors.text,
          fontSize: LABEL_FONT_SIZE,
          textAnchor: leftHalf ? 'end' : 'start',
          className: `${this.options.classPrefix}__label`,
          title: text,
        }
      );
      if (animate) {
        const { duration } = this.options.animation;
        label.style.opacity = '0';
        label.style.transition = `opacity ${duration}ms`;
        label.style.transitionDelay = `${duration}ms`;
        this.nextFrame(() => {
          label.style.opacity = '1';
        });
      }
      group.appendChild(label);
    }

    this.chartArea?.appendChild(group);
  }

  private renderCenterText(centerX: number, centerY: number): void {
    const prefix = this.options.classPrefix;
    const group = createGroup(`${prefix}__center`);
    if (this.options.centerText) {
      group.appendChild(
        createText(
          centerX,
          centerY - (this.options.centerSubtext ? 10 : 0),
          this.options.centerText,
          {
            fill: themeColor(this.options.theme),
            fontSize: 24,
            fontWeight: 'bold',
            className: `${prefix}__center-text`,
          }
        )
      );
    }
    if (this.options.centerSubtext) {
      group.appendChild(
        createText(centerX, centerY + 15, this.options.centerSubtext, {
          fill: uiColors.textMuted,
          fontSize: 12,
          className: `${prefix}__center-subtext`,
        })
      );
    }
    this.chartArea?.appendChild(group);
  }

  private renderSegmentLegend(plotWidth: number): void {
    const prefix = this.options.classPrefix;
    const group = createGroup(`${prefix}__legend`);
    group.setAttribute('aria-hidden', 'true');
    const startX = plotWidth + 20;
    const itemHeight = 24;
    const iconSize = 12;
    const startY = (this.options.height - this.segments.length * itemHeight) / 2;

    this.segments.forEach((segment, index) => {
      const y = startY + index * itemHeight;
      group.appendChild(
        createRect(startX, y - iconSize / 2, iconSize, iconSize, {
          fill: this.colorOf(segment, index),
          className: `${prefix}__legend-icon`,
        })
      );
      const text = `${segment.label} (${this.percentage(segment.value, 0)})`;
      group.appendChild(
        createText(startX + iconSize + 8, y, fitLabel(text, LEGEND_WIDTH - iconSize - 28, 11), {
          fill: uiColors.text,
          fontSize: 11,
          textAnchor: 'start',
          className: `${prefix}__legend-text`,
          title: text,
        })
      );
    });

    this.chartArea?.appendChild(group);
  }

  private summary(): string {
    const largest = this.segments.reduce<DonutSegment | null>(
      (best, segment) => (best === null || segment.value > best.value ? segment : best),
      null
    );
    const total = formatNumber(this.getTotal(), this.options.locale);
    const head = `${this.segments.length} segments, total ${total}.`;
    return largest && this.getTotal() > 0
      ? `${head} Largest: ${largest.label} (${this.percentage(largest.value, 1)}).`
      : head;
  }

  protected override getTableData(): ChartDataTable {
    return {
      caption: this.options.ariaLabel || 'Donut chart',
      headers: ['Label', 'Value', 'Share'],
      rows: this.segments.map((segment) => [
        segment.label,
        formatNumber(segment.value, this.options.locale),
        this.percentage(segment.value, 1),
      ]),
    };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update chart with new data
   */
  update(data: DonutSegment[]): void {
    this.options.data = data;
    this.setSegments(data);
    this.requestEntryAnimation();
    this.render();
  }

  /**
   * Update chart options. Data, theme, size and effects may all change.
   */
  setOptions(options: Partial<DonutChartOptions>): void {
    this.options = DonutChart.mergeOptions({ ...this.options, ...options });
    if (!this.svg) {
      return;
    }
    this.applyDimensions();
    if (options.data) {
      this.requestEntryAnimation();
    }
    this.setSegments(this.options.data);
    this.refresh();
  }

  /**
   * Destroy chart and clean up
   */
  override destroy(): void {
    this.segments = [];
    this.segmentAngles = [];
    super.destroy();
  }

  /**
   * Get total value
   */
  getTotal(): number {
    return sum(this.segments.map((s) => s.value));
  }
}

export default DonutChart;
