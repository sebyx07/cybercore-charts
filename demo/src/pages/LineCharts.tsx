import { useState } from 'react';

import ChartDemo from '../components/ChartDemo';

// Mock line chart component with SVG
interface LineChartProps {
  data: number[];
  color?: 'cyan' | 'magenta' | 'yellow' | 'green';
  showDots?: boolean;
  showArea?: boolean;
  animated?: boolean;
}

const MockLineChart = ({
  data,
  color = 'cyan',
  showDots = true,
  showArea = false,
  animated = false,
}: LineChartProps) => {
  const colorVar = `var(--cyber-${color}-500)`;
  const width = 400;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
    return { x, y, value };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding} L ${padding},${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '250px' }}>
      <defs>
        <linearGradient id={`lineGradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colorVar} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colorVar} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`areaGradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorVar} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colorVar} stopOpacity="0" />
        </linearGradient>
        <filter id="glowFilter">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`grid-h-${i}`}
          x1={padding}
          y1={padding + (i * chartHeight) / 4}
          x2={width - padding}
          y2={padding + (i * chartHeight) / 4}
          stroke="var(--cyber-chrome-800)"
          strokeDasharray="4,4"
        />
      ))}

      {/* Area fill */}
      {showArea && (
        <path d={areaD} fill={`url(#areaGradient-${color})`}>
          {animated && (
            <animate attributeName="opacity" values="0;1" dur="1s" fill="freeze" />
          )}
        </path>
      )}

      {/* Main line */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#lineGradient-${color})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glowFilter)"
      >
        {animated && (
          <animate
            attributeName="stroke-dasharray"
            values="0,1000;1000,0"
            dur="2s"
            fill="freeze"
          />
        )}
      </path>

      {/* Data points */}
      {showDots &&
        points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="var(--cyber-void-400)"
              stroke={colorVar}
              strokeWidth="2"
            />
            <circle cx={point.x} cy={point.y} r="3" fill={colorVar} />
          </g>
        ))}

      {/* X-axis labels */}
      {points.map((point, index) => (
        <text
          key={`label-${index}`}
          x={point.x}
          y={height - 10}
          textAnchor="middle"
          fill="var(--cyber-chrome-500)"
          fontSize="10"
          fontFamily="var(--font-mono)"
        >
          {index + 1}
        </text>
      ))}
    </svg>
  );
};

// Sample data sets
const sampleData = {
  basic: [30, 45, 25, 60, 35, 55, 40],
  trending: [10, 15, 25, 35, 50, 45, 65, 80],
  volatile: [50, 20, 70, 30, 80, 25, 60, 40],
  growth: [5, 12, 20, 35, 55, 75, 90, 95],
};

