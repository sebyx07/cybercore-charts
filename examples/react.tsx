/**
 * CyberCore Charts - React Example
 *
 * This file demonstrates how to use CyberCore Charts with React.
 * The library is framework-agnostic, so you can use it with any React setup.
 *
 * Installation:
 *   npm install cybercore-charts
 *
 * Usage in your React project:
 *   Copy the hooks and components from this file, or use them as reference.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  LineChart,
  BarChart,
  GaugeChart,
  DonutChart,
  Sparkline,
  cyberColors,
} from 'cybercore-charts';

import type {
  LineChartOptions,
  BarChartOptions,
  GaugeChartOptions,
  DonutChartOptions,
  SparklineOptions,
  ChartTheme,
  DataPoint,
  DataSeries,
  DonutSegment,
} from 'cybercore-charts';

// ============================================================================
// Custom Hooks for Chart Integration
// ============================================================================

/**
 * Generic hook for creating and managing any CyberChart
 */
function useCyberChart<TOptions, TInstance>(
  chartType: 'line' | 'bar' | 'gauge' | 'donut' | 'sparkline',
  options: TOptions,
  deps: React.DependencyList = []
): React.RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<TInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing chart
    if (chartRef.current) {
      (chartRef.current as any).destroy?.();
    }

    // Create new chart
    chartRef.current = createChart(chartType, containerRef.current, options as any) as TInstance;

    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        (chartRef.current as any).destroy?.();
        chartRef.current = null;
      }
    };
  }, deps);

  return containerRef;
}

/**
 * Hook specifically for Line Charts with update capability
 */
function useLineChart(options: LineChartOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<LineChart | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = new LineChart(containerRef.current, options);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (chartRef.current && options.data) {
      chartRef.current.update(options.data);
    }
  }, [options.data]);

  // Update options when they change
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOptions(options);
    }
  }, [options.theme, options.showArea, options.interpolation]);

  return { containerRef, chart: chartRef };
}

// ============================================================================
// React Components
// ============================================================================

/**
 * CyberLineChart - A React component wrapper for LineChart
 */
interface CyberLineChartProps extends Omit<LineChartOptions, 'data'> {
  data: DataPoint[] | DataSeries[];
  className?: string;
  style?: React.CSSProperties;
  onPointClick?: (point: DataPoint, series?: DataSeries) => void;
  onPointHover?: (point: DataPoint, series?: DataSeries) => void;
}

