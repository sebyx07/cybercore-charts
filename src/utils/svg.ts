/**
 * CyberCore Charts - SVG Utilities
 * Helper functions for creating and manipulating SVG elements
 */

import { getThemeColor } from './colors';

import type { ChartTheme, Point, GlowConfig } from '../types';

// ============================================================================
// SVG Namespace
// ============================================================================

const SVG_NS = 'http://www.w3.org/2000/svg';

// ============================================================================
// Element Creation
// ============================================================================

/**
 * Create an SVG element with attributes
 */
export function createSVGElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes?: Record<string, string | number | undefined>
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tagName);
  if (attributes) {
    setAttributes(element, attributes);
  }
  return element;
}

/**
 * Set multiple attributes on an element
 */
export function setAttributes(
  element: Element,
  attributes: Record<string, string | number | undefined>
): void {
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      element.setAttribute(key, String(value));
    }
  }
}

/**
 * Create the root SVG element for a chart
 */
export function createSVGRoot(
  width: number,
  height: number,
  options: {
    classPrefix?: string;
    ariaLabel?: string;
    viewBox?: string;
  } = {}
): SVGSVGElement {
  const { classPrefix = 'cyber-chart', ariaLabel, viewBox } = options;

  return createSVGElement('svg', {
    width,
    height,
    viewBox: viewBox || `0 0 ${width} ${height}`,
    class: classPrefix,
    role: 'img',
    'aria-label': ariaLabel,
    xmlns: SVG_NS,
  });
}

/**
 * Create a group element
 */
export function createGroup(className?: string, transform?: string): SVGGElement {
  return createSVGElement('g', {
    class: className,
    transform,
  });
}

// ============================================================================
// Path Helpers
// ============================================================================

/**
 * Convert points to a linear path string
 */
export function pointsToPath(points: Point[], close: boolean = false): string {
  if (points.length === 0) {
    return '';
  }

  const first = points[0];
  let path = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    path += ` L ${p.x} ${p.y}`;
  }

  if (close) {
    path += ' Z';
  }

  return path;
}

/**
 * Create a path element from a path string
 */
export function createPath(
  d: string,
  options: {
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    className?: string;
    strokeLinecap?: 'butt' | 'round' | 'square';
    strokeLinejoin?: 'miter' | 'round' | 'bevel';
    strokeDasharray?: string;
    opacity?: number;
  } = {}
): SVGPathElement {
  const {
    stroke = 'currentColor',
    strokeWidth = 2,
    fill = 'none',
    className,
    strokeLinecap = 'round',
    strokeLinejoin = 'round',
    strokeDasharray,
    opacity,
  } = options;

  return createSVGElement('path', {
    d,
    stroke,
    'stroke-width': strokeWidth,
    fill,
    class: className,
    'stroke-linecap': strokeLinecap,
    'stroke-linejoin': strokeLinejoin,
    'stroke-dasharray': strokeDasharray,
    opacity,
  });
}

/**
 * Create an area path (line with fill below)
 */
export function createAreaPath(
  points: Point[],
  baselineY: number,
  options: {
    fill?: string;
    opacity?: number;
    className?: string;
  } = {}
): SVGPathElement {
  if (points.length === 0) {
    return createPath('');
  }

  const { fill = 'currentColor', opacity = 0.3, className } = options;
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  // Create path: start at first point, draw line, then drop to baseline and back
  let d = `M ${firstPoint.x} ${baselineY}`;
  d += ` L ${firstPoint.x} ${firstPoint.y}`;

  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    d += ` L ${point.x} ${point.y}`;
  }

  d += ` L ${lastPoint.x} ${baselineY}`;
  d += ' Z';

  return createSVGElement('path', {
    d,
    fill,
    opacity,
    stroke: 'none',
    class: className,
  });
}

// ============================================================================
// Shape Helpers
// ============================================================================

/**
 * Create a circle element
 */
export function createCircle(
  cx: number,
  cy: number,
  r: number,
  options: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    className?: string;
    opacity?: number;
  } = {}
): SVGCircleElement {
  const { fill = 'currentColor', stroke, strokeWidth, className, opacity } = options;

  return createSVGElement('circle', {
    cx,
    cy,
    r,
    fill,
    stroke,
    'stroke-width': strokeWidth,
    class: className,
    opacity,
  });
}

/**
 * Create a rectangle element
 */
export function createRect(
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    rx?: number;
    ry?: number;
    className?: string;
    opacity?: number;
  } = {}
): SVGRectElement {
  const { fill = 'currentColor', stroke, strokeWidth, rx, ry, className, opacity } = options;

  return createSVGElement('rect', {
    x,
    y,
    width,
    height,
    fill,
    stroke,
    'stroke-width': strokeWidth,
    rx,
    ry,
    class: className,
    opacity,
  });
}

