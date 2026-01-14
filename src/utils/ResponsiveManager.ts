/**
 * CyberCore Charts - Responsive Manager
 * Handles responsive behavior for charts using ResizeObserver
 */

/**
 * Callback type for resize events
 */
export type ResizeCallback = (width: number, height: number) => void;

/**
 * Options for ResponsiveManager
 */
export interface ResponsiveManagerOptions {
  /**
   * Throttle interval in milliseconds (default: 16ms for ~60fps).
   * Set to 0 to disable throttling.
   */
  throttleMs?: number;
}

/**
 * Manages responsive behavior for charts using ResizeObserver
 * Follows SRP by handling only resize-related concerns
 */
export class ResponsiveManager {
  private resizeObserver: ResizeObserver | null = null;
  private container: HTMLElement;
  private callback: ResizeCallback;
  private enabled: boolean;
  private windowResizeHandler: (() => void) | null = null;
  private throttleMs: number;
  private rafId: number | null = null;
  private pendingResize: { width: number; height: number } | null = null;
  private lastResizeTime: number = 0;

  constructor(
    container: HTMLElement,
    callback: ResizeCallback,
    enabled: boolean = false,
    options: ResponsiveManagerOptions = {}
  ) {
    this.container = container;
    this.callback = callback;
    this.enabled = enabled;
    this.throttleMs = options.throttleMs ?? 16; // Default ~60fps
  }

  /**
   * Throttled callback wrapper using requestAnimationFrame
   * Ensures smooth resizing at max 60fps
   */
  private throttledCallback(width: number, height: number): void {
    // Store the pending resize dimensions
    this.pendingResize = { width, height };

    // If throttling is disabled, call directly
    if (this.throttleMs <= 0) {
      this.callback(width, height);
      return;
    }

    // If we already have a RAF scheduled, skip (it will use the latest pending values)
    if (this.rafId !== null) {
      return;
    }

    const now = performance.now();
    const timeSinceLastResize = now - this.lastResizeTime;

    // If enough time has passed, execute immediately
    if (timeSinceLastResize >= this.throttleMs) {
      this.executeResize();
      return;
    }

    // Schedule the resize for the next animation frame
    this.rafId = requestAnimationFrame(() => {
      this.executeResize();
    });
  }

  /**
   * Execute the pending resize callback
   */
  private executeResize(): void {
    this.rafId = null;
    this.lastResizeTime = performance.now();

    if (this.pendingResize) {
      const { width, height } = this.pendingResize;
      this.pendingResize = null;
      this.callback(width, height);
    }
  }

  /**
   * Set up the ResizeObserver if responsive is enabled
   * Includes fallback for browsers without ResizeObserver support
   */
  setup(): void {
    if (!this.enabled) {
      return;
    }

    if (typeof window === 'undefined') {
      return; // SSR guard
    }

    // Check for ResizeObserver support at runtime
    // Using typeof check to avoid TypeScript's type narrowing issues
    const hasResizeObserver = typeof ResizeObserver !== 'undefined';

    if (hasResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.throttledCallback(width, height);
          }
        }
      });
      this.resizeObserver.observe(this.container);
    } else {
      // Fallback for older browsers - use window resize
      this.windowResizeHandler = () => {
        const rect = this.container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          this.throttledCallback(rect.width, rect.height);
        }
      };
      window.addEventListener('resize', this.windowResizeHandler);
    }
  }

  /**
   * Enable responsive behavior
   */
  enable(): void {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    this.setup();
  }

  /**
   * Disable responsive behavior
   */
  disable(): void {
    this.destroy();
    this.enabled = false;
  }

  /**
   * Check if responsive is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the current throttle interval
   */
  getThrottleMs(): number {
    return this.throttleMs;
  }

  /**
   * Set the throttle interval
   * @param ms - Throttle interval in milliseconds
   */
  setThrottleMs(ms: number): void {
    this.throttleMs = Math.max(0, ms);
  }

  /**
   * Clean up the ResizeObserver
   */
  destroy(): void {
    // Cancel any pending RAF
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.pendingResize = null;

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clean up fallback handler if it exists
    if (this.windowResizeHandler) {
      window.removeEventListener('resize', this.windowResizeHandler);
      this.windowResizeHandler = null;
    }
  }
}
