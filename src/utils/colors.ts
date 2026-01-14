/**
 * CyberCore Charts - Color Utilities
 * Cyberpunk color palette and helper functions
 */

import type { ChartTheme, CyberColorPalette } from '../types';

// ============================================================================
// Cyberpunk Color Palette
// ============================================================================

/**
 * Complete cyberpunk color palette with all shades
 */
export const cyberColors: CyberColorPalette = {
  cyan: {
    50: '#e0ffff',
    100: '#b3ffff',
    200: '#80ffff',
    300: '#4dffff',
    400: '#1affff',
    500: '#00f0ff',
    600: '#00c4d4',
    700: '#0098a8',
    800: '#006c7d',
    900: '#004051',
  },
  magenta: {
    50: '#ffe0f0',
    100: '#ffb3da',
    200: '#ff80c4',
    300: '#ff4dae',
    400: '#ff1a98',
    500: '#ff00aa',
    600: '#d4008c',
    700: '#a8006e',
    800: '#7d0050',
    900: '#510032',
  },
  green: {
    50: '#e0fff2',
    100: '#b3ffdf',
    200: '#80ffcc',
    300: '#4dffb9',
    400: '#1affa6',
    500: '#00ff88',
    600: '#00d470',
    700: '#00a858',
    800: '#007d40',
    900: '#005128',
  },
  yellow: {
    50: '#fffde0',
    100: '#fffbb3',
    200: '#fff980',
    300: '#fff74d',
    400: '#fff51a',
    500: '#f0ff00',
    600: '#c4d400',
    700: '#98a800',
    800: '#6c7d00',
    900: '#405100',
  },
  void: {
    50: '#1a1a2e',
    100: '#16162a',
    200: '#121226',
    300: '#0e0e22',
    400: '#0a0a1e',
    500: '#06061a',
    600: '#050516',
    700: '#040412',
    800: '#03030e',
    900: '#02020a',
  },
  chrome: {
    50: '#f8f9fa',
    100: '#e9ecef',
    200: '#dee2e6',
    300: '#ced4da',
    400: '#adb5bd',
    500: '#6c757d',
    600: '#495057',
    700: '#343a40',
    800: '#212529',
    900: '#121416',
  },
};

// ============================================================================
// Theme Color Accessors
// ============================================================================

/**
 * Get the primary color for a theme
 */
export function getThemeColor(
  theme: ChartTheme,
  shade: keyof typeof cyberColors.cyan = 500
): string {
  return cyberColors[theme][shade];
}

/**
 * Get the theme color as RGB values
 */
export function getThemeColorRGB(
  theme: ChartTheme,
  shade: keyof typeof cyberColors.cyan = 500
): { r: number; g: number; b: number } {
  const hex = cyberColors[theme][shade];
  return hexToRGB(hex);
}

/**
 * Get a lighter variant of the theme color
 */
export function getThemeColorLight(theme: ChartTheme): string {
  return cyberColors[theme][300];
}

/**
 * Get a darker variant of the theme color
 */
export function getThemeColorDark(theme: ChartTheme): string {
  return cyberColors[theme][700];
}

/**
 * Get the glow color for a theme (typically the brightest shade)
 */
export function getGlowColor(theme: ChartTheme): string {
  return cyberColors[theme][400];
}

// ============================================================================
// Color Conversion Utilities
// ============================================================================

/**
 * Convert hex color to RGB object
 */
export function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex color to RGBA string
 */