/**
 * Create a line element
 */
export function createLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    className?: string;
    opacity?: number;
  } = {}
): SVGLineElement {
  const { stroke = 'currentColor', strokeWidth = 1, strokeDasharray, className, opacity } = options;

  return createSVGElement('line', {
    x1,
    y1,
    x2,
    y2,
    stroke,
    'stroke-width': strokeWidth,
    'stroke-dasharray': strokeDasharray,
    class: className,
    opacity,
  });
}

/**
 * Create a text element
 */
export function createText(
  x: number,
  y: number,
  content: string,
  options: {
    fill?: string;
    fontSize?: number | string;
    fontFamily?: string;
    fontWeight?: string | number;
    textAnchor?: 'start' | 'middle' | 'end';
    dominantBaseline?: 'auto' | 'middle' | 'hanging' | 'alphabetic';
    className?: string;
    opacity?: number;
  } = {}
): SVGTextElement {
  const {
    fill = 'currentColor',
    fontSize = 12,
    fontFamily,
    fontWeight,
    textAnchor = 'middle',
    dominantBaseline = 'middle',
    className,
    opacity,
  } = options;

  const text = createSVGElement('text', {
    x,
    y,
    fill,
    'font-size': fontSize,
    'font-family': fontFamily,
    'font-weight': fontWeight,
    'text-anchor': textAnchor,
    'dominant-baseline': dominantBaseline,
    class: className,
    opacity,
  });

  text.textContent = content;
  return text;
}

// ============================================================================
// Arc Helpers (for Gauge and Donut charts)
// ============================================================================

/**
 * Describe an arc path
 */
export function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}

/**
 * Describe a donut segment (arc with thickness)
 */
