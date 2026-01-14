import { useState } from 'react';

import ChartDemo from '../components/ChartDemo';

// Mock bar chart component
interface BarChartProps {
  data: { label: string; value: number }[];
  color?: 'cyan' | 'magenta' | 'yellow' | 'green';
  horizontal?: boolean;
  stacked?: boolean;
  animated?: boolean;
}

const MockBarChart = ({
  data,
  color = 'cyan',
  horizontal = false,
  animated = false,
}: BarChartProps) => {
  const colorVar = `var(--cyber-${color}-500)`;
  const width = 400;
  const height = horizontal ? 250 : 200;
  const padding = 50;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data.map((d) => d.value));

  if (horizontal) {
    const barHeight = (chartHeight - (data.length - 1) * 10) / data.length;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '280px' }}>
        <defs>
          <linearGradient id={`barGradientH-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorVar} stopOpacity="0.6" />
            <stop offset="100%" stopColor={colorVar} stopOpacity="1" />
          </linearGradient>
          <filter id="barGlowH">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {data.map((item, index) => {
          const barWidth = (item.value / maxValue) * chartWidth;
          const y = padding + index * (barHeight + 10);

          return (
            <g key={index}>
              {/* Bar background */}
              <rect
                x={padding}
                y={y}
                width={chartWidth}
                height={barHeight}
                fill="var(--cyber-chrome-900)"
                rx="2"
              />

              {/* Bar fill */}
              <rect
                x={padding}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={`url(#barGradientH-${color})`}
                filter="url(#barGlowH)"
                rx="2"
              >
                {animated && (
                  <animate
                    attributeName="width"
                    from="0"
                    to={barWidth}
                    dur="1s"
                    fill="freeze"
                  />
                )}
              </rect>

              {/* Label */}
              <text
                x={padding - 5}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fill="var(--cyber-chrome-300)"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {item.label}
              </text>

              {/* Value */}
              <text
                x={padding + barWidth + 8}
                y={y + barHeight / 2 + 4}
                fill={colorVar}
                fontSize="11"
                fontFamily="var(--font-mono)"
                fontWeight="600"
              >
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  const barWidth = (chartWidth - (data.length - 1) * 15) / data.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '250px' }}>
      <defs>
        <linearGradient id={`barGradient-${color}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={colorVar} stopOpacity="0.4" />
          <stop offset="100%" stopColor={colorVar} stopOpacity="1" />
        </linearGradient>
        <filter id="barGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`grid-${i}`}
          x1={padding}
          y1={padding + (i * chartHeight) / 4}
          x2={width - padding}
          y2={padding + (i * chartHeight) / 4}
          stroke="var(--cyber-chrome-800)"
          strokeDasharray="4,4"
        />
      ))}

      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = padding + index * (barWidth + 15);
        const y = height - padding - barHeight;

        return (
          <g key={index}>
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={`url(#barGradient-${color})`}
              filter="url(#barGlow)"
              rx="2"
            >
              {animated && (
                <animate
                  attributeName="height"
                  from="0"
                  to={barHeight}
                  dur="0.8s"
                  fill="freeze"
                />
              )}
              {animated && (
                <animate
                  attributeName="y"
                  from={height - padding}
                  to={y}
                  dur="0.8s"
                  fill="freeze"
                />
              )}
            </rect>

            {/* Top glow line */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height="3"
              fill={colorVar}
            />

            {/* Label */}
            <text
              x={x + barWidth / 2}
              y={height - 10}
              textAnchor="middle"
              fill="var(--cyber-chrome-400)"
              fontSize="10"
              fontFamily="var(--font-mono)"
            >
              {item.label}
            </text>

            {/* Value on top */}
            <text
              x={x + barWidth / 2}
              y={y - 8}
              textAnchor="middle"
              fill={colorVar}
              fontSize="11"
              fontFamily="var(--font-mono)"
              fontWeight="600"
            >
              {item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// Grouped bar chart
const GroupedBarChart = () => {
  const data = [
    { label: 'Q1', values: [45, 35, 55] },
    { label: 'Q2', values: [60, 45, 40] },
    { label: 'Q3', values: [35, 55, 65] },
    { label: 'Q4', values: [70, 60, 50] },
  ];
  const colors = ['var(--cyber-cyan-500)', 'var(--cyber-magenta-500)', 'var(--cyber-green-500)'];
  const width = 400;
  const height = 220;
  const padding = 50;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const groupWidth = chartWidth / data.length;
  const barWidth = (groupWidth - 20) / 3;
  const maxValue = 80;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '280px' }}>
      <defs>
        <filter id="groupGlow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
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
          x1={padding}
          y1={padding + (i * chartHeight) / 4}
          x2={width - padding}
          y2={padding + (i * chartHeight) / 4}
          stroke="var(--cyber-chrome-800)"
          strokeDasharray="4,4"
        />
      ))}

      {data.map((group, groupIndex) => {
        const groupX = padding + groupIndex * groupWidth + 10;

        return (
          <g key={groupIndex}>
            {group.values.map((value, barIndex) => {
              const barHeight = (value / maxValue) * chartHeight;
              const x = groupX + barIndex * barWidth;
              const y = height - padding - barHeight;

              return (
                <rect
                  key={barIndex}
                  x={x}
                  y={y}
                  width={barWidth - 3}
                  height={barHeight}
                  fill={colors[barIndex]}
                  opacity="0.8"
                  filter="url(#groupGlow)"
                  rx="2"
                />
              );
            })}

            {/* Group label */}
            <text
              x={groupX + (groupWidth - 20) / 2}
              y={height - 10}
              textAnchor="middle"
              fill="var(--cyber-chrome-400)"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              {group.label}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform="translate(50, 10)">
        <rect x="0" y="0" width="12" height="12" fill={colors[0]} rx="2" />
        <text x="18" y="10" fill="var(--cyber-chrome-300)" fontSize="9" fontFamily="var(--font-mono)">
          Revenue
        </text>

        <rect x="80" y="0" width="12" height="12" fill={colors[1]} rx="2" />
        <text x="98" y="10" fill="var(--cyber-chrome-300)" fontSize="9" fontFamily="var(--font-mono)">
          Costs
        </text>

        <rect x="150" y="0" width="12" height="12" fill={colors[2]} rx="2" />
        <text x="168" y="10" fill="var(--cyber-chrome-300)" fontSize="9" fontFamily="var(--font-mono)">
          Profit
        </text>
      </g>
    </svg>
  );
};

// Sample data
const verticalData = [
  { label: 'Mon', value: 45 },
  { label: 'Tue', value: 60 },
  { label: 'Wed', value: 35 },
  { label: 'Thu', value: 80 },
  { label: 'Fri', value: 55 },
];

const horizontalData = [
  { label: 'CPU', value: 78 },
  { label: 'Memory', value: 65 },
  { label: 'Disk', value: 45 },
  { label: 'Network', value: 92 },
  { label: 'GPU', value: 55 },
];

function BarCharts() {
  const [activeVariant, setActiveVariant] = useState<'vertical' | 'horizontal' | 'grouped' | 'animated'>('vertical');

  return (
    <div className="cyber-container">
      <div className="page-header">
        <h1 className="page-header__title">Bar Charts</h1>
        <p className="page-header__subtitle">
          Solid bars with gradient fills for categorical comparisons
        </p>
      </div>

      {/* Variant Tabs */}
      <div className="cyber-flex cyber-gap-sm cyber-mb-lg" style={{ flexWrap: 'wrap' }}>
        {(['vertical', 'horizontal', 'grouped', 'animated'] as const).map((variant) => (
          <button
            key={variant}
            className={`cyber-btn cyber-btn--sm ${activeVariant === variant ? '' : 'cyber-btn--ghost'}`}
            onClick={() => setActiveVariant(variant)}
          >
            {variant.charAt(0).toUpperCase() + variant.slice(1)}
          </button>
        ))}
      </div>

      {/* Vertical Bar Charts */}
      {activeVariant === 'vertical' && (
        <div className="cyber-grid cyber-grid--2">
          <ChartDemo title="Vertical Bars - Cyan" badge="DEFAULT">
            <MockBarChart data={verticalData} color="cyan" />
          </ChartDemo>

          <ChartDemo title="Vertical Bars - Magenta" badge="MAGENTA">
            <MockBarChart data={verticalData} color="magenta" />
          </ChartDemo>

          <ChartDemo title="Vertical Bars - Yellow" badge="WARNING">
            <MockBarChart data={verticalData} color="yellow" />
          </ChartDemo>

          <ChartDemo title="Vertical Bars - Green" badge="SUCCESS">
            <MockBarChart data={verticalData} color="green" />
          </ChartDemo>
        </div>
      )}

      {/* Horizontal Bar Charts */}
      {activeVariant === 'horizontal' && (
        <div className="cyber-grid cyber-grid--2">
          <ChartDemo title="System Resources" badge="HORIZONTAL">
            <MockBarChart data={horizontalData} color="cyan" horizontal />
          </ChartDemo>

          <ChartDemo title="Performance Metrics" badge="METRICS">
            <MockBarChart data={horizontalData} color="magenta" horizontal />
          </ChartDemo>

          <ChartDemo title="Usage Statistics" badge="STATS">
            <MockBarChart data={horizontalData} color="yellow" horizontal />
          </ChartDemo>

          <ChartDemo title="Health Check" badge="HEALTH">
            <MockBarChart data={horizontalData} color="green" horizontal />
          </ChartDemo>
        </div>
      )}

      {/* Grouped Bar Chart */}
      {activeVariant === 'grouped' && (
        <div className="cyber-grid cyber-grid--1">
          <ChartDemo title="Quarterly Comparison" badge="GROUPED">
            <GroupedBarChart />
          </ChartDemo>

          <div className="cyber-grid cyber-grid--2">
            <ChartDemo title="Department A" badge="DEPT-A">
              <MockBarChart
                data={[
                  { label: 'Jan', value: 30 },
                  { label: 'Feb', value: 45 },
                  { label: 'Mar', value: 55 },
                  { label: 'Apr', value: 70 },
                ]}
                color="cyan"
              />
            </ChartDemo>

            <ChartDemo title="Department B" badge="DEPT-B">
              <MockBarChart
                data={[
                  { label: 'Jan', value: 40 },
                  { label: 'Feb', value: 35 },
                  { label: 'Mar', value: 60 },
                  { label: 'Apr', value: 50 },
                ]}
                color="magenta"
              />
            </ChartDemo>
          </div>
        </div>
      )}

      {/* Animated Bar Charts */}
      {activeVariant === 'animated' && (
        <div className="cyber-grid cyber-grid--2">
          <ChartDemo title="Animated Vertical" badge="ANIMATED">
            <MockBarChart data={verticalData} color="cyan" animated />
          </ChartDemo>

          <ChartDemo title="Animated Horizontal" badge="ANIMATED">
            <MockBarChart data={horizontalData} color="magenta" horizontal animated />
          </ChartDemo>

          <ChartDemo title="Growth Animation" badge="GROWTH">
            <MockBarChart data={verticalData} color="green" animated />
          </ChartDemo>

          <ChartDemo title="Load Animation" badge="LOADING">
            <MockBarChart data={horizontalData} color="yellow" horizontal animated />
          </ChartDemo>
        </div>
      )}

      <div className="cyber-divider" />

      {/* Usage Example */}
      <section className="cyber-section">
        <div className="cyber-section__header">
          <h2 className="cyber-section__title">// Usage</h2>
          <p className="cyber-section__subtitle">How to use bar charts in your project</p>
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
              {`import { BarChart } from 'cybercore-charts';

// Vertical bar chart
<BarChart
  data={[
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 60 },
    { label: 'Wed', value: 35 },
  ]}
  color="cyan"
/>

// Horizontal bar chart
<BarChart
  data={data}
  color="magenta"
  horizontal={true}
  animated={true}
/>

// Grouped bars
<BarChart
  data={groupedData}
  variant="grouped"
  colors={['cyan', 'magenta', 'green']}
  showLegend={true}
/>`}
            </code>
          </pre>
        </div>
      </section>
    </div>
  );
}

export default BarCharts;
