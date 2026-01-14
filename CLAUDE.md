# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

CYBERCORE CHARTS is a zero-dependency SVG chart library with cyberpunk
aesthetics. Pure TypeScript with no runtime dependencies - generates standalone
SVG elements that can be embedded anywhere.

## Commands

```bash
# Development
npm run dev              # Watch library + demo site concurrently
npm run dev:lib          # Watch TypeScript compilation only
npm run dev:demo         # Start Vite dev server for demo

# Build
npm run build            # Build everything (library + demo)
npm run build:lib        # Build library (ESM + CJS + types)

# Linting
npm run lint             # Run all linters
npm run lint:fix         # Auto-fix lint issues
npm run format           # Prettier format all files

# Testing
npm run test             # Run Vitest unit tests
npm run test:watch       # Watch mode
npm run test:visual      # Playwright visual regression tests
npm run test:visual:update  # Update visual snapshots

# Type checking
npm run typecheck        # TypeScript check
```

## Architecture

### Library (`src/`)

Zero-dependency SVG chart generation. All charts output pure SVG strings or
SVGElement objects that can be inserted into any DOM context.

**Structure:**

- `charts/` - Chart type implementations
- `utils/` - Shared utilities (scales, axes, colors, animations)
- `styles/` - Default cyberpunk theme definitions
- `types.ts` - TypeScript type definitions
- `index.ts` - Main entry point with all exports

### Chart Types (`src/charts/`)

Each chart is a standalone module:

- `line.ts` - Line charts with glow effects
- `bar.ts` - Bar charts (vertical/horizontal)
- `area.ts` - Area charts with gradient fills
- `pie.ts` - Pie/donut charts with neon segments
- `scatter.ts` - Scatter plots with pulse animations
- `gauge.ts` - Gauge/meter displays
- `radar.ts` - Radar/spider charts
- `sparkline.ts` - Inline mini charts

### Utilities (`src/utils/`)

- `scales.ts` - Linear, logarithmic, time scales
- `axes.ts` - X/Y axis rendering with grid lines
- `colors.ts` - Cyberpunk color palette and gradients
- `animations.ts` - SVG animation helpers (SMIL + CSS)
- `tooltip.ts` - Tooltip generation utilities
- `responsive.ts` - Viewport/container size handling

### Styles (`src/styles/`)

- `theme.ts` - Default theme configuration
- `variables.ts` - Color and spacing tokens
- `effects.ts` - Glow, scanline, and neon effect definitions

### Demo Site (`demo/`)

React + Vite + TypeScript demo showcasing all chart types. Uses HashRouter for
GitHub Pages compatibility.

### Tests (`tests/`)

- `charts/*.test.ts` - Unit tests for each chart type
- `utils/*.test.ts` - Utility function tests
- `visual/` - Playwright visual regression tests

## Chart Options

All charts share a common base configuration:

```typescript
interface ChartOptions {
  width: number;
  height: number;
  theme?: 'cyber' | 'neon' | 'matrix' | 'custom';
  animate?: boolean;
  responsive?: boolean;
  padding?: { top: number; right: number; bottom: number; left: number };
}
```

### Line Chart

```typescript
interface LineChartOptions extends ChartOptions {
  data: { x: number; y: number }[];
  color?: string;
  strokeWidth?: number;
  glow?: boolean;
  showPoints?: boolean;
  showArea?: boolean;
  curve?: 'linear' | 'smooth' | 'step';
}
```

### Bar Chart

```typescript
interface BarChartOptions extends ChartOptions {
  data: { label: string; value: number }[];
  orientation?: 'vertical' | 'horizontal';
  barWidth?: number;
  gap?: number;
  colors?: string[];
  showValues?: boolean;
}
```

### Pie Chart

```typescript
interface PieChartOptions extends ChartOptions {
  data: { label: string; value: number }[];
  donut?: boolean;
  innerRadius?: number;
  colors?: string[];
  showLabels?: boolean;
  showLegend?: boolean;
}
```

## API Usage

### Basic Usage

```typescript
import { LineChart, BarChart, PieChart } from 'cybercore-charts';

// Create a line chart
const lineChart = new LineChart({
  width: 600,
  height: 400,
  data: [
    { x: 0, y: 10 },
    { x: 1, y: 25 },
    { x: 2, y: 15 },
  ],
  glow: true,
});

// Get SVG string
const svgString = lineChart.render();

// Or get SVGElement
const svgElement = lineChart.toElement();
document.getElementById('chart').appendChild(svgElement);
```

### Theming

```typescript
import { createTheme, LineChart } from 'cybercore-charts';

const customTheme = createTheme({
  colors: {
    primary: '#00f0ff',
    secondary: '#ff00aa',
    background: '#0a0a0f',
    grid: '#1a1a2f',
    text: '#ffffff',
  },
  effects: {
    glow: true,
    scanlines: false,
  },
});

const chart = new LineChart({
  theme: customTheme,
  // ...
});
```

### Tree-Shakeable Imports

```typescript
// Import only what you need
import { LineChart } from 'cybercore-charts/charts/line';
import { BarChart } from 'cybercore-charts/charts/bar';
```

## Color System

Matches CYBERCORE CSS palette:

- `cyber-cyan` - `#00f0ff` - Primary/data
- `cyber-magenta` - `#ff00aa` - Secondary/highlights
- `cyber-yellow` - `#f0ff00` - Warnings/accents
- `cyber-green` - `#00ff88` - Success/positive
- `cyber-void` - `#0a0a0f` - Backgrounds
- `cyber-chrome` - `#8a8a9a` - Grid/axes

## Linting Rules

**TypeScript (ESLint):**

- Strict TypeScript with type checking
- Consistent type imports (`import type`)
- Import order: builtins -> external -> internal -> parent -> sibling -> type
- No unused variables or imports
- Explicit return types on public functions

## Releases

Releases are automated via GitHub Actions. To create a new release:

```bash
# 1. Bump version (patch/minor/major)
npm version patch --no-git-tag-version

# 2. Build the project
npm run build

# 3. Commit the release
git add -A
git commit -m "chore: release vX.X.X"
git push

# 4. Create and push tag to trigger GitHub Actions
git tag vX.X.X
git push origin vX.X.X
```

GitHub Actions will automatically publish to npm when a new tag is pushed.

## Key Constraints

- Zero runtime dependencies - pure TypeScript/SVG
- All output is valid SVG (string or element)
- Must work in Node.js (SSR) and browser environments
- Support `prefers-reduced-motion` for animations
- Demo uses HashRouter (`/#/path`) for GitHub Pages
- Node 20+ required
- Bundle size target: <10KB minified + gzipped