export function describeDonutSegment(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);

  const outerX1 = cx + outerRadius * Math.cos(startRad);
  const outerY1 = cy + outerRadius * Math.sin(startRad);
  const outerX2 = cx + outerRadius * Math.cos(endRad);
  const outerY2 = cy + outerRadius * Math.sin(endRad);

  const innerX1 = cx + innerRadius * Math.cos(endRad);
  const innerY1 = cy + innerRadius * Math.sin(endRad);
  const innerX2 = cx + innerRadius * Math.cos(startRad);
  const innerY2 = cy + innerRadius * Math.sin(startRad);

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${outerX1} ${outerY1}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}`,
    `L ${innerX1} ${innerY1}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX2} ${innerY2}`,
    'Z',
  ].join(' ');
}

// ============================================================================
// Gradient and Filter Definitions
// ============================================================================

/**
 * Create a defs element with common definitions
 */
export function createDefs(): SVGDefsElement {
  return createSVGElement('defs');
}

/**
 * Create a linear gradient
 */
export function createLinearGradient(
  id: string,
  colors: Array<{ offset: string; color: string; opacity?: number }>,
  options: {
    x1?: string;
    y1?: string;
    x2?: string;
    y2?: string;
  } = {}
): SVGLinearGradientElement {
  const { x1 = '0%', y1 = '0%', x2 = '0%', y2 = '100%' } = options;

  const gradient = createSVGElement('linearGradient', { id, x1, y1, x2, y2 });

  for (const stop of colors) {
    const stopEl = createSVGElement('stop', {
      offset: stop.offset,
      'stop-color': stop.color,
      'stop-opacity': stop.opacity,
    });
    gradient.appendChild(stopEl);
  }

  return gradient;
}

/**
 * Create a radial gradient
 */
export function createRadialGradient(
  id: string,
  colors: Array<{ offset: string; color: string; opacity?: number }>,
  options: {
    cx?: string;
    cy?: string;
    r?: string;
    fx?: string;
    fy?: string;
  } = {}
): SVGRadialGradientElement {
  const { cx = '50%', cy = '50%', r = '50%', fx, fy } = options;

  const gradient = createSVGElement('radialGradient', { id, cx, cy, r, fx, fy });

  for (const stop of colors) {
    const stopEl = createSVGElement('stop', {
      offset: stop.offset,
      'stop-color': stop.color,
      'stop-opacity': stop.opacity,
    });
    gradient.appendChild(stopEl);
  }

  return gradient;
}

/**
 * Create a cyberpunk glow filter
 */
export function createGlowFilter(
  id: string,
  theme: ChartTheme,
  config: GlowConfig = {}
): SVGFilterElement {
  const { intensity = 1, blur = 4 } = config;

  const filter = createSVGElement('filter', {
    id,
    x: '-50%',
    y: '-50%',
    width: '200%',
    height: '200%',
  });

  // Gaussian blur for the glow
  const feGaussianBlur = createSVGElement('feGaussianBlur', {
    in: 'SourceGraphic',
    stdDeviation: blur * intensity,
    result: 'blur',
  });

  // Color matrix to tint the blur
  const feColorMatrix = createSVGElement('feColorMatrix', {
    in: 'blur',
    type: 'matrix',
    values: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7',
    result: 'glow',
  });

  // Merge the glow with the original
  const feMerge = createSVGElement('feMerge');
  const feMergeNode1 = createSVGElement('feMergeNode', { in: 'glow' });
  const feMergeNode2 = createSVGElement('feMergeNode', { in: 'SourceGraphic' });

  feMerge.appendChild(feMergeNode1);
  feMerge.appendChild(feMergeNode2);

  filter.appendChild(feGaussianBlur);
  filter.appendChild(feColorMatrix);
  filter.appendChild(feMerge);

  return filter;
}

/**
 * Create a drop shadow filter
 */
export function createDropShadowFilter(
  id: string,
  options: {
    dx?: number;
    dy?: number;
    blur?: number;
    color?: string;
    opacity?: number;
  } = {}
): SVGFilterElement {
  const { dx = 0, dy = 2, blur = 4, color = '#000000', opacity = 0.3 } = options;

  const filter = createSVGElement('filter', {
    id,
    x: '-50%',
    y: '-50%',
    width: '200%',
    height: '200%',
  });

  const feDropShadow = createSVGElement('feDropShadow', {
    dx,
    dy,
    'flood-color': color,
    'flood-opacity': opacity,
    stdDeviation: blur,
  });

  filter.appendChild(feDropShadow);
  return filter;
}

/**
 * Create scanlines pattern
 */
export function createScanlinesPattern(id: string, opacity: number = 0.05): SVGPatternElement {
  const pattern = createSVGElement('pattern', {
    id,
    patternUnits: 'userSpaceOnUse',
    width: 4,
    height: 4,
  });

  const line = createSVGElement('line', {
    x1: 0,
    y1: 0,
    x2: 4,
    y2: 0,
    stroke: '#000000',
    'stroke-width': 1,
    opacity,
  });

  pattern.appendChild(line);
  return pattern;
}

// ============================================================================
// Animation Helpers
// ============================================================================

/**
 * Create an animate element for path morphing
 */
export function createPathAnimation(
  attributeName: string,
  from: string,
  to: string,
  duration: number,
  options: {
    fill?: 'freeze' | 'remove';
    begin?: string;
    calcMode?: 'linear' | 'spline' | 'paced' | 'discrete';
    keySplines?: string;
  } = {}
): SVGAnimateElement {
  const { fill = 'freeze', begin = '0s', calcMode, keySplines } = options;

  return createSVGElement('animate', {
    attributeName,
    from,
    to,
    dur: `${duration}ms`,
    fill,
    begin,
    calcMode,
    keySplines,
  });
}

/**
 * Create a CSS animation keyframes string
 */
export function createAnimationCSS(
  name: string,
  keyframes: Record<string, Record<string, string>>
): string {
  let css = `@keyframes ${name} {\n`;

  for (const [key, props] of Object.entries(keyframes)) {
    css += `  ${key} {\n`;
    for (const [prop, value] of Object.entries(props)) {
      css += `    ${prop}: ${value};\n`;
    }
    css += '  }\n';
  }

  css += '}\n';
  return css;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Clear all children from an element
 */
export function clearElement(element: Element): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Get element bounding box
 */
export function getBBox(element: SVGGraphicsElement): DOMRect {
  return element.getBBox();
}

/**
 * Convert SVG element to string
 */
export function svgToString(svg: SVGElement): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svg);
}

/**
 * Create a clip path
 */
export function createClipPath(id: string, shape: SVGElement): SVGClipPathElement {
  const clipPath = createSVGElement('clipPath', { id });
  clipPath.appendChild(shape);
  return clipPath;
}

/**
 * Create a mask
 */
export function createMask(id: string, content: SVGElement): SVGMaskElement {
  const mask = createSVGElement('mask', { id });
  mask.appendChild(content);
  return mask;
}

/**
 * Add theme color to an element
 */
export function applyThemeColor(
  element: SVGElement,
  theme: ChartTheme,
  property: 'stroke' | 'fill' = 'stroke'
): void {
  element.setAttribute(property, getThemeColor(theme));
}

/**
 * Add glow filter reference to an element
 */
export function applyGlowFilter(element: SVGElement, filterId: string): void {
  element.setAttribute('filter', `url(#${filterId})`);
}
