/**
 * CyberCore Charts - Base Chart
 * Abstract base class that provides common functionality for all chart types.
 * Eliminates code duplication and follows SRP/SOLID principles.
 */

import { chartColors } from '../utils/colors';
import { clearElement, svgToString } from '../utils/svg';

import type {
  BaseChartOptions,
  ChartEvent,
  ChartEventHandler,
  ChartEventType,
  ChartPadding,
} from '../types';

// ============================================================================
// Default Dimensions
// ============================================================================

/**
 * Default chart dimensions used when invalid dimensions are provided
 */
export interface DefaultDimensions {
  width: number;
  height: number;
}

// ============================================================================
// BaseChart Abstract Class
// ============================================================================

/**
 * Abstract base class for all CyberCore chart types.
 * Provides common functionality including:
 * - Container resolution (string selector or HTMLElement)
 * - Dimension validation
 * - Event handling (on/off/emit)
 * - SVG management (getSVG/toSVG)
 * - Animation preference checking (prefers-reduced-motion)
 * - Responsive behavior setup
 * - Tooltip management
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

  /** ResizeObserver for responsive behavior */
  protected resizeObserver: ResizeObserver | null = null;

  /** Animation frame ID for cleanup */
  protected animationFrame: number | null = null;

  /** Tooltip element */
  protected tooltipElement: HTMLDivElement | null = null;

  /** Merged options with defaults */
  protected options: TOptions;

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
   * @throws Error if the selector doesn't match any element
   */
  protected resolveContainer(container: HTMLElement | string): HTMLElement {
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
  // Animation Check
  // ==========================================================================

  /**
   * Checks if animations should be enabled.
   * Respects both the chart's animate option and the user's prefers-reduced-motion preference.
   * @returns true if animations should be played, false otherwise
   */
  protected shouldAnimate(): boolean {
    // Check if animations are disabled in options
    // Cast to any to access animate property which may not be on all TOptions
    const opts = this.options as BaseChartOptions;
    if (!opts.animate) {
      return false;
    }

    // Check for prefers-reduced-motion preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    return true;
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
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.add(handler as ChartEventHandler);
    }
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
    this.eventHandlers.get(event)?.forEach((handler) => handler(data as ChartEvent));
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
   * Exports the chart as an SVG string
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
  // Responsive Setup
  // ==========================================================================

  /**
   * Sets up responsive behavior using ResizeObserver.
   * When the container resizes, the chart will be resized accordingly.
   */
  protected setupResponsive(): void {
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
  // Tooltip Management
  // ==========================================================================

  /**
   * Creates a tooltip element and appends it to the document body
   * @param classPrefix - CSS class prefix for the tooltip
   */
  protected createTooltip(classPrefix: string): void {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = `${classPrefix}__tooltip`;
    this.tooltipElement.style.cssText = `
      position: absolute;
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

  /**
   * Shows the tooltip with the specified content at the given position
   * @param content - String or HTMLElement content for the tooltip
   * @param x - X position relative to the container
   * @param y - Y position relative to the container
   */
  protected showTooltip(content: string | HTMLElement, x: number, y: number): void {
    if (!this.tooltipElement) {
      return;
    }

    // Clear existing content safely
    while (this.tooltipElement.firstChild) {
      this.tooltipElement.removeChild(this.tooltipElement.firstChild);
    }

    // Add new content safely
    if (typeof content === 'string') {
      // For custom formatter strings, use textContent to prevent XSS
      this.tooltipElement.textContent = content;
    } else {
      this.tooltipElement.appendChild(content);
    }
    this.tooltipElement.style.opacity = '1';

    // Position tooltip
    const rect = this.container.getBoundingClientRect();
    this.tooltipElement.style.left = `${rect.left + x + 15}px`;
    this.tooltipElement.style.top = `${rect.top + y - 10}px`;
  }

  /**
   * Hides the tooltip
   */
  protected hideTooltip(): void {
    if (!this.tooltipElement) {
      return;
    }
    this.tooltipElement.style.opacity = '0';
  }

  // ==========================================================================
  // Resource Cleanup
  // ==========================================================================

  /**
   * Destroys the chart and cleans up all resources.
   * Disconnects observers, removes DOM elements, and clears event handlers.
   */
  destroy(): void {
    // Cancel any pending animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Remove tooltip from DOM
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
      this.tooltipElement = null;
    }

    // Clear the container
    clearElement(this.container);

    // Clear references
    this.svg = null;
    this.defs = null;
    this.chartArea = null;

    // Clear event handlers
    this.eventHandlers.clear();
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Gets the chart padding from options, with defaults
   * @returns The padding object with all sides defined
   */
  protected getPadding(): ChartPadding {
    const defaultPadding: ChartPadding = { top: 20, right: 20, bottom: 40, left: 50 };
    const opts = this.options as BaseChartOptions;
    return {
      top: opts.padding?.top ?? defaultPadding.top,
      right: opts.padding?.right ?? defaultPadding.right,
      bottom: opts.padding?.bottom ?? defaultPadding.bottom,
      left: opts.padding?.left ?? defaultPadding.left,
    };
  }

  /**
   * Updates the SVG viewBox after resize
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
   * Resizes the chart to new dimensions.
   * Must be implemented by each chart type to handle resize logic.
   * @param width - New width (optional)
   * @param height - New height (optional)
   */
  abstract resize(width?: number, height?: number): void;

  /**
   * Creates SVG definitions (filters, gradients, patterns).
   * Must be implemented by each chart type to define their required SVG defs.
   */
  protected abstract createDefinitions(): void;
}

export default BaseChart;
