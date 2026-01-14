/**
 * Cybercore Charts - Utility Function Tests
 * Tests math utilities, SVG path generation, and color utilities
 */

import { describe, it, expect } from 'vitest';

// Import math utilities
import {
  lerp,
  clamp,
  scale,
  round,
  degToRad,
  radToDeg,
  distance,
  extent,
  sum,
  mean,
  normalize,
  smoothPath,
  createLinearScale,
} from '../src/utils/math';

// Import color utilities
import {
  hexToRGB,
  rgbToHex,
  lighten,
  darken,
  hexToRGBA,
  getThemeColor,
  createGradient,
  cyberColors,
} from '../src/utils/colors';

// Import SVG utilities
import { pointsToPath, describeArc, createSVGElement } from '../src/utils/svg';

import type { Point } from '../src/types';

describe('Math Utilities', () => {
  describe('lerp (linear interpolation)', () => {
    it('should return start value at t=0', () => {
      expect(lerp(0, 100, 0)).toBe(0);
    });

    it('should return end value at t=1', () => {
      expect(lerp(0, 100, 1)).toBe(100);
    });

    it('should return midpoint at t=0.5', () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
    });

    it('should handle negative values', () => {
      expect(lerp(-100, 100, 0.5)).toBe(0);
    });

    it('should extrapolate beyond t=1', () => {
      expect(lerp(0, 100, 1.5)).toBe(150);
    });

    it('should extrapolate below t=0', () => {
      expect(lerp(0, 100, -0.5)).toBe(-50);
    });
  });

  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });

    it('should return min when value is below', () => {
      expect(clamp(-10, 0, 100)).toBe(0);
    });

    it('should return max when value is above', () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it('should handle equal min and max', () => {
      expect(clamp(50, 25, 25)).toBe(25);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-50, -100, -10)).toBe(-50);
      expect(clamp(-150, -100, -10)).toBe(-100);
    });
  });

  describe('scale', () => {
    it('should scale value from one range to another', () => {
      expect(scale(50, 0, 100, 0, 1)).toBe(0.5);
    });

    it('should handle inverse scaling', () => {
      expect(scale(50, 0, 100, 100, 0)).toBe(50);
    });

    it('should scale to negative range', () => {
      expect(scale(0.5, 0, 1, -100, 100)).toBe(0);
    });

    it('should handle zero-width input range', () => {
      expect(scale(50, 50, 50, 0, 100)).toBe(0); // Return outMin when inMin === inMax
    });
  });

  describe('normalize (array)', () => {
    it('should normalize array values to 0-1 range', () => {
      const result = normalize([0, 50, 100]);
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(0.5);
      expect(result[2]).toBe(1);
    });

    it('should handle single value array', () => {
      const result = normalize([50]);
      expect(result[0]).toBe(0.5); // Returns 0.5 when all values are same
    });
  });

  describe('round', () => {
    it('should round to specified decimal places', () => {
      expect(round(3.14159, 2)).toBe(3.14);
      expect(round(3.14159, 4)).toBe(3.1416);
    });

    it('should round to integer when decimals is 0', () => {
      expect(round(3.7, 0)).toBe(4);
    });

    it('should handle negative numbers', () => {
      expect(round(-3.14159, 2)).toBe(-3.14);
    });
  });

  describe('degToRad / radToDeg', () => {
    it('should convert degrees to radians', () => {
      expect(round(degToRad(180), 4)).toBe(round(Math.PI, 4));
      expect(round(degToRad(90), 4)).toBe(round(Math.PI / 2, 4));
    });

    it('should convert radians to degrees', () => {
      expect(radToDeg(Math.PI)).toBe(180);
      expect(radToDeg(Math.PI / 2)).toBe(90);
    });

    it('should be reversible', () => {
      expect(radToDeg(degToRad(45))).toBe(45);
    });
  });

  describe('distance', () => {
    it('should calculate euclidean distance between points', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 3, y: 4 };
      expect(distance(p1, p2)).toBe(5); // 3-4-5 triangle
    });

    it('should return 0 for same point', () => {
      const p: Point = { x: 5, y: 5 };
      expect(distance(p, p)).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const p1: Point = { x: -3, y: -4 };
      const p2: Point = { x: 0, y: 0 };
      expect(distance(p1, p2)).toBe(5);
    });
  });

  describe('extent', () => {
    it('should return min and max of array', () => {
      const [min, max] = extent([5, 2, 8, 1, 9]);
      expect(min).toBe(1);
      expect(max).toBe(9);
    });

    it('should handle single element', () => {
      const [min, max] = extent([5]);
      expect(min).toBe(5);
      expect(max).toBe(5);
    });

    it('should handle negative numbers', () => {
      const [min, max] = extent([-5, -2, -8, -1, -9]);
      expect(min).toBe(-9);
      expect(max).toBe(-1);
    });

    it('should return [0, 0] for empty array', () => {
      const [min, max] = extent([]);
      expect(min).toBe(0);
      expect(max).toBe(0);
    });
  });

  describe('sum', () => {
    it('should return sum of array', () => {
      expect(sum([1, 2, 3, 4, 5])).toBe(15);
    });

    it('should return 0 for empty array', () => {
      expect(sum([])).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(sum([-1, 2, -3, 4])).toBe(2);
    });
  });

  describe('mean', () => {
    it('should return average of array', () => {
      expect(mean([2, 4, 6, 8])).toBe(5);
    });

    it('should return 0 for empty array', () => {
      expect(mean([])).toBe(0);
    });

    it('should handle single element', () => {
      expect(mean([10])).toBe(10);
    });
  });

  describe('createLinearScale', () => {
    it('should create a linear scale function', () => {
      const scaleFunc = createLinearScale(0, 100, 0, 1);
      expect(scaleFunc(0)).toBe(0);
      expect(scaleFunc(50)).toBe(0.5);
      expect(scaleFunc(100)).toBe(1);
    });

    it('should extrapolate by default', () => {
      const scaleFunc = createLinearScale(0, 100, 0, 1);
      expect(scaleFunc(150)).toBe(1.5);
    });
  });
});

