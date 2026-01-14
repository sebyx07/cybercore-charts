import { Link } from 'react-router-dom';

import CodeBlock from '../components/CodeBlock';

// Mock chart preview SVG components
const LineChartPreview = () => (
  <svg viewBox="0 0 200 100" className="chart-preview" style={{ width: '100%', height: '120px' }}>
    <defs>
      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="var(--cyber-cyan-500)" stopOpacity="0.8" />
        <stop offset="100%" stopColor="var(--cyber-magenta-500)" stopOpacity="0.8" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <polyline
      points="10,80 40,60 70,70 100,30 130,45 160,20 190,35"
      fill="none"
      stroke="url(#lineGradient)"
      strokeWidth="2"
      filter="url(#glow)"
    />
    <circle cx="10" cy="80" r="3" fill="var(--cyber-cyan-500)" />
    <circle cx="40" cy="60" r="3" fill="var(--cyber-cyan-500)" />
    <circle cx="70" cy="70" r="3" fill="var(--cyber-cyan-500)" />
    <circle cx="100" cy="30" r="3" fill="var(--cyber-magenta-500)" />
    <circle cx="130" cy="45" r="3" fill="var(--cyber-magenta-500)" />
    <circle cx="160" cy="20" r="3" fill="var(--cyber-magenta-500)" />
    <circle cx="190" cy="35" r="3" fill="var(--cyber-magenta-500)" />
  </svg>
);

const BarChartPreview = () => (
  <svg viewBox="0 0 200 100" className="chart-preview" style={{ width: '100%', height: '120px' }}>
    <defs>
      <linearGradient id="barGradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="var(--cyber-cyan-500)" stopOpacity="0.3" />
        <stop offset="100%" stopColor="var(--cyber-cyan-500)" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    <rect x="15" y="40" width="20" height="55" fill="url(#barGradient)" />
    <rect x="45" y="25" width="20" height="70" fill="url(#barGradient)" />
    <rect x="75" y="55" width="20" height="40" fill="url(#barGradient)" />
    <rect x="105" y="15" width="20" height="80" fill="var(--cyber-magenta-500)" opacity="0.8" />
    <rect x="135" y="35" width="20" height="60" fill="url(#barGradient)" />
    <rect x="165" y="45" width="20" height="50" fill="url(#barGradient)" />
  </svg>
);

const GaugePreview = () => (
  <svg viewBox="0 0 100 60" className="chart-preview" style={{ width: '100%', height: '120px' }}>
    <defs>
      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="var(--cyber-green-500)" />
        <stop offset="50%" stopColor="var(--cyber-yellow-500)" />
        <stop offset="100%" stopColor="var(--cyber-magenta-500)" />
      </linearGradient>
    </defs>
    <path
      d="M 10 55 A 40 40 0 0 1 90 55"
      fill="none"
      stroke="var(--cyber-chrome-700)"
      strokeWidth="8"
      strokeLinecap="round"
    />
    <path
      d="M 10 55 A 40 40 0 0 1 70 20"
      fill="none"
      stroke="url(#gaugeGradient)"
      strokeWidth="8"
      strokeLinecap="round"
    />
    <text
      x="50"
      y="50"
      textAnchor="middle"
      fill="var(--cyber-cyan-500)"
      fontSize="14"
      fontFamily="var(--font-heading)"
    >
      75%
    </text>
  </svg>
);

const RealtimePreview = () => (
  <svg viewBox="0 0 200 100" className="chart-preview" style={{ width: '100%', height: '120px' }}>
    <defs>
      <linearGradient id="realtimeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="var(--cyber-green-500)" stopOpacity="0.2" />
        <stop offset="100%" stopColor="var(--cyber-green-500)" stopOpacity="0.8" />
      </linearGradient>
    </defs>
    <path
      d="M 0,50 Q 25,30 50,50 T 100,50 T 150,50 T 200,50"
      fill="none"
      stroke="var(--cyber-green-500)"
      strokeWidth="2"
      opacity="0.8"
    >
      <animate
        attributeName="d"
        values="M 0,50 Q 25,30 50,50 T 100,50 T 150,50 T 200,50;M 0,50 Q 25,70 50,50 T 100,50 T 150,50 T 200,50;M 0,50 Q 25,30 50,50 T 100,50 T 150,50 T 200,50"
        dur="2s"
        repeatCount="indefinite"
      />
    </path>
    <circle cx="180" cy="50" r="4" fill="var(--cyber-green-500)">
      <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
    </circle>
  </svg>
);