export function CyberLineChart({
  data,
  className,
  style,
  onPointClick,
  onPointHover,
  ...options
}: CyberLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<LineChart | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = new LineChart(containerRef.current, {
      data,
      ...options,
    });

    // Set up event listeners
    if (onPointClick) {
      chartRef.current.on('pointClick', (event) => {
        onPointClick(event.data.point, event.data.series);
      });
    }

    if (onPointHover) {
      chartRef.current.on('pointHover', (event) => {
        onPointHover(event.data.point, event.data.series);
      });
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  // Update data
  useEffect(() => {
    chartRef.current?.update(data);
  }, [data]);

  // Update options
  useEffect(() => {
    chartRef.current?.setOptions(options);
  }, [options.theme, options.showArea, options.showPoints, options.interpolation, options.glow]);

  return <div ref={containerRef} className={className} style={style} />;
}

/**
 * CyberGauge - A React component wrapper for GaugeChart
 */
interface CyberGaugeProps extends Omit<GaugeChartOptions, 'value'> {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}

export function CyberGauge({ value, className, style, ...options }: CyberGaugeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<GaugeChart | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = new GaugeChart(containerRef.current, {
      value,
      ...options,
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  // Update value with animation
  useEffect(() => {
    chartRef.current?.setValue(value);
  }, [value]);

  return <div ref={containerRef} className={className} style={style} />;
}

/**
 * CyberSparkline - Inline sparkline component
 */
interface CyberSparklineProps extends Omit<SparklineOptions, 'data'> {
  data: number[];
  className?: string;
  style?: React.CSSProperties;
}

export function CyberSparkline({ data, className, style, ...options }: CyberSparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Sparkline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = new Sparkline(containerRef.current, {
      data,
      ...options,
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.update(data);
  }, [data]);

  return (
    <span ref={containerRef} className={className} style={{ display: 'inline-block', ...style }} />
  );
}

// ============================================================================
// Example Usage Component
// ============================================================================

/**
 * Example dashboard component showing all chart types
 */
export function CyberDashboard() {
  const [theme, setTheme] = useState<ChartTheme>('cyan');
  const [gaugeValue, setGaugeValue] = useState(72);
  const [lineData, setLineData] = useState<DataPoint[]>([
    { x: 'Jan', y: 30 },
    { x: 'Feb', y: 45 },
    { x: 'Mar', y: 38 },
    { x: 'Apr', y: 62 },
    { x: 'May', y: 55 },
    { x: 'Jun', y: 78 },
  ]);

  const [sparklineData, setSparklineData] = useState([45, 52, 48, 62, 58, 72, 68, 75, 70, 72]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update gauge
      setGaugeValue((prev) => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 10)));

      // Update sparkline
      setSparklineData((prev) => {
        const newValue = prev[prev.length - 1] + (Math.random() - 0.5) * 15;
        return [...prev.slice(1), Math.max(0, Math.min(100, newValue))];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handlePointClick = useCallback((point: DataPoint) => {
    console.log('Point clicked:', point);
    alert(`Clicked: ${point.x} = ${point.y}`);
  }, []);

  const randomizeData = () => {
    setLineData((prev) =>
      prev.map((point) => ({
        ...point,
        y: Math.floor(Math.random() * 80) + 20,
      }))
    );
  };

  return (
    <div
      style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, #06061a 0%, #0a0a1e 50%, #06061a 100%)',
        minHeight: '100vh',
        color: '#dee2e6',
        fontFamily: 'monospace',
      }}
    >
      <h1
        style={{
          color: cyberColors.cyan[500],
          textAlign: 'center',
          marginBottom: '2rem',
          textShadow: `0 0 20px ${cyberColors.cyan[500]}50`,
        }}
      >
        CyberCore Charts + React
      </h1>

      {/* Theme Selector */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        {(['cyan', 'magenta', 'green', 'yellow'] as ChartTheme[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            style={{
              margin: '0 0.5rem',
              padding: '0.5rem 1rem',
              background: theme === t ? cyberColors[t][500] : 'transparent',
              border: `1px solid ${cyberColors[t][500]}`,
              color: theme === t ? '#06061a' : cyberColors[t][500],
              cursor: 'pointer',
              borderRadius: '4px',
              fontFamily: 'inherit',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Line Chart */}
        <div
          style={{
            background: 'rgba(10, 10, 30, 0.8)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '8px',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ color: cyberColors.cyan[500], marginBottom: '1rem' }}>// LINE CHART</h3>
          <CyberLineChart
            data={lineData}
            width={400}
            height={250}
            theme={theme}
            showArea={true}
            areaOpacity={0.15}
            showPoints={true}
            interpolation="smooth"
            glow={true}
            animate={true}
            onPointClick={handlePointClick}
            yAxis={{ show: true, showGrid: true, min: 0, max: 100 }}
          />
          <button
            onClick={randomizeData}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: `1px solid ${cyberColors[theme][500]}`,
              color: cyberColors[theme][500],
              cursor: 'pointer',
              borderRadius: '4px',
              fontFamily: 'inherit',
            }}
          >
            Randomize Data
          </button>
        </div>

        {/* Gauge Chart */}
        <div
          style={{
            background: 'rgba(10, 10, 30, 0.8)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '8px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h3
            style={{ color: cyberColors.cyan[500], marginBottom: '1rem', alignSelf: 'flex-start' }}
          >
            // GAUGE CHART
          </h3>
          <CyberGauge
            value={gaugeValue}
            width={280}
            height={220}
            theme={theme}
            min={0}
            max={100}
            glow={true}
            animate={true}
            showValue={true}
            showMinMax={true}
            label="SYSTEM LOAD"
            thresholds={[
              { value: 30, theme: 'green' },
              { value: 70, theme: 'yellow' },
              { value: 90, theme: 'magenta' },
            ]}
          />
        </div>
      </div>

      {/* Sparkline Example */}
      <div
        style={{
          background: 'rgba(10, 10, 30, 0.8)',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          borderRadius: '8px',
          padding: '1.5rem',
          maxWidth: '600px',
          margin: '2rem auto',
        }}
      >
        <h3 style={{ color: cyberColors.cyan[500], marginBottom: '1rem' }}>// INLINE SPARKLINES</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#adb5bd' }}>CPU Usage:</span>
          <CyberSparkline
            data={sparklineData}
            width={120}
            height={32}
            theme={theme}
            showArea={true}
            showEndPoint={true}
            glow={true}
            interpolation="smooth"
          />
          <span style={{ color: cyberColors[theme][500], fontWeight: 'bold' }}>
            {sparklineData[sparklineData.length - 1].toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// App Entry Point Example
// ============================================================================

/**
 * Example App component
 *
 * Usage in your main.tsx or index.tsx:
 *
 * ```tsx
 * import React from 'react';
 * import ReactDOM from 'react-dom/client';
 * import { CyberDashboard } from './components/CyberDashboard';
 *
 * ReactDOM.createRoot(document.getElementById('root')!).render(
 *   <React.StrictMode>
 *     <CyberDashboard />
 *   </React.StrictMode>
 * );
 * ```
 */
export default function App() {
  return <CyberDashboard />;
}
