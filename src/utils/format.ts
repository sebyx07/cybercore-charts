/**
 * CyberCore Charts - Label Formatting
 * Locale-aware number/date formatting and label fitting.
 */

const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();

/**
 * Formats a number for display (grouping, at most two decimals).
 * @param locale - BCP 47 locale; the runtime default when omitted
 */
export function formatNumber(value: number, locale?: string): string {
  if (!Number.isFinite(value)) {
    return '';
  }
  const key = locale ?? '';
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    numberFormats.set(key, format);
  }
  return format.format(value);
}

/**
 * Formats a date (or epoch milliseconds) as a short calendar date.
 * @param locale - BCP 47 locale; the runtime default when omitted
 */
export function formatDate(value: Date | number, locale?: string): string {
  const key = locale ?? '';
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    dateFormats.set(key, format);
  }
  return format.format(value);
}

/** Average glyph width relative to font size, for monospace-ish chart fonts */
const GLYPH_WIDTH = 0.6;

/** Estimated rendered width of a label, in pixels */
export function textWidth(text: string, fontSize: number): number {
  return Array.from(text).length * fontSize * GLYPH_WIDTH;
}

/**
 * Shortens a label so it fits in `maxWidth` pixels, ending it with an
 * ellipsis when cut. Widths are estimated (no layout pass), so the result
 * is stable in SSR, tests and detached nodes.
 */
export function fitLabel(text: string, maxWidth: number, fontSize: number): string {
  const maxChars = Math.floor(maxWidth / (fontSize * GLYPH_WIDTH));
  const chars = Array.from(text);
  if (chars.length <= maxChars) {
    return text;
  }
  return maxChars <= 1 ? '…' : `${chars.slice(0, maxChars - 1).join('')}…`;
}
