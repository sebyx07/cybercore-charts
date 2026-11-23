import type { Control } from './types';

/** Controls every chart type shares, with the library's defaults. */

export const GLOW: Control = {
  kind: 'switch',
  key: 'glow',
  label: 'Glow',
  default: true,
  help: 'Neon glow around the marks. Dropped automatically in high-contrast mode.',
};

export const ANIMATE: Control = {
  kind: 'switch',
  key: 'animate',
  label: 'Animate',
  default: true,
  help: 'Entrance animation. Never plays when the visitor asks for reduced motion.',
};

export const SCANLINES: Control = {
  kind: 'switch',
  key: 'scanlines',
  label: 'Scanlines',
  default: false,
  help: 'A CRT scanline overlay across the plot.',
};

export const THEME: Control = {
  kind: 'select',
  key: 'theme',
  label: 'Colour',
  options: [
    { value: 'accent', label: 'Accent' },
    { value: 'cyan', label: 'Cyan' },
    { value: 'magenta', label: 'Magenta' },
    { value: 'green', label: 'Green' },
    { value: 'yellow', label: 'Yellow' },
  ],
  default: 'accent',
  help: 'Hue of the chart. Left unset it follows the cybercore-css accent, so [data-theme] retints it.',
};

export function ariaLabel(initial: string): Control {
  return {
    kind: 'text',
    key: 'ariaLabel',
    label: 'Accessible name',
    default: '',
    initial,
    help: 'What a screen reader announces for the chart. Say what the data is, not what it looks like.',
  };
}

export const SHOW_GRID_X: Control = {
  kind: 'switch',
  key: 'xAxis.showGrid',
  label: 'Vertical grid',
  default: true,
  help: 'Grid lines from the x axis.',
};

export const SHOW_GRID_Y: Control = {
  kind: 'switch',
  key: 'yAxis.showGrid',
  label: 'Horizontal grid',
  default: true,
  help: 'Grid lines from the y axis.',
};

export const LEGEND: Control = {
  kind: 'switch',
  key: 'legend.show',
  label: 'Legend',
  default: true,
  help: 'Names each series. Only drawn when there is more than one.',
};
