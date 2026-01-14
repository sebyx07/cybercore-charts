# CYBERCORE CHARTS

<div align="center">

![CYBERCORE CHARTS](https://img.shields.io/badge/CYBERCORE-CHARTS-00f0ff?style=for-the-badge&labelColor=0a0a0f)
![Version](https://img.shields.io/npm/v/cybercore-charts?style=for-the-badge&color=ff2a6d&labelColor=0a0a0f)
![License](https://img.shields.io/npm/l/cybercore-charts?style=for-the-badge&color=fcee0a&labelColor=0a0a0f)
![Bundle Size](https://img.shields.io/bundlephobia/minzip/cybercore-charts?style=for-the-badge&color=05ffa1&labelColor=0a0a0f)

**Zero-dependency SVG chart library with cyberpunk aesthetics**

_Neon glows, dark themes, and futuristic data visualization_

[Live Demo](#) |
[Documentation](#) |
[GitHub](https://github.com/sebyx07/cybercore-charts)

</div>

---

## Features

| Feature              | Description                                     |
| -------------------- | ----------------------------------------------- |
| **Zero Dependencies**| No runtime dependencies - pure TypeScript       |
| **SVG Output**       | Clean SVG strings or DOM elements               |
| **SSR Compatible**   | Works in Node.js and browser environments       |
| **Cyberpunk Theme**  | Neon glows, dark backgrounds, futuristic style  |
| **Fully Typed**      | Complete TypeScript definitions                 |
| **Tree-Shakeable**   | Import only the charts you need                 |
| **Accessible**       | Respects `prefers-reduced-motion`               |
| **Tiny Bundle**      | <10KB minified + gzipped                        |

---

## Installation

```bash
npm install cybercore-charts
```

Or via CDN:

```html
<script src="https://unpkg.com/cybercore-charts@latest/dist/cybercore-charts.min.js"></script>
```

---

## Quick Start

```typescript
import { LineChart } from 'cybercore-charts';

const chart = new LineChart({
  width: 600,
  height: 400,
  data: [
    { x: 0, y: 10 },
    { x: 1, y: 25 },
    { x: 2, y: 15 },
    { x: 3, y: 30 },
    { x: 4, y: 22 },
  ],
  glow: true,
  color: '#00f0ff',
});

// Get SVG string
const svg = chart.render();

// Or append to DOM
document.getElementById('chart').appendChild(chart.toElement());
```

---

## Chart Types

### Line Chart

```typescript
import { LineChart } from 'cybercore-charts';

const chart = new LineChart({
  width: 600,
  height: 400,
  data: [{ x: 0, y: 10 }, { x: 1, y: 25 }, { x: 2, y: 15 }],
  color: '#00f0ff',
  glow: true,
  curve: 'smooth',
  showPoints: true,
  showArea: false,
});
```

### Bar Chart

```typescript
import { BarChart } from 'cybercore-charts';

const chart = new BarChart({
  width: 600,
  height: 400,
  data: [
    { label: 'Alpha', value: 45 },
    { label: 'Beta', value: 72 },
    { label: 'Gamma', value: 58 },
  ],
  orientation: 'vertical',
  colors: ['#00f0ff', '#ff00aa', '#00ff88'],
  showValues: true,
});
```

### Pie / Donut Chart

```typescript
import { PieChart } from 'cybercore-charts';

const chart = new PieChart({
  width: 400,
  height: 400,
  data: [
    { label: 'Sector A', value: 35 },
    { label: 'Sector B', value: 25 },
    { label: 'Sector C', value: 40 },
  ],
  donut: true,
  innerRadius: 60,
  showLabels: true,
});
```

### Area Chart

```typescript
import { AreaChart } from 'cybercore-charts';

const chart = new AreaChart({
  width: 600,
  height: 400,
  data: [{ x: 0, y: 10 }, { x: 1, y: 25 }, { x: 2, y: 15 }],
  gradient: true,
  color: '#ff00aa',
});
```

### Scatter Plot

```typescript
import { ScatterChart } from 'cybercore-charts';

const chart = new ScatterChart({
  width: 600,
  height: 400,
  data: [
    { x: 10, y: 20, size: 5 },
    { x: 30, y: 45, size: 8 },
    { x: 50, y: 30, size: 6 },
  ],
  pulse: true,
});
```

### Gauge

```typescript
import { GaugeChart } from 'cybercore-charts';

const chart = new GaugeChart({
  width: 300,
  height: 200,
  value: 72,
  min: 0,
  max: 100,
  label: 'CPU',
  color: '#00ff88',
});
```

### Radar Chart

```typescript
import { RadarChart } from 'cybercore-charts';

const chart = new RadarChart({
  width: 400,
  height: 400,
  data: [
    { axis: 'Speed', value: 80 },
    { axis: 'Power', value: 65 },
    { axis: 'Range', value: 90 },
    { axis: 'Stealth', value: 45 },
    { axis: 'Armor', value: 70 },
  ],
});
```

### Sparkline

```typescript
import { Sparkline } from 'cybercore-charts';

const chart = new Sparkline({
  width: 120,
  height: 30,
  data: [5, 10, 8, 15, 12, 18, 14],
  color: '#f0ff00',
});
```

---

## API Reference

### Common Options

All chart types accept these base options:

```typescript
interface ChartOptions {
  width: number;            // Chart width in pixels
  height: number;           // Chart height in pixels
  theme?: ThemeConfig;      // Custom theme configuration
  animate?: boolean;        // Enable animations (default: true)
  responsive?: boolean;     // Enable responsive sizing
  padding?: {               // Chart padding
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}
```

### Methods

All chart instances provide:

```typescript
// Render to SVG string
chart.render(): string;

// Create SVGElement
chart.toElement(): SVGElement;

// Update data
chart.update(newData): void;

// Destroy and cleanup
chart.destroy(): void;
```

---

## Theming

### Built-in Themes

```typescript
import { LineChart } from 'cybercore-charts';

// Use preset theme
const chart = new LineChart({
  theme: 'cyber',  // 'cyber' | 'neon' | 'matrix'
  // ...
});
```

### Custom Theme

```typescript
import { createTheme, LineChart } from 'cybercore-charts';

const myTheme = createTheme({
  colors: {
    primary: '#00f0ff',
    secondary: '#ff00aa',
    tertiary: '#f0ff00',
    success: '#00ff88',
    background: '#0a0a0f',
    surface: '#1a1a2f',
    grid: '#2a2a3f',
    text: '#ffffff',
    textMuted: '#8a8a9a',
  },
  effects: {
    glow: true,
    glowIntensity: 0.8,
    scanlines: false,
    animated: true,
  },
  fonts: {
    family: '"JetBrains Mono", monospace',
    size: 12,
  },
});

const chart = new LineChart({
  theme: myTheme,
  // ...
});
```

### CSS Variables

Charts respect CSS custom properties when rendered in the DOM:

```css
:root {
  --cyber-chart-primary: #00f0ff;
  --cyber-chart-background: #0a0a0f;
  --cyber-chart-grid: #2a2a3f;
  --cyber-chart-text: #ffffff;
  --cyber-chart-glow: 0 0 10px currentColor;
}
```

---

## Browser Support

| Browser | Version |
| ------- | ------- |
| Chrome  | 88+     |
| Firefox | 85+     |
| Safari  | 14+     |
| Edge    | 88+     |

_Requires SVG 1.1 and ES2020 support_

---

## Project Structure

```
cybercore-charts/
├── src/
│   ├── charts/           # Chart implementations
│   │   ├── line.ts
│   │   ├── bar.ts
│   │   ├── pie.ts
│   │   ├── area.ts
│   │   ├── scatter.ts
│   │   ├── gauge.ts
│   │   ├── radar.ts
│   │   └── sparkline.ts
│   ├── utils/            # Shared utilities
│   │   ├── scales.ts
│   │   ├── axes.ts
│   │   ├── colors.ts
│   │   └── animations.ts
│   ├── styles/           # Theme definitions
│   │   ├── theme.ts
│   │   └── variables.ts
│   ├── types.ts          # TypeScript definitions
│   └── index.ts          # Main entry
├── demo/                 # Demo site
└── tests/                # Test suites
```

---

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build library
npm run build

# Run tests
npm run test

# Lint and format
npm run lint
npm run format
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

[MIT License](LICENSE) - Use it, visualize it, share it.

---

<div align="center">

**Data visualization for Night City**

[Demo](#) |
[Docs](#) |
[Issues](https://github.com/sebyx07/cybercore-charts/issues)

</div>
