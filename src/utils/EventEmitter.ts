/**
 * CyberCore Charts - Event Emitter
 * Reusable event handling mixin for chart classes
 */

import type { ChartEvent, ChartEventHandler, ChartEventType } from '../types';

/**
 * Event emitter mixin for chart classes
 * Provides on/off/emit functionality for chart events
 */
export class ChartEventEmitter {
  private eventHandlers: Map<ChartEventType, Set<ChartEventHandler>> = new Map();

  /**
   * Register an event handler
   * @param event - The event type to listen for
   * @param handler - Callback function to execute when the event occurs
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
   * Remove an event handler
   * @param event - The event type to stop listening for
   * @param handler - The specific handler to remove (if omitted, removes all handlers for the event)
   */
  off(event: ChartEventType, handler?: ChartEventHandler): void {
    if (!handler) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.get(event)?.delete(handler);
    }
  }

  /**
   * Emit an event to all registered handlers
   * @param event - The event type to emit
   * @param data - The event data to pass to handlers
   */
  protected emit<T = unknown>(event: ChartEventType, data: ChartEvent<T>): void {
    this.eventHandlers.get(event)?.forEach((handler) => handler(data as ChartEvent));
  }

  /**
   * Clear all event handlers
   */
  protected clearEventHandlers(): void {
    this.eventHandlers.clear();
  }

  /**
   * Check if there are any handlers for an event
   */
  hasListeners(event: ChartEventType): boolean {
    return (this.eventHandlers.get(event)?.size ?? 0) > 0;
  }
}
