/**
 * CyberCore Charts - CDN/UMD Entry Point
 * This file is the entry point for the UMD bundle that attaches to window.CyberCharts
 *
 * Usage in browser:
 * <script src="https://unpkg.com/cybercore-charts/dist/cybercore-charts.umd.min.js"></script>
 * <script>
 *   const chart = CyberCharts.createChart('line', '#chart', { data: [...] });
 * </script>
 */

// Import chart classes
import { LineChart } from './charts/LineChart';
import { BarChart } from './charts/BarChart';
import { GaugeChart } from './charts/GaugeChart';
import { DonutChart } from './charts/DonutChart';
import { Sparkline } from './charts/Sparkline';

// Import factory function
import { createChart } from './index';

// Import color utilities
import {
  cyberColors,
  getThemeColor,
  getThemeColorRGB,
  getThemeColorLight,
  getThemeColorDark,
  getGlowColor,
  hexToRGB,
  rgbToHex,
  hexToRGBA,
  lighten,
  darken,
  withOpacity,
  mixColors,
  getContrastColor,
  generateSeriesColors,
  getThemeGradient,
  createGradient,
  getGlowShadow,
  chartColors,
} from './utils/colors';

// Import math utilities
import {
  lerp,
  clamp,
  scale,
  round,
  sum,
  mean,
  median,
  easings,
  getEasing,
} from './utils/math';

// Import version
import { VERSION } from './index';

/**
 * CyberCharts namespace for UMD builds
 * Attaches to window.CyberCharts in browser environments
 */
const CyberCharts = {
  // Factory function (recommended API)
  createChart,

  // Chart classes (for advanced usage)
  LineChart,
  BarChart,
  GaugeChart,
  DonutChart,
  Sparkline,

  // Color utilities
  colors: {
    ...cyberColors,
    getThemeColor,
    getThemeColorRGB,
    getThemeColorLight,
    getThemeColorDark,
    getGlowColor,
    hexToRGB,
    rgbToHex,
    hexToRGBA,
    lighten,
    darken,
    withOpacity,
    mixColors,
    getContrastColor,
    generateSeriesColors,
    getThemeGradient,
    createGradient,
    getGlowShadow,
    chartColors,
  },

  // Math utilities
  utils: {
    lerp,
    clamp,
    scale,
    round,
    sum,
    mean,
    median,
    easings,
    getEasing,
  },

  // Version
  VERSION,
};

// Export as default for UMD (attaches to window.CyberCharts)
export default CyberCharts;
