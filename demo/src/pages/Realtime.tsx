import { useState, useEffect, useRef, useCallback } from 'react';

import ChartDemo from '../components/ChartDemo';

// Real-time streaming line chart
interface StreamingChartProps {
  color?: 'cyan' | 'magenta' | 'yellow' | 'green';
  maxPoints?: number;
  updateInterval?: number;
  paused?: boolean;
}

const StreamingLineChart = ({
  color = 'cyan',
  maxPoints = 50,
  updateInterval = 100,
  paused = false,
}: StreamingChartProps) => {
  const [data, setData] = useState<number[]>(() =>
    Array.from({ length: maxPoints }, () => 50 + Math.random() * 30)
  );
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  const colorVar = `var(--cyber-${color}-500)`;
  const width = 500;
  const height = 150;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const updateData = useCallback(() => {
    if (paused) return;

    setData((prev) => {
      const newValue = prev[prev.length - 1] + (Math.random() - 0.5) * 20;
      const clampedValue = Math.max(10, Math.min(90, newValue));
      return [...prev.slice(1), clampedValue];
    });
  }, [paused]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= updateInterval) {
        updateData();
        lastUpdateRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateData, updateInterval]);

  const maxValue = 100;
  const minValue = 0;
  const range = maxValue - minValue;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding} L ${padding},${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '200px' }}>
      <defs>
        <linearGradient id={`streamGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colorVar} stopOpacity="0.2" />
          <stop offset="100%" stopColor={colorVar} stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={`streamArea-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorVar} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colorVar} stopOpacity="0" />
        </linearGradient>
        <filter id="streamGlow">
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
          x1={padding}
          y1={padding + (i * chartHeight) / 4}
          x2={width - padding}
          y2={padding + (i * chartHeight) / 4}
          stroke="var(--cyber-chrome-900)"
          strokeDasharray="2,4"
        />
      ))}

      {/* Area */}
      <path d={areaD} fill={`url(#streamArea-${color})`} />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#streamGrad-${color})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#streamGlow)"
      />

      {/* Current value indicator */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="4"
        fill={colorVar}
      >
        <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
      </circle>

      {/* Current value label */}
      <text
        x={width - padding - 5}
        y={padding - 5}
        textAnchor="end"
        fill={colorVar}
        fontSize="12"
        fontFamily="var(--font-mono)"
        fontWeight="600"
      >
        {data[data.length - 1].toFixed(1)}
      </text>
    </svg>
  );
};

