/**
 * CyberCore Charts - Tooltip Manager
 * Manages tooltip creation, positioning, and display for charts
 * Follows SRP by handling only tooltip-related concerns
 */

import { LAYOUT } from '../constants';

import { safeColor, uiColors } from './theme';

// ============================================================================
// Types
// ============================================================================

export interface TooltipOptions {
  enabled: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  padding?: string;
  borderRadius?: string;
  fontSize?: string;
  zIndex?: number;
}

type RequiredTooltipOptions = Required<TooltipOptions>;

// ============================================================================
// TooltipManager Class
// ============================================================================

/**
 * Manages tooltip creation, positioning, and display for charts
 * Follows SRP by handling only tooltip-related concerns
 */
export class TooltipManager {
  private element: HTMLDivElement | null = null;
  private container: HTMLElement;
  private options: RequiredTooltipOptions;

  constructor(container: HTMLElement, options: Partial<TooltipOptions> = {}) {
    this.container = container;
    this.options = {
      enabled: true,
      backgroundColor: uiColors.tooltipBg,
      textColor: uiColors.tooltipText,
      borderColor: uiColors.tooltipBorder,
      padding: '10px 14px',
      borderRadius: '4px',
      fontSize: '13px',
      zIndex: 1000,
      ...options,
    };
  }

  /**
   * Create the tooltip DOM element.
   * This is called automatically on first show() if not called manually.
   * Can be called explicitly for eager initialization if desired.
   */
  create(): void {
    if (!this.options.enabled || this.element) {
      return;
    }

    this.element = document.createElement('div');
    this.element.className = 'cyber-chart-tooltip';
    this.element.setAttribute('role', 'tooltip');
    this.element.style.cssText = `
      position: fixed;
      pointer-events: none;
      background: ${this.options.backgroundColor};
      color: ${this.options.textColor};
      padding: ${this.options.padding};
      border-radius: ${this.options.borderRadius};
      font-size: ${this.options.fontSize};
      font-family: ${uiColors.font};
      border: 1px solid ${this.options.borderColor};
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      z-index: ${this.options.zIndex};
      opacity: 0;
      transition: opacity 0.15s ease;
    `;
    document.body.appendChild(this.element);
  }

  /**
   * Ensures the tooltip element exists, creating it lazily if needed.
   * This saves DOM nodes for charts that never get hovered.
   * @returns the element, or null when tooltips are disabled
   */
  private ensureElement(): HTMLDivElement | null {
    if (!this.options.enabled) {
      return null;
    }
    if (!this.element) {
      this.create();
    }
    return this.element;
  }

  /**
   * Show the tooltip with content at specified position.
   * The tooltip DOM element is created lazily on first hover,
   * saving DOM nodes for charts that never get hovered.
   * @param content - HTML element or safe text content
   * @param x - X coordinate (viewport-relative)
   * @param y - Y coordinate (viewport-relative)
   */
  show(content: HTMLElement | string, x: number, y: number): void {
    // Lazy creation on first show
    const element = this.ensureElement();
    if (!element) {
      return;
    }

    // Clear existing content
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }

    // Add new content safely
    if (typeof content === 'string') {
      element.textContent = content;
    } else {
      element.appendChild(content);
    }

    // Position with viewport boundary detection
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { OFFSET_X, OFFSET_Y, BOUNDARY_THRESHOLD } = LAYOUT.TOOLTIP;

    let left = x + OFFSET_X;
    let top = y - OFFSET_Y;

    // Flip if too close to right edge
    if (left + rect.width > viewportWidth - BOUNDARY_THRESHOLD) {
      left = x - rect.width - OFFSET_X;
    }

