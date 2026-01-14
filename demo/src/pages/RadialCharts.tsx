import { useState } from 'react';

import ChartDemo from '../components/ChartDemo';
import CodeBlock from '../components/CodeBlock';

// Gauge Chart Component
interface GaugeChartProps {
  value: number;
  max?: number;
  color?: 'cyan' | 'magenta' | 'yellow' | 'green';
  label?: string;
  showValue?: boolean;
  animated?: boolean;
}

const GaugeChart = ({
  value,
  max = 100,
  color = 'cyan',
  label,
  showValue = true,
  animated = false,
}: GaugeChartProps) => {
  const colorVar = `var(--cyber-${color}-500)`;
  const percentage = Math.min(value / max, 1);
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Semi-circle
  const dashOffset = circumference * (1 - percentage);

  return (
    <svg viewBox={`0 0 ${size} ${size / 2 + 30}`} style={{ width: '100%', height: '180px' }}>
      <defs>
        <linearGradient id={`gaugeGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colorVar} stopOpacity="0.6" />
          <stop offset="100%" stopColor={colorVar} stopOpacity="1" />
        </linearGradient>
        <filter id="gaugeGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background arc */}
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none"
        stroke="var(--cyber-chrome-800)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Value arc */}
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none"
        stroke={`url(#gaugeGrad-${color})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        filter="url(#gaugeGlow)"
        style={{
          transition: animated ? 'stroke-dashoffset 1s ease-out' : 'none',
        }}
      />

      {/* Center value */}
      {showValue && (
        <text
          x={size / 2}
          y={size / 2 - 5}
          textAnchor="middle"
          fill={colorVar}
          fontSize="28"
          fontFamily="var(--font-heading)"
          fontWeight="700"
        >
          {Math.round(percentage * 100)}%
        </text>
      )}

      {/* Label */}
      {label && (
        <text
          x={size / 2}
          y={size / 2 + 20}
          textAnchor="middle"
          fill="var(--cyber-chrome-400)"
          fontSize="11"
          fontFamily="var(--font-mono)"
        >
          {label}
        </text>
      )}

      {/* Min/Max labels */}
      <text
        x={strokeWidth}
        y={size / 2 + 20}
        fill="var(--cyber-chrome-600)"
        fontSize="9"
        fontFamily="var(--font-mono)"
      >
        0
      </text>
      <text
        x={size - strokeWidth}
        y={size / 2 + 20}
        textAnchor="end"
        fill="var(--cyber-chrome-600)"
        fontSize="9"
        fontFamily="var(--font-mono)"
      >
        {max}
      </text>
    </svg>
  );
};

// Donut Chart Component
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  showLegend?: boolean;
  animated?: boolean;
}

const DonutChart = ({ data, showLegend = true, animated = false }: DonutChartProps) => {
  const size = 180;
  const strokeWidth = 25;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  let currentOffset = 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-lg)',
        justifyContent: 'center',
      }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '180px', height: '180px' }}>
        <defs>
          <filter id="donutGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--cyber-chrome-900)"
          strokeWidth={strokeWidth}
        />

        {/* Data segments */}
        {data.map((item, index) => {
          const percentage = item.value / total;
          const dashLength = percentage * circumference;
          const offset = currentOffset;
          currentOffset += dashLength;

          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-offset}
              filter="url(#donutGlow)"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{
                transition: animated ? 'stroke-dasharray 1s ease-out' : 'none',
              }}
            />
          );
        })}

        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 - 5}
          textAnchor="middle"
          fill="var(--cyber-chrome-100)"
          fontSize="24"
          fontFamily="var(--font-heading)"
          fontWeight="700"
        >
          {total}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 15}
          textAnchor="middle"
          fill="var(--cyber-chrome-500)"
          fontSize="10"
          fontFamily="var(--font-mono)"
        >
          TOTAL
        </text>
      </svg>

      {/* Legend */}
      {showLegend && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          {data.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  background: item.color,
                  borderRadius: '2px',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--cyber-chrome-300)',
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: item.color,
                  marginLeft: 'auto',
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Radial Progress Component
interface RadialProgressProps {
  value: number;
  max?: number;
  color?: 'cyan' | 'magenta' | 'yellow' | 'green';
  size?: 'sm' | 'md' | 'lg';
}

const RadialProgress = ({ value, max = 100, color = 'cyan', size = 'md' }: RadialProgressProps) => {
  const colorVar = `var(--cyber-${color}-500)`;
  const sizes = { sm: 60, md: 100, lg: 140 };
  const strokeWidths = { sm: 4, md: 6, lg: 8 };
  const fontSizes = { sm: 12, md: 18, lg: 24 };

  const svgSize = sizes[size];
  const strokeWidth = strokeWidths[size];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const dashOffset = circumference * (1 - percentage);

  return (
    <svg viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ width: svgSize, height: svgSize }}>
      <defs>
        <filter id={`radialGlow-${color}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <circle
        cx={svgSize / 2}
        cy={svgSize / 2}
        r={radius}
        fill="none"
        stroke="var(--cyber-chrome-800)"
        strokeWidth={strokeWidth}
      />

      {/* Progress */}
      <circle
        cx={svgSize / 2}
        cy={svgSize / 2}
        r={radius}
        fill="none"
        stroke={colorVar}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
        filter={`url(#radialGlow-${color})`}
      />

      {/* Value */}
      <text
        x={svgSize / 2}
        y={svgSize / 2 + fontSizes[size] / 3}
        textAnchor="middle"
        fill={colorVar}
        fontSize={fontSizes[size]}
        fontFamily="var(--font-heading)"
        fontWeight="700"
      >
        {Math.round(percentage * 100)}%
      </text>
    </svg>
  );
};

// Sample data for donut chart
const donutData = [
  { label: 'Active', value: 45, color: 'var(--cyber-cyan-500)' },
  { label: 'Pending', value: 25, color: 'var(--cyber-yellow-500)' },
  { label: 'Error', value: 15, color: 'var(--cyber-magenta-500)' },
  { label: 'Offline', value: 15, color: 'var(--cyber-chrome-600)' },
];

const threatData = [
  { label: 'Critical', value: 12, color: 'var(--cyber-magenta-500)' },
  { label: 'High', value: 28, color: 'var(--cyber-yellow-500)' },
  { label: 'Medium', value: 45, color: 'var(--cyber-cyan-500)' },
  { label: 'Low', value: 67, color: 'var(--cyber-green-500)' },
];

function RadialCharts() {
  const [activeVariant, setActiveVariant] = useState<'gauge' | 'donut' | 'progress' | 'dashboard'>(
    'gauge'
  );

  return (
    <div className="cyber-container">
      <div className="page-header">
        <h1 className="page-header__title">Radial Charts</h1>
        <p className="page-header__subtitle">
          Gauges and donuts for progress and distribution display
        </p>
      </div>

      {/* Variant Tabs */}
      <div className="cyber-flex cyber-gap-sm cyber-mb-lg" style={{ flexWrap: 'wrap' }}>
        {(['gauge', 'donut', 'progress', 'dashboard'] as const).map((variant) => (
          <button
            key={variant}
            className={`cyber-btn cyber-btn--sm ${activeVariant === variant ? '' : 'cyber-btn--ghost'}`}
            onClick={() => setActiveVariant(variant)}
          >
            {variant.charAt(0).toUpperCase() + variant.slice(1)}
          </button>
        ))}
      </div>

      {/* Gauge Charts */}
      {activeVariant === 'gauge' && (
        <div className="cyber-grid cyber-grid--2">
          <ChartDemo title="System Load" badge="GAUGE">
            <GaugeChart value={72} label="CPU USAGE" color="cyan" />
          </ChartDemo>

          <ChartDemo title="Memory Usage" badge="MEMORY">
            <GaugeChart value={85} label="RAM ALLOCATED" color="magenta" />
          </ChartDemo>

          <ChartDemo title="Network Capacity" badge="NETWORK">
            <GaugeChart value={45} label="BANDWIDTH" color="yellow" />
          </ChartDemo>

          <ChartDemo title="Health Score" badge="HEALTH">
            <GaugeChart value={92} label="SYSTEM HEALTH" color="green" />
          </ChartDemo>
        </div>
      )}

      {/* Donut Charts */}
      {activeVariant === 'donut' && (
        <div className="cyber-grid cyber-grid--2">
          <ChartDemo title="Node Status Distribution" badge="DONUT">
            <DonutChart data={donutData} />
          </ChartDemo>

          <ChartDemo title="Threat Level Analysis" badge="THREATS">
            <DonutChart data={threatData} />
          </ChartDemo>

          <ChartDemo title="Resource Allocation" badge="RESOURCES">
            <DonutChart
              data={[
                { label: 'Compute', value: 40, color: 'var(--cyber-cyan-500)' },
                { label: 'Storage', value: 30, color: 'var(--cyber-magenta-500)' },
                { label: 'Network', value: 20, color: 'var(--cyber-yellow-500)' },
                { label: 'Reserved', value: 10, color: 'var(--cyber-chrome-600)' },
              ]}
            />
          </ChartDemo>

          <ChartDemo title="Traffic Sources" badge="TRAFFIC">
            <DonutChart
              data={[
                { label: 'Organic', value: 55, color: 'var(--cyber-green-500)' },
                { label: 'Direct', value: 25, color: 'var(--cyber-cyan-500)' },
                { label: 'Referral', value: 15, color: 'var(--cyber-yellow-500)' },
                { label: 'Paid', value: 5, color: 'var(--cyber-magenta-500)' },
              ]}
            />
          </ChartDemo>
        </div>
      )}

      {/* Radial Progress */}
      {activeVariant === 'progress' && (
        <div className="cyber-grid cyber-grid--2">
          <ChartDemo title="Size Variants" badge="SIZES">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-lg)',
              }}
            >
              <RadialProgress value={65} size="sm" color="cyan" />
              <RadialProgress value={78} size="md" color="magenta" />
              <RadialProgress value={92} size="lg" color="green" />
            </div>
          </ChartDemo>

          <ChartDemo title="Color Variants" badge="COLORS">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-lg)',
              }}
            >
              <RadialProgress value={75} size="md" color="cyan" />
              <RadialProgress value={60} size="md" color="magenta" />
              <RadialProgress value={45} size="md" color="yellow" />
              <RadialProgress value={90} size="md" color="green" />
            </div>
          </ChartDemo>

          <ChartDemo title="Upload Progress" badge="UPLOAD">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-md)',
              }}
            >
              <RadialProgress value={67} size="lg" color="cyan" />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--cyber-chrome-400)',
                }}
              >
                Uploading data.tar.gz...
              </span>
            </div>
          </ChartDemo>

          <ChartDemo title="Security Scan" badge="SCANNING">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-md)',
              }}
            >
              <RadialProgress value={34} size="lg" color="magenta" />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--cyber-chrome-400)',
                }}
              >
                Analyzing threat vectors...
              </span>
            </div>
          </ChartDemo>
        </div>
      )}

      {/* Dashboard Example */}
      {activeVariant === 'dashboard' && (
        <div className="cyber-card">
          <div className="cyber-card__header">
            <span className="cyber-card__title">System Dashboard</span>
            <span className="cyber-badge cyber-badge--green">ONLINE</span>
          </div>

          <div className="cyber-grid cyber-grid--4" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ textAlign: 'center' }}>
              <GaugeChart value={72} label="CPU" color="cyan" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <GaugeChart value={85} label="MEMORY" color="magenta" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <GaugeChart value={45} label="DISK" color="yellow" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <GaugeChart value={92} label="NETWORK" color="green" />
            </div>
          </div>

          <div className="cyber-divider" />

          <div className="cyber-grid cyber-grid--2">
            <div>
              <h4
                style={{
                  color: 'var(--cyber-cyan-500)',
                  marginBottom: 'var(--space-md)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Process Distribution
              </h4>
              <DonutChart data={donutData} />
            </div>
            <div>
              <h4
                style={{
                  color: 'var(--cyber-cyan-500)',
                  marginBottom: 'var(--space-md)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Quick Stats
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 'var(--space-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <RadialProgress value={88} size="sm" color="green" />
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--cyber-chrome-400)',
                      }}
                    >
                      Uptime
                    </div>
                    <div
                      style={{ fontFamily: 'var(--font-heading)', color: 'var(--cyber-green-500)' }}
                    >
                      99.9%
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <RadialProgress value={65} size="sm" color="cyan" />
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--cyber-chrome-400)',
                      }}
                    >
                      Cache Hit
                    </div>
                    <div
                      style={{ fontFamily: 'var(--font-heading)', color: 'var(--cyber-cyan-500)' }}
                    >
                      65%
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <RadialProgress value={42} size="sm" color="yellow" />
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--cyber-chrome-400)',
                      }}
                    >
                      Queue
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-heading)',
                        color: 'var(--cyber-yellow-500)',
                      }}
                    >
                      42%
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <RadialProgress value={15} size="sm" color="magenta" />
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--cyber-chrome-400)',
                      }}
                    >
                      Errors
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-heading)',
                        color: 'var(--cyber-magenta-500)',
                      }}
                    >
                      0.15%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="cyber-divider" />

      {/* Usage Example */}
      <section className="cyber-section">
        <div className="cyber-section__header">
          <h2 className="cyber-section__title">// Usage</h2>
          <p className="cyber-section__subtitle">How to use radial charts in your project</p>
        </div>

        <div className="cyber-grid cyber-grid--1">
          {/* Vanilla JS Example */}
          <div className="cyber-card">
            <h3
              style={{
                color: 'var(--cyber-cyan-500)',
                marginBottom: 'var(--space-md)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Vanilla JavaScript
            </h3>
            <CodeBlock
              code={`// Import the library
import { GaugeChart, DonutChart, RadialProgress } from 'cybercore-charts';

// Create a gauge chart
const cpuGauge = new GaugeChart('#cpu-gauge', {
  value: 72,
  max: 100,
  label: 'CPU USAGE',
  color: 'cyan',
  animated: true,
});

// Create a donut chart
const statusDonut = new DonutChart('#status-chart', {
  data: [
    { label: 'Active', value: 45, color: 'cyan' },
    { label: 'Pending', value: 25, color: 'yellow' },
    { label: 'Error', value: 15, color: 'magenta' },
    { label: 'Offline', value: 15, color: 'chrome' },
  ],
  showLegend: true,
  showTotal: true,
  animated: true,
});

// Create a radial progress indicator
const uploadProgress = new RadialProgress('#upload-progress', {
  value: 67,
  size: 'lg',
  color: 'green',
});

// Update values dynamically
cpuGauge.setValue(85);
uploadProgress.setValue(100);`}
              language="javascript"
              title="vanilla-js.js"
            />
          </div>

          {/* React Example */}
          <div className="cyber-card">
            <h3
              style={{
                color: 'var(--cyber-magenta-500)',
                marginBottom: 'var(--space-md)',
                fontFamily: 'var(--font-display)',
              }}
            >
              React Component
            </h3>
            <CodeBlock
              code={`import { GaugeChart, DonutChart, RadialProgress } from 'cybercore-charts/react';

function SystemDashboard() {
  const [cpuUsage, setCpuUsage] = useState(72);
  const [memoryUsage, setMemoryUsage] = useState(85);

  const statusData = [
    { label: 'Active', value: 45, color: 'cyan' },
    { label: 'Pending', value: 25, color: 'yellow' },
    { label: 'Error', value: 15, color: 'magenta' },
    { label: 'Offline', value: 15, color: 'chrome' },
  ];

  return (
    <div className="system-dashboard">
      {/* Gauge charts for system metrics */}
      <div className="metrics-row">
        <GaugeChart
          value={cpuUsage}
          max={100}
          label="CPU USAGE"
          color="cyan"
          animated={true}
        />
        <GaugeChart
          value={memoryUsage}
          max={100}
          label="MEMORY"
          color="magenta"
          thresholds={[
            { value: 60, color: 'yellow' },
            { value: 80, color: 'magenta' },
          ]}
        />
      </div>

      {/* Donut chart for status distribution */}
      <DonutChart
        data={statusData}
        showLegend={true}
        showTotal={true}
        centerLabel="NODES"
        animated={true}
      />

      {/* Radial progress indicators */}
      <div className="progress-indicators">
        <RadialProgress value={88} size="sm" color="green" />
        <RadialProgress value={65} size="md" color="cyan" />
        <RadialProgress value={42} size="lg" color="yellow" />
      </div>
    </div>
  );
}`}
              language="tsx"
              title="SystemDashboard.tsx"
            />
          </div>

          {/* Configuration Options */}
          <div className="cyber-card">
            <h3
              style={{
                color: 'var(--cyber-yellow-500)',
                marginBottom: 'var(--space-md)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Configuration Options
            </h3>
            <CodeBlock
              code={`// Gauge Chart Options
interface GaugeChartOptions {
  value: number;                       // Current value
  max?: number;                        // Maximum value (default: 100)
  min?: number;                        // Minimum value (default: 0)
  label?: string;                      // Bottom label text
  color?: 'cyan' | 'magenta' | 'yellow' | 'green';
  showValue?: boolean;                 // Display value in center (default: true)
  valueFormat?: (value: number) => string;  // Custom value formatter
  animated?: boolean;                  // Enable animations (default: false)
  thresholds?: Threshold[];            // Color thresholds
  arcWidth?: number;                   // Arc thickness (default: 12)
  startAngle?: number;                 // Start angle in degrees (default: -90)
  endAngle?: number;                   // End angle in degrees (default: 90)
}

// Donut Chart Options
interface DonutChartOptions {
  data: DonutSegment[];                // Segment data
  showLegend?: boolean;                // Show legend (default: true)
  legendPosition?: 'right' | 'bottom';
  showTotal?: boolean;                 // Show total in center (default: true)
  centerLabel?: string;                // Center label text
  animated?: boolean;                  // Enable animations (default: false)
  innerRadius?: number;                // Inner radius ratio 0-1 (default: 0.6)
  padAngle?: number;                   // Gap between segments (default: 0.02)
  cornerRadius?: number;               // Segment corner radius (default: 2)
}

// Radial Progress Options
interface RadialProgressOptions {
  value: number;                       // Progress value 0-100
  max?: number;                        // Maximum value (default: 100)
  size?: 'sm' | 'md' | 'lg';          // Predefined sizes
  color?: 'cyan' | 'magenta' | 'yellow' | 'green';
  strokeWidth?: number;                // Ring thickness
  showValue?: boolean;                 // Display percentage (default: true)
  animated?: boolean;                  // Enable animations (default: false)
  trackColor?: string;                 // Background track color
}

interface DonutSegment {
  label: string;
  value: number;
  color: 'cyan' | 'magenta' | 'yellow' | 'green' | 'chrome' | string;
}

interface Threshold {
  value: number;
  color: string;
}`}
              language="typescript"
              title="types.d.ts"
            />
          </div>

          {/* HTML Example */}
          <div className="cyber-card">
            <h3
              style={{
                color: 'var(--cyber-green-500)',
                marginBottom: 'var(--space-md)',
                fontFamily: 'var(--font-display)',
              }}
            >
              HTML / CDN Usage
            </h3>
            <CodeBlock
              code={`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cybercore Radial Charts</title>
  <link rel="stylesheet" href="https://unpkg.com/cybercore-charts/dist/cybercore-charts.css">
  <style>
    .dashboard {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      padding: 20px;
      background: #0a0a0f;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div id="cpu-gauge"></div>
    <div id="memory-gauge"></div>
    <div id="disk-gauge"></div>
    <div id="network-gauge"></div>
  </div>

  <div id="status-donut" style="width: 400px; height: 250px;"></div>

  <script src="https://unpkg.com/cybercore-charts/dist/cybercore-charts.umd.min.js"></script>
  <script>
    const { GaugeChart, DonutChart, RadialProgress } = CyberCharts;

    // System metric gauges
    const metrics = [
      { id: '#cpu-gauge', value: 72, label: 'CPU', color: 'cyan' },
      { id: '#memory-gauge', value: 85, label: 'MEMORY', color: 'magenta' },
      { id: '#disk-gauge', value: 45, label: 'DISK', color: 'yellow' },
      { id: '#network-gauge', value: 92, label: 'NETWORK', color: 'green' },
    ];

    metrics.forEach(({ id, value, label, color }) => {
      new GaugeChart(id, {
        value,
        label,
        color,
        animated: true,
        glow: true,
      });
    });

    // Status distribution donut
    new DonutChart('#status-donut', {
      data: [
        { label: 'Active', value: 45, color: 'cyan' },
        { label: 'Pending', value: 25, color: 'yellow' },
        { label: 'Error', value: 15, color: 'magenta' },
        { label: 'Offline', value: 15, color: '#606078' },
      ],
      showLegend: true,
      showTotal: true,
      animated: true,
    });
  </script>
</body>
</html>`}
              language="html"
              title="index.html"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default RadialCharts;