// Feature data
const features = [
  {
    icon: '\u26A1',
    title: 'High Performance',
    description: 'Optimized rendering for smooth animations and real-time data updates.',
  },
  {
    icon: '\uD83C\uDF10',
    title: 'SVG Based',
    description: 'Crisp, scalable graphics that look great on any screen resolution.',
  },
  {
    icon: '\uD83C\uDFA8',
    title: 'Cyberpunk Aesthetic',
    description: 'Neon glows, scanlines, and glitch effects built into every chart.',
  },
  {
    icon: '\uD83D\uDCCA',
    title: 'Multiple Chart Types',
    description: 'Line, bar, gauge, donut, and streaming charts ready to use.',
  },
  {
    icon: '\u23F1\uFE0F',
    title: 'Real-time Streaming',
    description: 'Built-in support for live data feeds and animated transitions.',
  },
  {
    icon: '\uD83D\uDD27',
    title: 'Fully Customizable',
    description: 'Extensive theming options with CSS custom properties.',
  },
];

// Chart type cards
const chartTypes = [
  {
    title: 'Line Charts',
    description: 'Smooth curves with neon glow effects for time-series data.',
    link: '/line-charts',
    preview: <LineChartPreview />,
    color: 'cyan',
  },
  {
    title: 'Bar Charts',
    description: 'Solid bars with gradient fills for categorical comparisons.',
    link: '/bar-charts',
    preview: <BarChartPreview />,
    color: 'cyan',
  },
  {
    title: 'Radial Charts',
    description: 'Gauges and donuts for progress and distribution display.',
    link: '/radial-charts',
    preview: <GaugePreview />,
    color: 'magenta',
  },
  {
    title: 'Real-time',
    description: 'Live streaming charts for monitoring and dashboards.',
    link: '/realtime',
    preview: <RealtimePreview />,
    color: 'green',
  },
];