// Real-time bar chart
const StreamingBarChart = ({ paused = false }: { paused?: boolean }) => {
  const [data, setData] = useState([
    { label: 'CPU', value: 45 },
    { label: 'MEM', value: 62 },
    { label: 'NET', value: 38 },
    { label: 'DISK', value: 71 },
    { label: 'GPU', value: 55 },
  ]);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setData((prev) =>
        prev.map((item) => ({
          ...item,
          value: Math.max(10, Math.min(95, item.value + (Math.random() - 0.5) * 15)),
        }))
      );
    }, 500);

    return () => clearInterval(interval);
  }, [paused]);

  const width = 400;
  const height = 150;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = (chartWidth - (data.length - 1) * 10) / data.length;

  const getColor = (value: number) => {
    if (value > 80) return 'var(--cyber-magenta-500)';
    if (value > 60) return 'var(--cyber-yellow-500)';
    return 'var(--cyber-cyan-500)';
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '200px' }}>
      <defs>
        <filter id="barGlowRt">
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
          x1={padding}
          y1={padding + (i * chartHeight) / 4}
          x2={width - padding}
          y2={padding + (i * chartHeight) / 4}
          stroke="var(--cyber-chrome-900)"
          strokeDasharray="2,4"
        />
      ))}

      {data.map((item, index) => {
        const barHeight = (item.value / 100) * chartHeight;
        const x = padding + index * (barWidth + 10);
        const y = height - padding - barHeight;
        const fillColor = getColor(item.value);

        return (
          <g key={item.label}>
            {/* Bar background */}
            <rect
              x={x}
              y={padding}
              width={barWidth}
              height={chartHeight}
              fill="var(--cyber-chrome-900)"
              rx="2"
            />

            {/* Bar fill with transition */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={fillColor}
              opacity="0.8"
              filter="url(#barGlowRt)"
              rx="2"
              style={{ transition: 'all 0.3s ease' }}
            />

            {/* Top glow */}
            <rect x={x} y={y} width={barWidth} height="2" fill={fillColor} />

            {/* Label */}
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fill="var(--cyber-chrome-400)"
              fontSize="9"
              fontFamily="var(--font-mono)"
            >
              {item.label}
            </text>

            {/* Value */}
            <text
              x={x + barWidth / 2}
              y={y - 5}
              textAnchor="middle"
              fill={fillColor}
              fontSize="10"
              fontFamily="var(--font-mono)"
              fontWeight="600"
            >
              {Math.round(item.value)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// Heartbeat / ECG style chart
const HeartbeatChart = ({ paused = false }: { paused?: boolean }) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setOffset((prev) => (prev + 2) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, [paused]);

  const width = 400;
  const height = 120;
  const baseline = height / 2;

  // Create heartbeat pattern
  const createHeartbeat = (startX: number) => {
    const points = [
      { x: startX, y: baseline },
      { x: startX + 10, y: baseline },
      { x: startX + 15, y: baseline - 5 },
      { x: startX + 20, y: baseline + 10 },
      { x: startX + 25, y: baseline - 40 },
      { x: startX + 30, y: baseline + 20 },
      { x: startX + 35, y: baseline - 15 },
      { x: startX + 40, y: baseline },
      { x: startX + 60, y: baseline },
    ];
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '160px' }}>
      <defs>
        <linearGradient id="heartbeatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--cyber-magenta-500)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--cyber-magenta-500)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--cyber-magenta-500)" stopOpacity="0.3" />
        </linearGradient>
        <filter id="heartGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      <line x1="0" y1={baseline} x2={width} y2={baseline} stroke="var(--cyber-chrome-900)" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line
          key={i}
          x1={i * 66}
          y1="0"
          x2={i * 66}
          y2={height}
          stroke="var(--cyber-chrome-900)"
          strokeDasharray="2,4"
        />
      ))}

      {/* Heartbeat patterns */}
      <g transform={`translate(${-offset}, 0)`}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path
            key={i}
            d={createHeartbeat(i * 70)}
            fill="none"
            stroke="url(#heartbeatGrad)"
            strokeWidth="2"
            filter="url(#heartGlow)"
          />
        ))}
      </g>

      {/* BPM indicator */}
      <g>
        <rect x={width - 80} y="10" width="70" height="25" fill="var(--cyber-void-400)" rx="2" />
        <text
          x={width - 45}
          y="28"
          textAnchor="middle"
          fill="var(--cyber-magenta-500)"
          fontSize="14"
          fontFamily="var(--font-heading)"
          fontWeight="700"
        >
          72 BPM
        </text>
      </g>
    </svg>
  );
};

// Network activity sparklines
const NetworkSparklines = ({ paused = false }: { paused?: boolean }) => {
  const [inbound, setInbound] = useState<number[]>(
    Array(30)
      .fill(0)
      .map(() => Math.random() * 50)
  );
  const [outbound, setOutbound] = useState<number[]>(
    Array(30)
      .fill(0)
      .map(() => Math.random() * 30)
  );

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setInbound((prev) => [...prev.slice(1), Math.random() * 50 + 20]);
      setOutbound((prev) => [...prev.slice(1), Math.random() * 30 + 10]);
    }, 200);

    return () => clearInterval(interval);
  }, [paused]);

  const createPath = (data: number[], maxHeight: number) => {
    const width = 200;
    const height = maxHeight;
    return data
      .map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (value / 100) * height;
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div style={{ width: '80px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--cyber-chrome-500)',
            }}
          >
            INBOUND
          </div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-lg)',
              color: 'var(--cyber-cyan-500)',
            }}
          >
            {inbound[inbound.length - 1].toFixed(1)} MB/s
          </div>
        </div>
        <svg viewBox="0 0 200 40" style={{ flex: 1, height: '40px' }}>
          <path
            d={createPath(inbound, 40)}
            fill="none"
            stroke="var(--cyber-cyan-500)"
            strokeWidth="1.5"
            opacity="0.8"
          />
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div style={{ width: '80px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--cyber-chrome-500)',
            }}
          >
            OUTBOUND
          </div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-lg)',
              color: 'var(--cyber-green-500)',
            }}
          >
            {outbound[outbound.length - 1].toFixed(1)} MB/s
          </div>
        </div>
        <svg viewBox="0 0 200 40" style={{ flex: 1, height: '40px' }}>
          <path
            d={createPath(outbound, 40)}
            fill="none"
            stroke="var(--cyber-green-500)"
            strokeWidth="1.5"
            opacity="0.8"
          />
        </svg>
      </div>
    </div>
  );
};

