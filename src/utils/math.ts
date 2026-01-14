/**
 * CyberCore Charts - Math Utilities
 * Mathematical functions for chart calculations
 */

import type { DataPoint, EasingFunction, Point, ScaleFunction } from '../types';

// ============================================================================
// Basic Math Functions
// ============================================================================

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map a value from one range to another
 */
export function scale(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMax === inMin) {
    return outMin;
  }
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

/**
 * Round to a specified number of decimal places
 */
export function round(value: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Get the nearest multiple of a number
 */
export function snapTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

// ============================================================================
// Range and Domain Functions
// ============================================================================

/**
 * Get min and max from an array of numbers
 */
export function extent(values: number[]): [number, number] {
  if (values.length === 0) {
    return [0, 0];
  }
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) {
      min = v;
    }
    if (v > max) {
      max = v;
    }
  }
  return [min, max];
}

/**
 * Get min and max Y values from data points
 */
export function getYExtent(data: DataPoint[]): [number, number] {
  const values = data.map((d) => d.y);
  return extent(values);
}

/**
 * Get min and max X values from data points (numeric only)
 */
export function getXExtent(data: DataPoint[]): [number, number] {
  const numericX = data
    .map((d) => (typeof d.x === 'number' ? d.x : d.x instanceof Date ? d.x.getTime() : NaN))
    .filter((v) => !isNaN(v));
  return extent(numericX);
}

/**
 * Calculate nice axis bounds (rounds to nice numbers)
 */
export function niceExtent(min: number, max: number, tickCount: number = 5): [number, number] {
  // Handle non-finite values
  if (!isFinite(min) || !isFinite(max)) {
    console.warn('niceExtent: Invalid min/max values provided, using defaults [0, 1]');
    return [0, 1];
  }

  if (min === max) {
    // Handle case where min and max are the same
    if (min === 0) {
      return [0, 1];
    }
    // Expand range by 10% on each side
    const padding = Math.abs(min) * 0.1 || 1;
    return [min - padding, max + padding];
  }

  const range = max - min;
  const roughStep = range / tickCount;

  // Guard against log10(0) when roughStep is 0 or very small
  if (roughStep <= 0 || !isFinite(roughStep)) {
    console.warn('niceExtent: Invalid step calculated, using original bounds');
    return [min, max];
  }

  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / magnitude;

  let niceStep: number;
  if (normalizedStep <= 1) {
    niceStep = 1;
  } else if (normalizedStep <= 2) {
    niceStep = 2;
  } else if (normalizedStep <= 5) {
    niceStep = 5;
  } else {
    niceStep = 10;
  }

  niceStep *= magnitude;

  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;

  return [niceMin, niceMax];
}

/**
 * Generate nice tick values
 */
export function generateTicks(min: number, max: number, count: number = 5): number[] {
  const [niceMin, niceMax] = niceExtent(min, max, count);
  const step = (niceMax - niceMin) / count;
  const ticks: number[] = [];

  for (let i = 0; i <= count; i++) {
    ticks.push(round(niceMin + step * i, 10));
  }

  return ticks;
}

// ============================================================================
// Scale Factories
// ============================================================================

/**
 * Create a linear scale function
 */
export function createLinearScale(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number
): ScaleFunction {
  return (value: number) => scale(value, domainMin, domainMax, rangeMin, rangeMax);
}

/**
 * Create an inverted linear scale (useful for Y-axis where higher values are lower on screen)
 */
export function createInvertedScale(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number
): ScaleFunction {
  return (value: number) => scale(value, domainMin, domainMax, rangeMax, rangeMin);
}

/**
 * Create a band scale for categorical data
 */
export function createBandScale(
  categories: (string | number)[],
  rangeMin: number,
  rangeMax: number,
  padding: number = 0.1
): { scale: (value: string | number) => number; bandwidth: number } {
  const count = categories.length;

  // Guard against empty categories array (division by zero)
  if (count === 0) {
    console.warn('createBandScale: Empty categories array provided');
    return {
      scale: () => rangeMin,
      bandwidth: 0,
    };
  }

  const totalRange = rangeMax - rangeMin;
  const paddingTotal = totalRange * padding;
  const bandwidth = (totalRange - paddingTotal) / count;
  const step = totalRange / count;
  const offset = (step - bandwidth) / 2;

  const categoryMap = new Map<string | number, number>();
  categories.forEach((cat, i) => {
    categoryMap.set(cat, rangeMin + step * i + offset);
  });

  return {
    scale: (value: string | number) => categoryMap.get(value) ?? rangeMin,
    bandwidth,
  };
}

// ============================================================================
// Easing Functions
// ============================================================================

/**
 * Collection of easing functions for animations
 */
export const easings: Record<EasingFunction, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

/**
 * Get easing function by name
 */
export function getEasing(name: EasingFunction): (t: number) => number {
  return easings[name] || easings.linear;
}

// ============================================================================
// Geometry Functions
// ============================================================================

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate angle between two points (in radians)
 */
export function angle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate point on a circle
 */
export function pointOnCircle(
  centerX: number,
  centerY: number,
  radius: number,
  angleRad: number
): Point {
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY + radius * Math.sin(angleRad),
  };
}

/**
 * Calculate point on an arc
 */
export function pointOnArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  t: number
): Point {
  const angle = lerp(startAngle, endAngle, t);
  return pointOnCircle(centerX, centerY, radius, degToRad(angle));
}

