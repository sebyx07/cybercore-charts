/**
 * CyberCore Charts with React (18 and 19).
 *
 *   npm install cybercore-charts
 *
 * The components take the chart options as props, update the chart in place
 * when a prop changes and destroy it on unmount (StrictMode included). They
 * draw after mount: in the Next.js App Router, put them in a client component.
 */

import { useRef, useState } from 'react';

import {
  CyberBarChart,
  CyberDonutChart,
  CyberGaugeChart,
  CyberLineChart,
  CyberSparkline,
} from 'cybercore-charts/react';

import type {
  ChartEvent,
  CyberDonutChartRef,
  DataPoint,
  DonutSegment,
  GaugeThreshold,
} from 'cybercore-charts/react';

const ZONES: GaugeThreshold[] = [
  { value: 60, theme: 'green' },
  { value: 85, theme: 'yellow' },
  { value: 100, theme: 'magenta' },
];

const PROTOCOLS: DonutSegment[] = [
  { label: 'HTTPS', value: 54 },
  { label: 'WebSocket', value: 21 },
  { label: 'gRPC', value: 14 },
  { label: 'Other', value: 11 },
];

const REGIONS: DataPoint[] = [
  { x: 'Tokyo', y: 84 },
  { x: 'Lagos', y: 61 },
  { x: 'Berlin', y: 47 },
];

const percent = (value: number) => `${Math.round(value)}%`;

export function Dashboard() {
  const [points, setPoints] = useState<DataPoint[]>([
    { x: 'Mon', y: 12 },
    { x: 'Tue', y: 30 },
    { x: 'Wed', y: 18 },
    { x: 'Thu', y: 41 },
  ]);
  const [selected, setSelected] = useState('Nothing selected yet.');
  const donut = useRef<CyberDonutChartRef>(null);

  const load = Math.min(100, (points[points.length - 1]?.y ?? 0) * 2);

  const addPoint = () => {
    const next = Math.round(10 + Math.random() * 40);
    // New array, new chart data: the line updates without being rebuilt.
    setPoints((current) => [...current, { x: `Day ${current.length + 1}`, y: next }]);
  };

  const onPointClick = (event: ChartEvent) => {
    const { point } = event.data as { point: DataPoint };
    setSelected(`${String(point.x)}: ${point.y}`);
  };

  const exportDonut = () => {
    // The ref exposes update, setOptions, resize, getSVG, toSVG and getChart.
    const svg = donut.current?.toSVG();
    if (svg) {
      window.open(URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })));
    }
  };

  return (
    <main>
      <section aria-labelledby="traffic-title">
        <h2 id="traffic-title">Traffic</h2>
        <p>
          Latest: {points[points.length - 1]?.y ?? 0}{' '}
          {/* The number is in text, so the sparkline is decoration. */}
          <CyberSparkline data={points.map((point) => point.y)} aria-hidden="true" />
        </p>
        {/* A responsive chart fills its container, so the container needs a height. */}
        <CyberLineChart
          data={points}
          interpolation="smooth"
          showArea
          responsive
          ariaLabel="Requests per day"
          style={{ height: 280 }}
          onPointClick={onPointClick}
        />
        <p aria-live="polite">{selected}</p>
        <button type="button" onClick={addPoint}>
          Add a day
        </button>
      </section>

      <section aria-labelledby="load-title">
        <h2 id="load-title">Core load</h2>
        <CyberGaugeChart
          value={load}
          thresholds={ZONES}
          formatValue={percent}
          responsive
          ariaLabel="Core load"
          style={{ height: 220 }}
        />
      </section>

      <section aria-labelledby="regions-title">
        <h2 id="regions-title">Requests by region</h2>
        <CyberBarChart
          data={REGIONS}
          orientation="horizontal"
          showValues
          responsive
          ariaLabel="Requests by region, thousands per minute"
          style={{ height: 240 }}
        />
      </section>

      <section aria-labelledby="protocols-title">
        <h2 id="protocols-title">Traffic by protocol</h2>
        <CyberDonutChart
          ref={donut}
          data={PROTOCOLS}
          centerText="100%"
          responsive
          ariaLabel="Traffic by protocol"
          style={{ height: 280 }}
        />
        <button type="button" onClick={exportDonut}>
          Export as SVG
        </button>
      </section>
    </main>
  );
}

export default Dashboard;
