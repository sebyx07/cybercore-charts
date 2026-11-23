import type { ChartSlug } from '../routes';
import type { ReactNode } from 'react';

export type ControlValue = boolean | number | string;

interface BaseControl {
  /** Option the control sets, as a path: "showArea", "xAxis.showGrid". */
  key: string;
  label: string;
  /** What the option does, for the options table. */
  help: string;
}

export interface SwitchControl extends BaseControl {
  kind: 'switch';
  /** The library's default. A value equal to it is left out of the code. */
  default: boolean;
  /** Where the playground starts, when not at the default. */
  initial?: boolean;
}

export interface SelectControl extends BaseControl {
  kind: 'select';
  options: { value: string; label: string }[];
  default: string;
  initial?: string;
}

export interface RangeControl extends BaseControl {
  kind: 'range';
  min: number;
  max: number;
  step: number;
  default: number;
  initial?: number;
}

export interface TextControl extends BaseControl {
  kind: 'text';
  default: string;
  initial?: string;
}

export type Control = SwitchControl | SelectControl | RangeControl | TextControl;

export interface DataPreset {
  id: string;
  label: string;
  value: unknown;
}

export interface PlaygroundDef {
  slug: ChartSlug;
  /** Chart class in the core package: "LineChart". */
  className: string;
  /** React component: "CyberLineChart". */
  reactName: string;
  /** One paragraph under the page title. */
  lead: string;
  /** When this chart is the right one, and when another is. */
  useWhen: string[];
  controls: Control[];
  /** The option the data editor edits: "data", "thresholds". */
  dataKey: string;
  /** Heading of the data editor: "Data", "Threshold zones". */
  dataLabel: string;
  /** The shape the editor accepts, in words. */
  dataShape: string;
  presets: DataPreset[];
  /** Returns what is wrong with a parsed value, or null when it is usable. */
  validate: (value: unknown) => string | null;
  /** Height of the preview and the code samples, or null for an inline chart. */
  height: number | null;
  /** Options every preview and code sample sets: responsive sizing, mostly. */
  fixed: Record<string, unknown>;
  /** Draws the chart from validated options. */
  render: (options: Record<string, unknown>) => ReactNode;
  /** What the chart does for keyboard and screen reader users. */
  accessibility: string[];
}