    // Flip if too close to bottom edge
    if (top + rect.height > viewportHeight - BOUNDARY_THRESHOLD) {
      top = y - rect.height - OFFSET_Y;
    }

    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.opacity = '1';
  }

  /**
   * Hide the tooltip
   */
  hide(): void {
    if (this.element) {
      this.element.style.opacity = '0';
    }
  }

  /**
   * Destroy the tooltip and clean up
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }

  /**
   * Check if tooltip is enabled
   */
  isEnabled(): boolean {
    return this.options.enabled;
  }

  /**
   * Get the tooltip DOM element (if created)
   */
  getElement(): HTMLDivElement | null {
    return this.element;
  }

  /**
   * Get the container element
   */
  getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * Colour swatch for tooltip rows. The colour goes through safeColor so a
   * series colour cannot inject further CSS.
   */
  private static swatch(color: string, borderRadius: string): HTMLSpanElement {
    const swatch = document.createElement('span');
    swatch.style.cssText = `display: inline-block; width: 10px; height: 10px; border-radius: ${borderRadius};`;
    swatch.style.setProperty('background', safeColor(color));
    return swatch;
  }

  /**
   * Helper to create tooltip content with color indicator
   * @param color - The color for the indicator dot
   * @param label - The label text
   * @param value - The value to display
   * @param extraInfo - Optional extra information to display
   */
  static createColoredContent(
    color: string,
    label: string,
    value: string | number,
    extraInfo?: string
  ): HTMLElement {
    const container = document.createElement('div');

    // Header with color indicator
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 4px;';

    header.appendChild(TooltipManager.swatch(color, '50%'));

    const labelEl = document.createElement('strong');
    labelEl.textContent = label;
    header.appendChild(labelEl);

    container.appendChild(header);

    // Value row
    const valueRow = document.createElement('div');
    const valueEl = document.createElement('strong');
    valueEl.textContent = String(value);
    valueRow.appendChild(valueEl);
    container.appendChild(valueRow);

    // Extra info (optional)
    if (extraInfo) {
      const extraRow = document.createElement('div');
      extraRow.style.cssText = 'margin-top: 4px; opacity: 0.7; font-size: 11px;';
      extraRow.textContent = extraInfo;
      container.appendChild(extraRow);
    }

    return container;
  }

  /**
   * Helper to create tooltip content for data points (used by LineChart and BarChart)
   * @param seriesName - The name of the series
   * @param color - The color for the indicator
   * @param xLabel - The X-axis label
   * @param yValue - The Y-axis value
   * @param indicatorShape - Shape of the color indicator ('circle' | 'square')
   */
  static createDataPointContent(
    seriesName: string,
    color: string,
    xLabel: string,
    yValue: number | string,
    indicatorShape: 'circle' | 'square' = 'circle'
  ): HTMLElement {
    const container = document.createElement('div');

    // Header row with color indicator and series name
    const headerRow = document.createElement('div');
    headerRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 4px;';

    const colorIndicator = TooltipManager.swatch(
      color,
      indicatorShape === 'circle' ? '50%' : '2px'
    );

    const seriesNameEl = document.createElement('strong');
    seriesNameEl.textContent = seriesName;

    headerRow.appendChild(colorIndicator);
    headerRow.appendChild(seriesNameEl);

    // Value row
    const valueRow = document.createElement('div');
    const labelText = document.createTextNode(`${xLabel}: `);
    const valueSpan = document.createElement('strong');
    valueSpan.textContent = String(yValue);

    valueRow.appendChild(labelText);
    valueRow.appendChild(valueSpan);

    container.appendChild(headerRow);
    container.appendChild(valueRow);

    return container;
  }

  /**
   * Helper to create tooltip content for donut/pie chart segments
   * @param label - The segment label
   * @param color - The segment color
   * @param value - The segment value
   * @param percentage - The percentage string (e.g., "25.5%")
   */
  static createSegmentContent(
    label: string,
    color: string,
    value: number | string,
    percentage: string
  ): HTMLElement {
    const container = document.createElement('div');

    // Header row with color indicator and label
    const headerRow = document.createElement('div');
    headerRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 4px;';

    const colorIndicator = TooltipManager.swatch(color, '2px');

    const labelName = document.createElement('strong');
    labelName.textContent = label;

    headerRow.appendChild(colorIndicator);
    headerRow.appendChild(labelName);

    // Value row
    const valueRow = document.createElement('div');
    const valueLabel = document.createTextNode('Value: ');
    const valueSpan = document.createElement('strong');
    valueSpan.textContent = String(value);
    valueRow.appendChild(valueLabel);
    valueRow.appendChild(valueSpan);

    // Percentage row
    const percentRow = document.createElement('div');
    const percentLabel = document.createTextNode('Percentage: ');
    const percentSpan = document.createElement('strong');
    percentSpan.textContent = percentage;
    percentRow.appendChild(percentLabel);
    percentRow.appendChild(percentSpan);

    container.appendChild(headerRow);
    container.appendChild(valueRow);
    container.appendChild(percentRow);

    return container;
  }
}

export default TooltipManager;