describe('SVG Path Utilities', () => {
  describe('pointsToPath', () => {
    it('should generate line path from points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 5 },
      ];
      const path = pointsToPath(points);
      expect(path).toContain('M 0 0');
      expect(path).toContain('L 10 10');
      expect(path).toContain('L 20 5');
    });

    it('should return empty string for empty points', () => {
      expect(pointsToPath([])).toBe('');
    });

    it('should handle single point', () => {
      const path = pointsToPath([{ x: 5, y: 5 }]);
      expect(path).toBe('M 5 5');
    });

    it('should close path when specified', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ];
      const path = pointsToPath(points, true);
      expect(path).toContain('Z');
    });
  });

  describe('smoothPath', () => {
    it('should generate curved path from points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 5 },
      ];
      const path = smoothPath(points);
      expect(path).toContain('M');
      // Bezier curve commands
      expect(path).toMatch(/C/);
    });

    it('should fall back to line path for 2 points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];
      const path = smoothPath(points);
      expect(path).toContain('L');
    });

    it('should return empty string for insufficient points', () => {
      expect(smoothPath([])).toBe('');
      expect(smoothPath([{ x: 0, y: 0 }])).toBe('');
    });
  });

  describe('describeArc', () => {
    it('should generate arc path', () => {
      const path = describeArc(100, 100, 50, 0, 90);
      expect(path).toContain('M'); // Move to start
      expect(path).toContain('A'); // Arc command
    });

    it('should handle different angles', () => {
      const path = describeArc(100, 100, 50, 45, 135);
      expect(path).toContain('A');
    });
  });
});

describe('Color Utilities', () => {
  describe('hexToRGB', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRGB('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRGB('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRGB('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should handle hex without #', () => {
      expect(hexToRGB('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should return {0,0,0} for invalid hex', () => {
      expect(hexToRGB('invalid')).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
    });
  });

  describe('lighten', () => {
    it('should lighten a color', () => {
      const lightened = lighten('#808080', 0.5);
      expect(lightened).not.toBe('#808080');
      const rgb = hexToRGB(lightened);
      expect(rgb.r).toBeGreaterThan(128);
    });
  });

  describe('darken', () => {
    it('should darken a color', () => {
      const darkened = darken('#ffffff', 0.5);
      expect(darkened).not.toBe('#ffffff');
      const rgb = hexToRGB(darkened);
      expect(rgb.r).toBeLessThan(255);
    });

    it('should cap at black', () => {
      const darkened = darken('#000000', 0.5);
      expect(darkened.toLowerCase()).toBe('#000000');
    });
  });

  describe('hexToRGBA', () => {
    it('should return rgba string', () => {
      expect(hexToRGBA('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should handle full opacity', () => {
      expect(hexToRGBA('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)');
    });

    it('should handle zero opacity', () => {
      expect(hexToRGBA('#ff0000', 0)).toBe('rgba(255, 0, 0, 0)');
    });
  });

  describe('getThemeColor', () => {
    it('should return correct cyber theme colors', () => {
      expect(getThemeColor('cyan')).toMatch(/^#[0-9a-f]{6}$/i);
      expect(getThemeColor('magenta')).toMatch(/^#[0-9a-f]{6}$/i);
      expect(getThemeColor('yellow')).toMatch(/^#[0-9a-f]{6}$/i);
      expect(getThemeColor('green')).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should support shade variants', () => {
      const cyan500 = getThemeColor('cyan', 500);
      const cyan300 = getThemeColor('cyan', 300);
      expect(cyan500).not.toBe(cyan300);
    });
  });

  describe('cyberColors palette', () => {
    it('should have all color themes', () => {
      expect(cyberColors.cyan).toBeDefined();
      expect(cyberColors.magenta).toBeDefined();
      expect(cyberColors.yellow).toBeDefined();
      expect(cyberColors.green).toBeDefined();
      expect(cyberColors.void).toBeDefined();
      expect(cyberColors.chrome).toBeDefined();
    });

    it('should have all shade levels', () => {
      const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
      for (const shade of shades) {
        expect(cyberColors.cyan[shade]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  describe('createGradient', () => {
    it('should create gradient CSS string', () => {
      const gradient = createGradient('cyan');
      expect(gradient).toContain('linear-gradient');
    });

    it('should support vertical direction', () => {
      const gradient = createGradient('cyan', 'vertical');
      expect(gradient).toContain('180deg');
    });

    it('should support horizontal direction', () => {
      const gradient = createGradient('magenta', 'horizontal');
      expect(gradient).toContain('90deg');
    });

    it('should support radial gradient', () => {
      const gradient = createGradient('green', 'radial');
      expect(gradient).toContain('radial-gradient');
    });
  });
});

describe('SVG Generation Utilities', () => {
  // These tests validate that generated SVG strings are valid

  it('should generate valid path strings', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    const path = pointsToPath(points);
    // Path commands should not contain undefined
    expect(path).not.toContain('undefined');
    expect(path).not.toContain('NaN');
  });

  it('should generate valid arc for pie charts', () => {
    const path = describeArc(100, 100, 50, 0, 90);
    expect(path).not.toContain('undefined');
    expect(path).not.toContain('NaN');
  });
});