function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="cyber-hero">
        <p className="cyber-hero__subtitle">[ Data Visualization System v1.0 ]</p>
        <h1 className="cyber-hero__title cyber-text-glow">CYBERCORE CHARTS</h1>
        <p className="cyber-hero__description">
          Built by AI, for AI. Zero-dependency SVG charts with neon aesthetics.
          Perfect for AI-powered dashboards and data visualization.
        </p>
        <div className="cyber-hero__actions">
          <a
            href="/cybercore-charts/llm.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="cyber-btn cyber-btn--lg cyber-flex cyber-items-center cyber-gap-sm"
          >
            📄 llm.txt
          </a>
          <Link to="/line-charts" className="cyber-btn cyber-btn--filled cyber-btn--lg">
            View Charts
          </Link>
          <a
            href="https://github.com/sebyx07/cybercore-charts"
            target="_blank"
            rel="noopener noreferrer"
            className="cyber-btn cyber-btn--lg cyber-btn--ghost"
          >
            GitHub
          </a>
        </div>
      </section>

      <main className="cyber-container">
        {/* Stats Section */}
        <section className="cyber-section">
          <div className="cyber-grid cyber-grid--4">
            <div className="cyber-card cyber-card--interactive">
              <div className="cyber-stat">
                <div className="cyber-stat__value">4</div>
                <div className="cyber-stat__label">Chart Types</div>
              </div>
            </div>
            <div className="cyber-card cyber-card--magenta cyber-card--interactive">
              <div className="cyber-stat">
                <div
                  className="cyber-stat__value"
                  style={{
                    color: 'var(--cyber-magenta-500)',
                    textShadow: '0 0 10px var(--cyber-magenta-500)',
                  }}
                >
                  60fps
                </div>
                <div className="cyber-stat__label">Smooth Animations</div>
              </div>
            </div>
            <div className="cyber-card cyber-card--yellow cyber-card--interactive">
              <div className="cyber-stat">
                <div
                  className="cyber-stat__value"
                  style={{
                    color: 'var(--cyber-yellow-500)',
                    textShadow: '0 0 10px var(--cyber-yellow-500)',
                  }}
                >
                  0
                </div>
                <div className="cyber-stat__label">Dependencies</div>
              </div>
            </div>
            <div className="cyber-card cyber-card--green cyber-card--interactive">
              <div className="cyber-stat">
                <div
                  className="cyber-stat__value"
                  style={{
                    color: 'var(--cyber-green-500)',
                    textShadow: '0 0 10px var(--cyber-green-500)',
                  }}
                >
                  100%
                </div>
                <div className="cyber-stat__label">TypeScript</div>
              </div>
            </div>
          </div>
        </section>

        <div className="cyber-divider" />

        {/* Chart Types Section */}
        <section className="cyber-section">
          <div className="cyber-section__header">
            <h2 className="cyber-section__title">// Chart Types</h2>
            <p className="cyber-section__subtitle">
              Explore our collection of cyberpunk-themed data visualizations
            </p>
          </div>

          <div className="cyber-grid cyber-grid--2">
            {chartTypes.map((chart) => (
              <Link
                key={chart.title}
                to={chart.link}
                className={`cyber-card cyber-card--${chart.color} cyber-card--interactive`}
                style={{ textDecoration: 'none' }}
              >
                <div className="cyber-card__header">
                  <span className="cyber-card__title">{chart.title}</span>
                  <span className={`cyber-badge cyber-badge--${chart.color}`}>VIEW</span>
                </div>
                <div style={{ marginBottom: 'var(--space-md)' }}>{chart.preview}</div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  {chart.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <div className="cyber-divider" />

        {/* Features Section */}
        <section className="cyber-section">
          <div className="cyber-section__header">
            <h2 className="cyber-section__title">// Features</h2>
            <p className="cyber-section__subtitle">
              Built for performance, designed for the future
            </p>
          </div>

          <div className="cyber-grid cyber-grid--3">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card">
                <div className="feature-card__icon">{feature.icon}</div>
                <h3 className="feature-card__title">{feature.title}</h3>
                <p className="feature-card__description">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="cyber-divider" />

        {/* Code Example Section */}
        <section className="cyber-section">
          <div className="cyber-section__header">
            <h2 className="cyber-section__title">// Quick Start</h2>
            <p className="cyber-section__subtitle">Get started in minutes</p>
          </div>

          <div className="cyber-grid cyber-grid--2">
            <div>
              <h3
                style={{
                  color: 'var(--cyber-cyan-500)',
                  marginBottom: 'var(--space-md)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Installation
              </h3>
              <CodeBlock
                code="npm install cybercore-charts"
                language="bash"
                title="Terminal"
                showLineNumbers={false}
              />
            </div>

            <div>
              <h3
                style={{
                  color: 'var(--cyber-cyan-500)',
                  marginBottom: 'var(--space-md)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Basic Usage
              </h3>
              <CodeBlock
                code={`import { LineChart } from 'cybercore-charts';

<LineChart
  data={[10, 25, 15, 30, 20]}
  color="cyan"
  glow={true}
/>`}
                language="tsx"
                title="App.tsx"
              />
            </div>
          </div>
        </section>

        <div className="cyber-divider" />

        {/* CTA Section */}
        <section className="cyber-section cyber-text-center">
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              color: 'var(--cyber-cyan-500)',
              marginBottom: 'var(--space-md)',
            }}
          >
            Ready to visualize the future?
          </h2>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-lg)',
              maxWidth: '500px',
              margin: '0 auto var(--space-lg)',
            }}
          >
            Explore our chart demos and start building cyberpunk-themed dashboards today.
          </p>
          <div className="cyber-flex cyber-gap-md cyber-justify-center">
            <Link to="/line-charts" className="cyber-btn cyber-btn--lg">
              Explore Charts
            </Link>
            <Link to="/realtime" className="cyber-btn cyber-btn--lg cyber-btn--green">
              Real-time Demo
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