function Realtime() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="cyber-container">
      <div className="page-header">
        <h1 className="page-header__title">Real-time Charts</h1>
        <p className="page-header__subtitle">Live streaming charts for monitoring and dashboards</p>
      </div>

      {/* Control Panel */}
      <div className="cyber-card cyber-mb-lg">
        <div className="cyber-flex cyber-items-center cyber-justify-between">
          <div className="cyber-flex cyber-items-center cyber-gap-md">
            <div
              className={`cyber-status ${isPaused ? '' : ''}`}
              style={{
                borderColor: isPaused ? 'var(--cyber-yellow-500)' : 'var(--cyber-green-500)',
                background: isPaused
                  ? 'color-mix(in srgb, var(--cyber-yellow-500) 15%, transparent)'
                  : '',
              }}
            >
              <span
                className="cyber-status__dot"
                style={{
                  background: isPaused ? 'var(--cyber-yellow-500)' : 'var(--cyber-green-500)',
                  animation: isPaused ? 'none' : 'pulse-glow 2s infinite',
                }}
              />
              <span
                style={{ color: isPaused ? 'var(--cyber-yellow-500)' : 'var(--cyber-green-500)' }}
              >
                {isPaused ? 'PAUSED' : 'STREAMING'}
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--cyber-chrome-500)',
              }}
            >
              Update rate: 100ms
            </span>
          </div>
          <button
            className={`cyber-btn cyber-btn--sm ${isPaused ? 'cyber-btn--green' : 'cyber-btn--yellow'}`}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Streaming Line Charts */}
      <div className="cyber-grid cyber-grid--2">
        <ChartDemo title="CPU Usage" badge="LIVE">
          <StreamingLineChart color="cyan" paused={isPaused} />
        </ChartDemo>

        <ChartDemo title="Memory Allocation" badge="LIVE">
          <StreamingLineChart color="magenta" paused={isPaused} />
        </ChartDemo>

        <ChartDemo title="Network I/O" badge="LIVE">
          <StreamingLineChart color="green" paused={isPaused} />
        </ChartDemo>

        <ChartDemo title="Disk Activity" badge="LIVE">
          <StreamingLineChart color="yellow" paused={isPaused} />
        </ChartDemo>
      </div>

      <div className="cyber-divider" />

      {/* Streaming Bar Chart */}
      <ChartDemo title="Resource Monitor" badge="REAL-TIME">
        <StreamingBarChart paused={isPaused} />
      </ChartDemo>

      <div className="cyber-divider" />

      {/* Heartbeat Monitor */}
      <div className="cyber-grid cyber-grid--2">
        <ChartDemo title="Heartbeat Monitor" badge="ECG">
          <HeartbeatChart paused={isPaused} />
        </ChartDemo>

        <ChartDemo title="Network Activity" badge="TRAFFIC">
          <NetworkSparklines paused={isPaused} />
        </ChartDemo>
      </div>

      <div className="cyber-divider" />

      {/* Usage Example */}
      <section className="cyber-section">
        <div className="cyber-section__header">
          <h2 className="cyber-section__title">// Usage</h2>
          <p className="cyber-section__subtitle">How to use real-time charts in your project</p>
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
              {`import { StreamingChart, useDataStream } from 'cybercore-charts';

// Using the hook for custom data sources
const { data, push, clear } = useDataStream({
  maxPoints: 50,
  initialData: [],
});

// Connect to your data source
useEffect(() => {
  const ws = new WebSocket('wss://your-api.com/stream');
  ws.onmessage = (event) => {
    push(JSON.parse(event.data).value);
  };
  return () => ws.close();
}, []);

// Render the streaming chart
<StreamingChart
  data={data}
  color="cyan"
  updateInterval={100}
  showArea={true}
/>

// With built-in polling
<StreamingChart
  fetchUrl="/api/metrics"
  pollInterval={1000}
  color="magenta"
/>`}
            </code>
          </pre>
        </div>
      </section>
    </div>
  );
}

export default Realtime;
