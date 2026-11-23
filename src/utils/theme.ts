/**
 * CyberCore Charts - Theme Tokens
 * Maps chart colours onto cybercore-css custom properties. Every colour is a
 * `var(--token, fallback)` string: with cybercore-css on the page the chart
 * follows its palette, `[data-theme]` accent and `[data-contrast]` overrides
 * live (no re-render needed); without it the built-in neon fallback applies.
 */

import { cyberColors } from './colors';

import type { ChartTheme } from '../types';

type Hue = Exclude<ChartTheme, 'accent'>;

/** Shade of a theme colour: light (300), base (500) or dark (700) */
export type ThemeShade = 'light' | 'base' | 'dark';

const SHADE_STEP: Record<ThemeShade, 300 | 500 | 700> = { light: 300, base: 500, dark: 700 };
const ACCENT_TOKEN: Record<ThemeShade, string> = {
  light: '--color-accent-light',
  base: '--color-accent',
  dark: '--color-accent-dark',
};

function cssVar(token: string, fallback: string): string {
  return `var(${token}, ${fallback})`;
}

/**
 * Colour for a chart theme. 'accent' reads the cybercore-css accent tokens;
 * named hues read `--cyber-<hue>-<step>`.
 */
export function themeColor(theme: ChartTheme = 'accent', shade: ThemeShade = 'base'): string {
  const step = SHADE_STEP[shade];
  if (theme === 'accent') {
    return cssVar(ACCENT_TOKEN[shade], cyberColors.cyan[step]);
  }
  const hue: Hue = theme in cyberColors ? theme : 'cyan';
  return cssVar(`--cyber-${hue}-${step}`, cyberColors[hue][step]);
}

/**
 * Categorical series palette, in fixed order. The order keeps neighbouring
 * series apart under protanopia and deuteranopia (adjacent OKLab ΔE ≥ 9 on
 * the void surface, checked with both the built-in and cybercore-css values).
 */
export const SERIES_PALETTE: ReadonlyArray<{ token: string; fallback: string }> = [
  { token: '--cyber-cyan-500', fallback: cyberColors.cyan[500] },
  { token: '--cyber-magenta-500', fallback: cyberColors.magenta[500] },
  { token: '--cyber-yellow-500', fallback: cyberColors.yellow[500] },
  { token: '--cyber-violet-500', fallback: '#a35cff' },
  { token: '--cyber-green-500', fallback: cyberColors.green[500] },
  { token: '--cyber-amber-500', fallback: '#ffb000' },
];

/**
 * Colour of the series at `index`. Starts at the given theme's hue (cyan for
 * 'accent') and repeats after the palette ends rather than inventing hues.
 */
export function seriesColor(index: number, startTheme: ChartTheme = 'accent'): string {
  const startToken = `--cyber-${startTheme}-500`;
  const start = Math.max(
    0,
    SERIES_PALETTE.findIndex((entry) => entry.token === startToken)
  );
  const entry = SERIES_PALETTE[(start + index) % SERIES_PALETTE.length];
  return cssVar(entry.token, entry.fallback);
}

/**
 * Non-data colours, mapped to cybercore-css semantic tokens. High-contrast
 * mode in cybercore-css raises text and border tokens, so charts follow it.
 */
export const uiColors = {
  /** Tick labels, legend text */
  text: cssVar('--color-text-secondary', cyberColors.chrome[200]),
  /** Secondary labels */
  textMuted: cssVar('--color-text-muted', cyberColors.chrome[400]),
  /** Axis lines */
  axis: cssVar('--color-border-strong', 'rgba(173, 181, 189, 0.4)'),
  /** Grid lines */
  grid: cssVar('--color-border-default', 'rgba(108, 117, 125, 0.2)'),
  /** Chart surface */
  background: cssVar('--color-bg-primary', cyberColors.void[500]),
  /** Tooltip surface */
  tooltipBg: cssVar('--color-bg-elevated', 'rgba(10, 10, 30, 0.95)'),
  /** Tooltip border */
  tooltipBorder: cssVar('--color-border-accent', 'rgba(0, 240, 255, 0.3)'),
  /** Tooltip text */
  tooltipText: cssVar('--color-text-primary', cyberColors.chrome[100]),
  /** Keyboard focus ring */
  focus: cssVar('--focus-ring-color', '#ffffff'),
  /** Chart typeface */
  font: cssVar('--font-mono', "'JetBrains Mono', 'Fira Code', monospace"),
} as const;

/**
 * Accepts colour strings only (hex, names, rgb()/hsl(), var()). Rejects
 * anything that could close a CSS declaration or load a resource.
 */
export function safeColor(value: string, fallback = 'currentColor'): string {
  return /^[#\w\s(),.%+-]+$/.test(value) && !/url\s*\(/i.test(value) ? value : fallback;
}

function matchesMedia(query: string): boolean {
  return typeof matchMedia === 'function' && matchMedia(query).matches;
}

/** Reduced motion from the OS or a cybercore-css `[data-motion="reduce"]` ancestor */
export function prefersReducedMotion(element: Element): boolean {
  return (
    matchesMedia('(prefers-reduced-motion: reduce)') ||
    element.closest('[data-motion="reduce"]') !== null
  );
}

/** High contrast from the OS or a cybercore-css `[data-contrast="high"]` ancestor */
export function prefersHighContrast(element: Element): boolean {
  return (
    matchesMedia('(prefers-contrast: more)') || element.closest('[data-contrast="high"]') !== null
  );
}