export function hexToRGBA(hex: string, alpha: number = 1): string {
  const { r, g, b } = hexToRGB(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Convert HSL to RGB
 */
export function hslToRGB(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Convert RGB to HSL
 */
export function rgbToHSL(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return { h, s: s * 100, l: l * 100 };
}

// ============================================================================
// Color Manipulation
// ============================================================================

/**
 * Lighten a color by a percentage
 */
export function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRGB(hex);
  const factor = 1 + amount;
  return rgbToHex(r * factor, g * factor, b * factor);
}

/**
 * Darken a color by a percentage
 */
export function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRGB(hex);
  const factor = 1 - amount;
  return rgbToHex(r * factor, g * factor, b * factor);
}

/**
 * Adjust color opacity
 */
export function withOpacity(hex: string, opacity: number): string {
  return hexToRGBA(hex, opacity);
}

/**
 * Mix two colors together
 */
export function mixColors(color1: string, color2: string, weight: number = 0.5): string {
  const rgb1 = hexToRGB(color1);
  const rgb2 = hexToRGB(color2);

  const r = rgb1.r * (1 - weight) + rgb2.r * weight;
  const g = rgb1.g * (1 - weight) + rgb2.g * weight;
  const b = rgb1.b * (1 - weight) + rgb2.b * weight;

  return rgbToHex(r, g, b);
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getContrastColor(hex: string): string {
  const { r, g, b } = hexToRGB(hex);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// ============================================================================
// Theme-based Color Generation
// ============================================================================

/**
 * Generate a color palette for multiple series
 */
export function generateSeriesColors(count: number, startTheme: ChartTheme = 'cyan'): string[] {
  const themes: ChartTheme[] = ['cyan', 'magenta', 'green', 'yellow'];
  const startIndex = themes.indexOf(startTheme);
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    const themeIndex = (startIndex + i) % themes.length;
    const theme = themes[themeIndex];
    // Vary the shade slightly for visual distinction
    const shadeIndex = (5 - Math.floor(i / themes.length)) as keyof typeof cyberColors.cyan;
    const shade = Math.max(300, Math.min(700, shadeIndex * 100)) as keyof typeof cyberColors.cyan;
    colors.push(cyberColors[theme][shade] || cyberColors[theme][500]);
  }

  return colors;
}

/**
 * Get gradient stops for a theme
 */
export function getThemeGradient(theme: ChartTheme): { start: string; end: string } {
  return {
    start: cyberColors[theme][400],
    end: cyberColors[theme][600],
  };
}

/**
 * Create CSS gradient string
 */
export function createGradient(
  theme: ChartTheme,
  direction: 'horizontal' | 'vertical' | 'radial' = 'vertical'
): string {
  const { start, end } = getThemeGradient(theme);

  if (direction === 'radial') {
    return `radial-gradient(circle, ${start}, ${end})`;
  }

  const angle = direction === 'horizontal' ? '90deg' : '180deg';
  return `linear-gradient(${angle}, ${start}, ${end})`;
}

// ============================================================================
// Glow Effect Colors
// ============================================================================

/**
 * Get glow filter color for SVG
 */
export function getGlowFilterColor(theme: ChartTheme): string {
  return cyberColors[theme][400];
}

/**
 * Get box shadow for glow effect
 */
export function getGlowShadow(theme: ChartTheme, intensity: number = 1, blur: number = 10): string {
  const color = cyberColors[theme][500];
  const alpha = Math.min(1, 0.5 * intensity);
  return `0 0 ${blur}px ${hexToRGBA(color, alpha)}, 0 0 ${blur * 2}px ${hexToRGBA(color, alpha * 0.5)}`;
}

// ============================================================================
// Color Constants for Chart Elements
// ============================================================================

export const chartColors = {
  /** Background color for charts */
  background: cyberColors.void[500],
  /** Grid line color */
  grid: hexToRGBA(cyberColors.chrome[500], 0.2),
  /** Axis line color */
  axis: hexToRGBA(cyberColors.chrome[400], 0.4),
  /** Text color */
  text: cyberColors.chrome[200],
  /** Muted text color */
  textMuted: cyberColors.chrome[400],
  /** Tooltip background */
  tooltipBg: hexToRGBA(cyberColors.void[400], 0.95),
  /** Tooltip border */
  tooltipBorder: cyberColors.chrome[600],
} as const;

export default cyberColors;
