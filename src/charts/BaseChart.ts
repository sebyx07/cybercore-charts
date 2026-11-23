/**
 * CyberCore Charts - Base Chart
 * Abstract base class that provides common functionality for all chart types.
 * Eliminates code duplication and follows SRP/SOLID principles.
 */

import { LAYOUT } from '../constants';
import { createDataTable } from '../utils/a11y';
import { fitLabel } from '../utils/format';
import { ResponsiveManager } from '../utils/ResponsiveManager';
import {
  clearElement,
  createDefs,
  createGlowFilter,
  createGroup,
  createLine,
  createRect,
  createSVGElement,
  createSVGRoot,
  createScanlinesPattern,
  createText,
  svgToString,
} from '../utils/svg';
import { prefersHighContrast, prefersReducedMotion, uiColors } from '../utils/theme';
import { TooltipManager } from '../utils/TooltipManager';

import type {
  BaseChartOptions,
  ChartEvent,
  ChartEventHandler,
  ChartEventType,
  ChartPadding,
  GlowConfig,
} from '../types';
import type { ChartDataTable } from '../utils/a11y';

// ============================================================================
// Types
// ============================================================================

/**
 * Default chart dimensions used when invalid dimensions are provided
 */
export interface DefaultDimensions {
  width: number;
  height: number;
}

/**
 * An interactive data mark (point, bar, segment). The base class wires
 * mouse, focus and keyboard input to these callbacks through delegated
 * listeners on the SVG root, so marks carry no listeners of their own.
 */
export interface ChartItem {
  /** The SVG element representing the mark */
  element: SVGElement;
  /** Accessible label, e.g. "Revenue, Jan: 1,200" */
  label: string;
  /** Pointer entered or keyboard focus arrived (no event for focus) */
  enter(event?: MouseEvent): void;
  /** Pointer or focus left */
  leave(): void;
  /** Click, Enter or Space (no event for keyboard) */
  activate(event?: MouseEvent): void;
}

/** Legend entry for horizontal legends */
export interface LegendEntry {
  name: string;
  color: string;
}

let instanceCount = 0;

const ITEM_ATTRIBUTE = 'data-item';

// ============================================================================
// BaseChart Abstract Class
// ============================================================================

/**
 * Abstract base class for all CyberCore chart types.
 * Provides common functionality including:
 * - Container resolution (string selector or HTMLElement)
 * - Dimension validation
 * - Event handling (on/off/emit)
 * - SVG root with per-instance ids, <title>/<desc> and a data table fallback
 * - Mouse, focus and keyboard interaction for data marks
 * - Animation preference checking (reduced motion, frame batching)
 * - Responsive behavior and tooltips
 * - Resource cleanup (destroy)
 *
 * @template TOptions - The specific chart options type extending BaseChartOptions
 * @template TData - The data type used by the specific chart
 */
export abstract class BaseChart<
  TOptions extends BaseChartOptions = BaseChartOptions,
  TData = unknown,