function LineCharts() {
  const [activeVariant, setActiveVariant] = useState<'basic' | 'area' | 'animated' | 'multi'>('basic');

  return (
    <div className="cyber-container">
      <div className="page-header">
        <h1 className="page-header__title">Line Charts</h1>
        <p className="page-header__subtitle">
          Smooth curves with neon glow effects for time-series data visualization
        </p>
      </div>

      {/* Variant Tabs */}
      <div className="cyber-flex cyber-gap-sm cyber-mb-lg" style={{ flexWrap: 'wrap' }}>
        {(['basic', 'area', 'animated', 'multi'] as const).map((variant) => (
          <button
            key={variant}
            className={`cyber-btn cyber-btn--sm ${activeVariant === variant ? '' : 'cyber-btn--ghost'}`}
            onClick={() => setActiveVariant(variant)}
          >
            {variant.charAt(0).toUpperCase() + variant.slice(1)}
          </button>
        ))}
      </div>

      {/* Basic Line Chart */}
      {activeVariant === 'basic' && (
        <div className="cyber-grid cyber-grid--2">
          <ChartDemo title="Basic Line Chart" badge="CYAN">
            <MockLineChart data={sampleData.basic} color="cyan" />
          </ChartDemo>

          <ChartDemo title="Magenta Variant" badge="MAGENTA">
            <MockLineChart data={sampleData.trending} color="magenta" />
          </ChartDemo>

          <ChartDemo title="Yellow Variant" badge="YELLOW">
            <MockLineChart data={sampleData.volatile} color="yellow" />
          </ChartDemo>

          <ChartDemo title="Green Variant" badge="GREEN">
            <MockLineChart data={sampleData.growth} color="green" />
          </ChartDemo>
        </div>
      )}

      {/* Area Charts */}
      {activeVariant === 'area' && (
        <div className="cyber-grid cyber-grid--2">
          <ChartDemo title="Area Fill - Cyan" badge="AREA">
            <MockLineChart data={sampleData.basic} color="cyan" showArea />
          </ChartDemo>

          <ChartDemo title="Area Fill - Magenta" badge="AREA">
            <MockLineChart data={sampleData.trending} color="magenta" showArea />
          </ChartDemo>

          <ChartDemo title="Minimal (No Dots)" badge="MINIMAL">
            <MockLineChart data={sampleData.volatile} color="yellow" showArea showDots={false} />
          </ChartDemo>

          <ChartDemo title="Growth Trend" badge="GROWTH">
            <MockLineChart data={sampleData.growth} color="green" showArea />
          </ChartDemo>
        </div>
      )}

      {/* Animated Charts */}
      {activeVariant === 'animated' && (
        <div className="cyber-grid cyber-grid--2">
          <ChartDemo title="Draw Animation" badge="ANIMATED">
            <MockLineChart data={sampleData.basic} color="cyan" animated />
          </ChartDemo>

          <ChartDemo title="Area Fade In" badge="ANIMATED">
            <MockLineChart data={sampleData.trending} color="magenta" showArea animated />
          </ChartDemo>

          <ChartDemo title="Pulsing Points" badge="PULSE">
            <MockLineChart data={sampleData.volatile} color="yellow" animated />
          </ChartDemo>

          <ChartDemo title="Growth Animation" badge="ANIMATED">
            <MockLineChart data={sampleData.growth} color="green" showArea animated />
          </ChartDemo>
        </div>
      )}

      {/* Multi-series */}
      {activeVariant === 'multi' && (
        <ChartDemo title="Multi-Series Comparison" badge="MULTI">
          <svg viewBox="0 0 400 200" style={{ width: '100%', height: '300px' }}>
            <defs>
              <filter id="multiGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={`grid-${i}`}
                x1="40"
                y1={40 + i * 30}
                x2="360"
                y2={40 + i * 30}
                stroke="var(--cyber-chrome-800)"
                strokeDasharray="4,4"
              />
            ))}

            {/* Series 1 - Cyan */}
            <polyline
              points="40,140 90,120 140,130 190,90 240,100 290,70 340,80"
              fill="none"
              stroke="var(--cyber-cyan-500)"
              strokeWidth="2"
              filter="url(#multiGlow)"
            />

            {/* Series 2 - Magenta */}
            <polyline
              points="40,150 90,140 140,100 190,120 240,80 290,90 340,60"
              fill="none"
              stroke="var(--cyber-magenta-500)"
              strokeWidth="2"
              filter="url(#multiGlow)"
            />

            {/* Series 3 - Green */}
            <polyline
              points="40,160 90,150 140,145 190,130 240,120 290,100 340,90"
              fill="none"
              stroke="var(--cyber-green-500)"
              strokeWidth="2"
              filter="url(#multiGlow)"
            />

            {/* Legend */}
            <g transform="translate(50, 180)">
              <line x1="0" y1="0" x2="20" y2="0" stroke="var(--cyber-cyan-500)" strokeWidth="2" />
              <text x="30" y="4" fill="var(--cyber-chrome-300)" fontSize="10" fontFamily="var(--font-mono)">
                Revenue
              </text>

              <line x1="100" y1="0" x2="120" y2="0" stroke="var(--cyber-magenta-500)" strokeWidth="2" />
              <text x="130" y="4" fill="var(--cyber-chrome-300)" fontSize="10" fontFamily="var(--font-mono)">
                Users
              </text>

              <line x1="190" y1="0" x2="210" y2="0" stroke="var(--cyber-green-500)" strokeWidth="2" />
              <text x="220" y="4" fill="var(--cyber-chrome-300)" fontSize="10" fontFamily="var(--font-mono)">
                Growth
              </text>
            </g>
          </svg>
        </ChartDemo>
      )}

      <div className="cyber-divider" />

      {/* Usage Example */}
      <section className="cyber-section">
        <div className="cyber-section__header">
          <h2 className="cyber-section__title">// Usage</h2>
          <p className="cyber-section__subtitle">How to use line charts in your project</p>
        </div>

        <div className="cyber-card">
          <pre
            style={{
              background: 'var(--cyber-void-500)',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)',
              overflow: 'auto',
            }}
          >
            <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyber-chrome-200)' }}>
              {`import { LineChart } from 'cybercore-charts';

// Basic usage
<LineChart
  data={[30, 45, 25, 60, 35, 55, 40]}
  color="cyan"
  showDots={true}
  showArea={false}
/>

// With area fill
<LineChart
  data={data}
  color="magenta"
  showArea={true}
  animated={true}
/>

// Multi-series
<LineChart
  series={[
    { data: revenueData, color: 'cyan', label: 'Revenue' },
    { data: usersData, color: 'magenta', label: 'Users' },
  ]}
  showLegend={true}
/>`}
            </code>
          </pre>
        </div>
      </section>
    </div>
  );
}

export default LineCharts;
