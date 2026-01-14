/**
 * CyberCore Charts - Constants
 * Named constants for layout, positioning, and animation values
 */

/**
 * Layout constants for chart elements
 */
export const LAYOUT = {
  /** Default padding for charts */
  DEFAULT_PADDING: { top: 20, right: 20, bottom: 40, left: 50 },

  /** Legend positioning */
  LEGEND: {
    ITEM_SPACING: 100,
    ICON_SIZE: 12,
    TOP_MARGIN: 15,
    RIGHT_MARGIN: 20,
    ICON_TEXT_GAP: 8,
  },

  /** Tooltip positioning */
  TOOLTIP: {
    OFFSET_X: 15,
    OFFSET_Y: 10,
    BOUNDARY_THRESHOLD: 10,
  },

  /** Animation defaults */
  ANIMATION: {
    DEFAULT_DURATION: 800,
    DEFAULT_STAGGER: 50,
    DEFAULT_DELAY: 0,
  },
} as const;