> {
  // ==========================================================================
  // Protected Properties
  // ==========================================================================

  /** The container element for the chart */
  protected container: HTMLElement;

  /** The root SVG element */
  protected svg: SVGSVGElement | null = null;

  /** The SVG defs element for filters, gradients, etc. */
  protected defs: SVGDefsElement | null = null;

  /** The main chart area group element */
  protected chartArea: SVGGElement | null = null;

  /** Event handlers map */
  protected eventHandlers: Map<ChartEventType, Set<ChartEventHandler>> = new Map();

  /** Animation frame ID of a chart-driven animation loop, cancelled on destroy */
  protected animationFrame: number | null = null;

  /** Merged options with defaults */
  protected options: TOptions;

  /** Unique per instance; prefixes every SVG id so charts can share a page */
  protected readonly uid: string = `cyber-chart-${++instanceCount}`;

  /** Interactive marks of the current render */
  protected items: ChartItem[] = [];

  /** Tooltip, created on first use */
  protected tooltipManager: TooltipManager | null = null;

  /** Container resize tracking when `responsive` is on */
  protected responsiveManager: ResponsiveManager | null = null;

  // ==========================================================================
  // Private State
  // ==========================================================================

  private frameQueue: Array<() => void> = [];
  private queuedFrame: number | null = null;
  private animateOnRender = true;
  private activeItem: ChartItem | null = null;
  private dataTable: HTMLTableElement | null = null;
  private titleElement: SVGTitleElement | null = null;
  private descElement: SVGDescElement | null = null;
  private savedFocusStroke = new WeakMap<SVGElement, [string, string]>();

  // ==========================================================================
  // Constructor
  // ==========================================================================

  /**
   * Creates a new chart instance
   * @param container - HTMLElement or CSS selector string for the container
   * @param options - Chart configuration options
   * @param defaults - Default dimensions for this chart type
   */
  constructor(
    container: HTMLElement | string,
    options: TOptions,
    protected readonly defaults: DefaultDimensions
  ) {
    this.container = this.resolveContainer(container);
    this.options = options;
  }

  // ==========================================================================
  // Container Resolution
  // ==========================================================================

  /**
   * Resolves a container from either an HTMLElement or a CSS selector string
   * @param container - HTMLElement or CSS selector string
   * @returns The resolved HTMLElement
   * @throws Error if there is no DOM or the selector doesn't match any element
   */
  protected resolveContainer(container: HTMLElement | string): HTMLElement {
    if (typeof document === 'undefined') {
      throw new Error(
        'CyberCharts requires a DOM; create charts in the browser (e.g. after mount), not during server rendering'
      );
    }
    if (typeof container === 'string') {
      const el = document.querySelector(container);
      if (!el) {
        throw new Error(`Container not found: ${container}`);
      }
      return el as HTMLElement;
    }
    return container;
  }

  // ==========================================================================
  // Dimension Validation
  // ==========================================================================

  /**
   * Validates and normalizes chart dimensions
   * @param width - The width to validate
   * @param height - The height to validate
   * @param chartName - The chart type name for warning messages
   * @returns Validated dimensions object
   */
  protected validateDimensions(
    width: number,
    height: number,
    chartName: string
  ): { width: number; height: number } {
    if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
      console.warn(
        `${chartName}: Invalid dimensions provided, using defaults (${this.defaults.width}x${this.defaults.height})`
      );
      return { width: this.defaults.width, height: this.defaults.height };
    }
    return { width, height };
  }

  // ==========================================================================
  // SVG Root, Ids and Definitions
  // ==========================================================================

  /** Instance-scoped SVG id */
  protected ref(name: string): string {
    return `${this.uid}-${name}`;
  }

  /** `url(#id)` reference to an instance-scoped id */
  protected url(name: string): string {
    return `url(#${this.ref(name)})`;
  }

  /**
   * Replaces the container content with a fresh SVG root holding <title>,
   * <desc> and <defs>, and wires delegated interaction listeners.
   */
  protected createRoot(className: string, width: number, height: number): SVGSVGElement {
    clearElement(this.container);
    this.dataTable = null;

    const svg = createSVGRoot(width, height, { classPrefix: className });
    svg.removeAttribute('aria-label');
    // Chrome treats the overflow-clipped SVG root as a tab stop; the marks
    // inside carry keyboard focus instead
    svg.setAttribute('tabindex', '-1');
    svg.style.display = 'block';
    svg.style.fontFamily = uiColors.font;

    const title = createSVGElement('title', { id: this.ref('title') });
    const desc = createSVGElement('desc', { id: this.ref('desc') });
    svg.setAttribute('aria-labelledby', this.ref('title'));
    svg.setAttribute('aria-describedby', this.ref('desc'));
    this.defs = createDefs();
    svg.append(title, desc, this.defs);
    this.titleElement = title;
    this.descElement = desc;

    this.bindInteractions(svg);
    this.container.appendChild(svg);
    this.svg = svg;
    return svg;
  }

  /**
   * Re-applies size, definitions, responsiveness and content after an
   * options change.
   */
  protected refresh(): void {
    this.updateSVGDimensions(this.options.width ?? 0, this.options.height ?? 0);
    this.rebuildDefinitions();
    this.syncResponsive();
    this.render();
  }

  /** Empties <defs> and lets the chart refill it (after option changes) */
  protected rebuildDefinitions(): void {
    if (this.defs) {
      clearElement(this.defs);
      this.createDefinitions();
    }
  }

  /** Adds the shared glow filter (and scanlines pattern) to <defs> */
  protected addEffectDefinitions(glow: boolean | GlowConfig | undefined, scanlines = false): void {
    if (!this.defs) {
      return;
    }
    if (this.glowEnabled()) {
      const config = typeof glow === 'object' ? glow : {};
      this.defs.appendChild(createGlowFilter(this.ref('glow'), 'cyan', config));
    }
    if (scanlines) {
      this.defs.appendChild(createScanlinesPattern(this.ref('scanlines')));
    }
  }

  /** Applies the glow filter to a mark when glow is on */
  protected applyGlow(element: SVGElement): void {
    if (this.glowEnabled()) {
      element.setAttribute('filter', this.url('glow'));
    }
  }

  /**
   * Glow is decorative and blurs edges, so it is dropped in high-contrast
   * mode (OS setting or cybercore-css `[data-contrast="high"]`).
   */
  protected glowEnabled(): boolean {
    const glow = this.options.glow;
    const on = typeof glow === 'object' ? glow.enabled !== false : Boolean(glow);
    return on && !prefersHighContrast(this.container);
  }

  /** Whether the decorative scanlines overlay should render */
  protected scanlinesEnabled(): boolean {
    return Boolean(this.options.scanlines) && !prefersHighContrast(this.container);
  }

  /** Full-size scanlines overlay rect */
  protected createScanlinesOverlay(): SVGRectElement {
    const rect = createRect(0, 0, this.options.width ?? 0, this.options.height ?? 0, {
      fill: this.url('scanlines'),
    });
    rect.setAttribute('pointer-events', 'none');
    return rect;
  }

  // ==========================================================================
  // Animation
  // ==========================================================================

  /**
   * Checks if animations should be enabled. Respects the chart's animate
   * option, the OS reduced-motion preference and cybercore-css
   * `[data-motion="reduce"]` on any ancestor.
   */
  protected shouldAnimate(): boolean {
    const opts = this.options as BaseChartOptions;
    if (!opts.animate || opts.animation?.enabled === false) {
      return false;
    }
    return !prefersReducedMotion(this.container);
  }

  /** Asks the next render to play entry animations (first render, data updates) */
  protected requestEntryAnimation(): void {
    this.animateOnRender = true;
  }

  /**
   * Whether the current render plays entry animations. Consumes the request,
   * so re-renders for resizes do not replay them.
   */
  protected takeEntryAnimation(): boolean {
    const play = this.animateOnRender && this.shouldAnimate();
    this.animateOnRender = false;
    return play;
  }

  /**
   * Delay before the mark at `index` of `count` starts animating. The total
   * stagger never exceeds the animation duration, however many marks.
   */
  protected staggerDelay(index: number, count: number): number {
    const animation = this.options.animation ?? {};
    const duration = animation.duration ?? LAYOUT.ANIMATION.DEFAULT_DURATION;
    const stagger = animation.stagger ?? LAYOUT.ANIMATION.DEFAULT_STAGGER;
    const step = Math.min(stagger, duration / Math.max(1, count));
    return (animation.delay ?? 0) + index * step;
  }

  /**
   * Runs a callback on the next animation frame. Callbacks are batched into a
   * single frame and dropped on destroy.
   */
  protected nextFrame(callback: () => void): void {
    this.frameQueue.push(callback);
    if (this.queuedFrame !== null || typeof requestAnimationFrame !== 'function') {
      return;
    }
    this.queuedFrame = requestAnimationFrame(() => {
      const queue = this.frameQueue;
      this.frameQueue = [];
      this.queuedFrame = null;
      queue.forEach((run) => run());
    });
  }

  // ==========================================================================
  // Event Handling
  // ==========================================================================

  /**
   * Registers an event handler for a specific chart event type
   * @param event - The event type to listen for
   * @param handler - The callback function to execute when the event occurs
   */
  on<T = unknown>(event: ChartEventType, handler: ChartEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler as ChartEventHandler);
  }

  /**
   * Removes an event handler for a specific chart event type
   * @param event - The event type to stop listening for
   * @param handler - The specific handler to remove. If omitted, all handlers for the event are removed.
   */
  off(event: ChartEventType, handler?: ChartEventHandler): void {
    if (!handler) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.get(event)?.delete(handler);
    }
  }

  /**
   * Emits an event to all registered handlers
   * @param event - The event type to emit
   * @param data - The event data to pass to handlers
   */
  protected emit<T = unknown>(event: ChartEventType, data: ChartEvent<T>): void {
    this.eventHandlers.get(event)?.forEach((handler) => handler(data));
  }

  // ==========================================================================
  // Interactive Marks (mouse, focus, keyboard)
  // ==========================================================================

  /** Forgets the marks of the previous render; call at the start of render() */
  protected resetItems(): void {
    this.items = [];
    this.activeItem = null;
  }

  /** Whether marks are focusable */
  protected keyboardEnabled(): boolean {
    return (this.options as BaseChartOptions).keyboard !== false;
  }

  /**
   * Registers a data mark. With keyboard support on, the first mark is the
   * chart's single tab stop (roving tabindex) and each mark gets a label.
   */
  protected addItem(item: ChartItem): void {
    const index = this.items.length;
    this.items.push(item);
    item.element.setAttribute(ITEM_ATTRIBUTE, String(index));
    if (this.keyboardEnabled()) {
      item.element.setAttribute('tabindex', index === 0 ? '0' : '-1');
      item.element.setAttribute('role', 'img');
      item.element.setAttribute('aria-label', item.label);
    }
  }

  private itemFor(target: EventTarget | null): ChartItem | null {
    if (!this.svg || !target || typeof (target as Element).closest !== 'function') {
      return null;
    }
    const el = (target as Element).closest(`[${ITEM_ATTRIBUTE}]`);
    if (!el || !this.svg.contains(el)) {
      return null;
    }
    return this.items[Number(el.getAttribute(ITEM_ATTRIBUTE))] ?? null;
  }

  private enterItem(item: ChartItem, event?: MouseEvent): void {
    if (this.activeItem === item) {
      return;
    }
    this.activeItem?.leave();
    this.activeItem = item;
    item.enter(event);
  }

  private leaveActiveItem(): void {
    const item = this.activeItem;
    this.activeItem = null;
    item?.leave();
  }

  private focusItem(index: number): void {
    const target = this.items[Math.max(0, Math.min(this.items.length - 1, index))];
    if (!target) {
      return;
    }
    this.items.forEach((item) =>
      item.element.setAttribute('tabindex', item === target ? '0' : '-1')
    );
    target.element.focus();
  }

  private setFocusRing(element: SVGElement, on: boolean): void {
    if (on) {
      this.savedFocusStroke.set(element, [
        element.style.getPropertyValue('stroke'),
        element.style.getPropertyValue('stroke-width'),
      ]);
      element.style.setProperty('stroke', uiColors.focus);
      element.style.setProperty('stroke-width', '2');
      return;
    }
    const [stroke, width] = this.savedFocusStroke.get(element) ?? ['', ''];
    element.style.setProperty('stroke', stroke);
    element.style.setProperty('stroke-width', width);
  }

  private handleKey(event: KeyboardEvent): void {
    const item = this.itemFor(event.target);
    if (!item) {
      return;
    }
    const index = this.items.indexOf(item);
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: this.items.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      this.focusItem(moves[event.key]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      item.activate();
    } else if (event.key === 'Escape') {
      item.leave();
    }
  }

  private bindInteractions(svg: SVGSVGElement): void {
    svg.addEventListener('mouseover', (event) => {
      const item = this.itemFor(event.target);
      if (item) {
        this.enterItem(item, event);
      }
    });
    svg.addEventListener('mouseout', (event) => {
      if (this.activeItem && this.itemFor(event.relatedTarget) !== this.activeItem) {
        this.leaveActiveItem();
      }
    });
    svg.addEventListener('click', (event) => this.itemFor(event.target)?.activate(event));
    svg.addEventListener('focusin', (event) => {
      const item = this.itemFor(event.target);
      if (item) {
        this.setFocusRing(item.element, true);
        this.enterItem(item);
      }
    });
    svg.addEventListener('focusout', (event) => {
      const item = this.itemFor(event.target);
      if (item) {
        this.setFocusRing(item.element, false);
        if (this.activeItem === item) {
          this.leaveActiveItem();
        }
      }
    });
    svg.addEventListener('keydown', (event) => this.handleKey(event));
  }

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  /**
   * Tabular view of the data for the screen-reader table, or null for charts
   * that have none.
   */
  protected getTableData(): ChartDataTable | null {
    return null;
  }

  /**
   * Updates <title>, <desc>, the root role and the data table. Call at the
   * end of render() with a generated summary of the data.
   */
  protected updateAccessibility(name: string, summary: string): void {
    if (!this.svg || !this.titleElement || !this.descElement) {
      return;
    }
    const opts = this.options as BaseChartOptions;
    this.titleElement.textContent = opts.ariaLabel || name;
    this.descElement.textContent = opts.description || summary;
    // Focusable marks inside role="img" would be hidden from assistive tech
    const interactive = this.keyboardEnabled() && this.items.length > 0;
    this.svg.setAttribute('role', interactive ? 'group' : 'img');
    this.renderDataTable();
  }

  private renderDataTable(): void {
    const data =
      (this.options as BaseChartOptions).dataTable === false ? null : this.getTableData();
    const table = data ? createDataTable(data, `${this.classPrefix()}__table`) : null;
    if (this.dataTable) {
      this.dataTable.remove();
    }
    this.dataTable = table;
    if (table) {
      this.container.appendChild(table);
    }
  }

  // ==========================================================================
  // Tooltip
  // ==========================================================================

  private tooltipEnabled(): boolean {
    return (this.options as BaseChartOptions).tooltip?.enabled !== false;
  }

  /**
   * Shows the tooltip next to the pointer, or above the mark for keyboard focus
   * @param content - Element or plain text (strings are never parsed as HTML)
   */
  protected showTooltip(content: string | HTMLElement, anchor: Element, event?: MouseEvent): void {
    if (!this.tooltipEnabled()) {
      return;
    }
    if (!this.tooltipManager) {
      this.tooltipManager = new TooltipManager(this.container, { enabled: true });
    }
    if (event) {
      this.tooltipManager.show(content, event.clientX, event.clientY);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    this.tooltipManager.show(content, rect.left + rect.width / 2, rect.top);
  }

  /** Hides the tooltip */
  protected hideTooltip(): void {
    this.tooltipManager?.hide();
  }

  // ==========================================================================
  // Legend
  // ==========================================================================

  /**
   * Right-aligned single-row legend along the top edge, drawn into the chart
   * area. Names are shortened to their slot; the full name stays available
   * as a <title>.
   */
  protected renderLegend(entries: LegendEntry[], icon: 'line' | 'square'): void {
    if (!this.chartArea) {
      return;
    }
    const legend = createGroup(`${this.classPrefix()}__legend`);
    legend.setAttribute('aria-hidden', 'true');
    const { ITEM_SPACING, ICON_SIZE, TOP_MARGIN, ICON_TEXT_GAP } = LAYOUT.LEGEND;
    const width = this.options.width ?? 0;
    const y = TOP_MARGIN;

    entries.forEach((entry, i) => {
      const x = width - (entries.length - i) * ITEM_SPACING;
      legend.appendChild(
        icon === 'line'
          ? createLine(x, y, x + ICON_SIZE, y, { stroke: entry.color, strokeWidth: 2 })
          : createRect(x, y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE, { fill: entry.color, rx: 2 })
      );
      const textX = x + ICON_SIZE + ICON_TEXT_GAP;
      const maxWidth = ITEM_SPACING - ICON_SIZE - ICON_TEXT_GAP * 2;
      legend.appendChild(
        createText(textX, y, fitLabel(entry.name, maxWidth, 11), {
          fill: uiColors.text,
          fontSize: 11,
          textAnchor: 'start',
          className: `${this.classPrefix()}__legend-text`,
          title: entry.name,
        })
      );
    });

    this.chartArea.appendChild(legend);
  }

  // ==========================================================================
  // SVG Management
  // ==========================================================================

  /**
   * Gets the underlying SVG element
   * @returns The root SVG element
   * @throws Error if the chart has not been initialized
   */
  getSVG(): SVGSVGElement {
    if (!this.svg) {
      throw new Error('Chart not initialized');
    }
    return this.svg;
  }

  /**
   * Exports the chart as an SVG string. Theme colours are CSS custom
   * properties with built-in fallbacks, so the export renders standalone.
   * @returns The complete SVG markup as a string
   * @throws Error if the chart has not been initialized
   */
  toSVG(): string {
    if (!this.svg) {
      throw new Error('Chart not initialized');
    }
    return svgToString(this.svg);
  }

  // ==========================================================================
  // Responsive
  // ==========================================================================

  /** Starts or stops following the container size to match `responsive` */
  protected syncResponsive(): void {
    const wanted = Boolean(this.options.responsive);
    if (wanted && !this.responsiveManager) {
      this.responsiveManager = new ResponsiveManager(
        this.container,
        (width, height) => this.handleContainerResize(width, height),
        true
      );
      this.responsiveManager.setup();
    } else if (!wanted && this.responsiveManager) {
      this.responsiveManager.destroy();
      this.responsiveManager = null;
    }
  }

  /** Reacts to a container size change; charts with a fixed aspect override this */
  protected handleContainerResize(width: number, height: number): void {
    this.resize(Math.round(width), Math.round(height));
  }

  /**
   * Resizes the chart. Omitted or non-positive sizes keep the current value;
   * an unchanged size does nothing.
   * @param width - New width (optional)
   * @param height - New height (optional)
   */
  resize(width?: number, height?: number): void {
    if (!this.svg) {
      return;
    }
    const nextWidth = width && width > 0 ? width : (this.options.width ?? this.defaults.width);
    const nextHeight =
      height && height > 0 ? height : (this.options.height ?? this.defaults.height);
    if (nextWidth === this.options.width && nextHeight === this.options.height) {
      return;
    }
    this.options.width = nextWidth;
    this.options.height = nextHeight;
    this.updateSVGDimensions(nextWidth, nextHeight);
    this.render();
    this.emit('resize', {
      type: 'resize',
      target: null,
      data: { width: nextWidth, height: nextHeight },
    });
  }

  // ==========================================================================
  // Resource Cleanup
  // ==========================================================================

  /**
   * Destroys the chart and cleans up all resources: animation frames,
   * observers, tooltip, DOM and event handlers. Safe to call twice.
   */
  destroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.queuedFrame !== null) {
      cancelAnimationFrame(this.queuedFrame);
      this.queuedFrame = null;
    }
    this.frameQueue = [];

    this.responsiveManager?.destroy();
    this.responsiveManager = null;
    this.tooltipManager?.destroy();
    this.tooltipManager = null;

    if (this.svg) {
      clearElement(this.container);
    }

    this.svg = null;
    this.defs = null;
    this.chartArea = null;
    this.dataTable = null;
    this.titleElement = null;
    this.descElement = null;
    this.resetItems();
    this.eventHandlers.clear();
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /** CSS class prefix (BEM block) */
  protected classPrefix(): string {
    return this.options.classPrefix ?? 'cyber-chart';
  }

  /**
   * Gets the chart padding from options, with defaults
   * @returns The padding object with all sides defined
   */
  protected getPadding(): ChartPadding {
    const defaultPadding = LAYOUT.DEFAULT_PADDING;
    const padding = (this.options as BaseChartOptions).padding;
    return {
      top: padding?.top ?? defaultPadding.top,
      right: padding?.right ?? defaultPadding.right,
      bottom: padding?.bottom ?? defaultPadding.bottom,
      left: padding?.left ?? defaultPadding.left,
    };
  }

  /**
   * Updates the SVG size and viewBox
   * @param width - New width
   * @param height - New height
   */
  protected updateSVGDimensions(width: number, height: number): void {
    if (this.svg) {
      this.svg.setAttribute('width', String(width));
      this.svg.setAttribute('height', String(height));
      this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
  }

  // ==========================================================================
  // Abstract Methods
  // ==========================================================================

  /**
   * Renders the chart.
   * Must be implemented by each chart type to draw their specific visualization.
   */
  abstract render(): void;

  /**
   * Updates the chart with new data.
   * Must be implemented by each chart type to handle their specific data format.
   * @param data - The new data to display
   */
  abstract update(data: TData): void;

  /**
   * Fills `this.defs` with the chart's filters, gradients and patterns.
   * Called on init and whenever options change.
   */
  protected abstract createDefinitions(): void;
}

export default BaseChart;