// ============================================================================
// Path Calculation Functions
// ============================================================================

/**
 * Calculate control points for a smooth curve through data points
 * Uses Catmull-Rom spline interpolation
 */
export function calculateControlPoints(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  tension: number = 0.5
): { cp1: Point; cp2: Point } {
  const d1 = distance(p0, p1);
  const d2 = distance(p1, p2);
  const d3 = distance(p2, p3);

  const fa = (tension * d1) / (d1 + d2);
  const fc = (tension * d2) / (d2 + d3);

  return {
    cp1: {
      x: p1.x + fa * (p2.x - p0.x),
      y: p1.y + fa * (p2.y - p0.y),
    },
    cp2: {
      x: p2.x - fc * (p3.x - p1.x),
      y: p2.y - fc * (p3.y - p1.y),
    },
  };
}

/**
 * Generate smooth curve path data for a series of points
 */
export function smoothPath(points: Point[], tension: number = 0.5): string {
  if (points.length < 2) {
    return '';
  }
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const { cp1, cp2 } = calculateControlPoints(p0, p1, p2, p3, tension);

    path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

/**
 * Generate step path data
 */
export function stepPath(
  points: Point[],
  position: 'before' | 'after' | 'middle' = 'middle'
): string {
  if (points.length < 2) {
    return '';
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    if (position === 'before') {
      path += ` V ${curr.y} H ${curr.x}`;
    } else if (position === 'after') {
      path += ` H ${curr.x} V ${curr.y}`;
    } else {
      const midX = (prev.x + curr.x) / 2;
      path += ` H ${midX} V ${curr.y} H ${curr.x}`;
    }
  }

  return path;
}

// ============================================================================
// Statistical Functions
// ============================================================================

/**
 * Calculate the sum of an array
 */
export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/**
 * Calculate the mean of an array
 */
export function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return sum(values) / values.length;
}

/**
 * Calculate the median of an array
 */
export function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate percentages from values
 */
export function toPercentages(values: number[]): number[] {
  const total = sum(values);
  if (total === 0) {
    return values.map(() => 0);
  }
  return values.map((v) => (v / total) * 100);
}

/**
 * Normalize values to 0-1 range
 */
export function normalize(values: number[]): number[] {
  const [min, max] = extent(values);
  if (max === min) {
    return values.map(() => 0.5);
  }
  return values.map((v) => (v - min) / (max - min));
}

// ============================================================================
// Path Simplification (Douglas-Peucker Algorithm)
// ============================================================================

/**
 * Calculate the perpendicular distance from a point to a line segment
 * @param point - The point to measure distance from
 * @param lineStart - Start point of the line segment
 * @param lineEnd - End point of the line segment
 * @returns The perpendicular distance
 */
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  // Handle case where lineStart and lineEnd are the same point
  const lineLengthSquared = dx * dx + dy * dy;
  if (lineLengthSquared === 0) {
    return distance(point, lineStart);
  }

  // Calculate perpendicular distance using cross product formula
  const numerator = Math.abs(
    dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
  );
  const denominator = Math.sqrt(lineLengthSquared);

  return numerator / denominator;
}

/**
 * Reduce data points using Ramer-Douglas-Peucker algorithm
 * for better performance with large datasets.
 *
 * This algorithm simplifies a curve by removing points that are within
 * a specified tolerance of the simplified curve, while preserving the
 * overall shape.
 *
 * @param points - Array of points to simplify
 * @param tolerance - Maximum allowed perpendicular distance from the simplified line.
 *                    Higher values result in more simplification.
 *                    Recommended: 0.5-2 for pixel coordinates.
 * @returns Simplified array of points
 *
 * @example
 * ```typescript
 * const simplified = simplifyPath(points, 1.0);
 * // Original: 10,000 points -> Simplified: ~500 points (depending on data)
 * ```
 */
export function simplifyPath(points: Point[], tolerance: number): Point[] {
  // Handle edge cases
  if (points.length <= 2) {
    return [...points];
  }

  if (tolerance <= 0) {
    return [...points];
  }

  // Find the point with the maximum distance from the line between first and last
  let maxDistance = 0;
  let maxIndex = 0;

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], firstPoint, lastPoint);
    if (dist > maxDistance) {
      maxDistance = dist;
      maxIndex = i;
    }
  }

  // If the maximum distance is greater than the tolerance, recursively simplify
  if (maxDistance > tolerance) {
    // Recursively simplify the two sub-arrays
    const leftPoints = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const rightPoints = simplifyPath(points.slice(maxIndex), tolerance);

    // Concatenate results (remove duplicate point at maxIndex)
    return [...leftPoints.slice(0, -1), ...rightPoints];
  }

  // All points are within tolerance, return just the endpoints
  return [firstPoint, lastPoint];
}

/**
 * Downsample data points by selecting evenly spaced points.
 * A simpler alternative to Douglas-Peucker when you just need
 * to reduce point count without shape preservation.
 *
 * @param points - Array of points to downsample
 * @param maxPoints - Maximum number of points to return
 * @returns Downsampled array of points
 */
export function downsamplePoints(points: Point[], maxPoints: number): Point[] {
  if (points.length <= maxPoints || maxPoints < 2) {
    return [...points];
  }

  const result: Point[] = [];
  const step = (points.length - 1) / (maxPoints - 1);

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round(i * step);
    result.push(points[index]);
  }

  return result;
}
