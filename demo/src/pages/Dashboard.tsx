import { useMemo } from 'react';

import {
  CyberBarChart,
  CyberDonutChart,
  CyberGaugeChart,
  CyberLineChart,
  CyberSparkline,
} from '@cybercore-charts/react';

import CodeBlock from '../components/CodeBlock';
import LiveSwitch from '../components/LiveSwitch';
import ScrollTable from '../components/ScrollTable';
import { DONUT_PROTOCOLS, GAUGE_ZONES } from '../data/samples';
import { DASHBOARD_SOURCE } from '../data/snippets';
import { useFeed } from '../lib/useFeed';
import { useLiveToggle } from '../lib/useLive';
import { CSS_URL } from '../site';

import type { DataPoint, DataSeries } from '@cybercore-charts/types';

const percent = (value: number) => `${Math.round(value)}%`;
const last = (values: number[]) => values[values.length - 1] ?? 0;

/** "Up 4", "Down 2" or "No change", against the value `back` samples ago. */
function delta(values: number[], back = 5): { text: string; direction: 'up' | 'down' | null } {
  const change = last(values) - (values[values.length - 1 - back] ?? last(values));
  if (change === 0) {
    return { text: 'No change', direction: null };
  }
  return change > 0
    ? { text: `Up ${change}`, direction: 'up' }
    : { text: `Down ${-change}`, direction: 'down' };
}

interface StatProps {
  label: string;
  value: string;
  history: number[];
  /** cybercore-css colour modifier of the stat, and hue of its sparkline. */
  tone?: 'magenta' | 'green' | 'yellow';
  /**
   * True when a rise is bad news (latency, errors). The framework's up and
   * down deltas are coloured as good and bad, so these stay neutral.
   */
  riseIsBad?: boolean;
}

function Stat({ label, value, history, tone, riseIsBad = false }: StatProps) {
  const change = delta(history);
  const deltaClass =
    change.direction && !riseIsBad
      ? `cyber-stat__delta cyber-stat__delta--${change.direction}`
      : 'cyber-stat__delta';

  return (
    <div
      className={
        tone ? `cyber-stat cyber-stat--start cyber-stat--${tone}` : 'cyber-stat cyber-stat--start'
      }
    >
      <div className="cyber-stat__value">{value}</div>
      <div className="cyber-stat__label">{label}</div>
      <div className={deltaClass}>{change.text} in 10 s</div>
      {/* The value and its change are in text; the sparkline only decorates them. */}
      <CyberSparkline
        data={history}
        theme={tone}
        width={150}
        height={30}
        showArea
        animate={false}
        aria-hidden="true"
      />
    </div>
  );
}

const NODES = [
  { name: 'tyo-edge-01', region: 'Tokyo', state: 'Online', load: 62 },
  { name: 'lag-edge-02', region: 'Lagos', state: 'Online', load: 48 },
  { name: 'ber-core-01', region: 'Berlin', state: 'Degraded', load: 91 },
  { name: 'lim-edge-03', region: 'Lima', state: 'Online', load: 37 },
  { name: 'osl-core-02', region: 'Oslo', state: 'Offline', load: 0 },
  { name: 'tyo-core-03', region: 'Tokyo', state: 'Online', load: 55 },
  { name: 'lag-core-01', region: 'Lagos', state: 'Online', load: 44 },
] as const;

const STATE_BADGE: Record<(typeof NODES)[number]['state'], string> = {
  Online: 'cyber-badge cyber-badge--green',
  Degraded: 'cyber-badge cyber-badge--yellow',
  Offline: 'cyber-badge cyber-badge--magenta',
};

function Dashboard() {
  const [live, setLive] = useLiveToggle();

  const inbound = useFeed({ seed: 41, count: 30, start: 60, step: 14 }, live);
  const outbound = useFeed({ seed: 43, count: 30, start: 36, step: 10, max: 72 }, live);
  const nodes = useFeed({ seed: 47, count: 20, start: 128, step: 3, min: 110, max: 140 }, live);
  const latency = useFeed({ seed: 53, count: 20, start: 44, step: 9, min: 12, max: 95 }, live);
  const errors = useFeed({ seed: 59, count: 20, start: 9, step: 4, min: 0, max: 30 }, live);
  const cpu = useFeed({ seed: 61, count: 20, start: 58, step: 10, min: 15 }, live);
  const memory = useFeed({ seed: 67, count: 20, start: 71, step: 5, min: 40 }, live);
  const tokyo = useFeed({ seed: 71, count: 2, start: 84, step: 6, min: 50 }, live);
  const lagos = useFeed({ seed: 73, count: 2, start: 61, step: 6, min: 30 }, live);

  const traffic = useMemo<DataSeries[]>(
    () => [
      { id: 'inbound', name: 'Inbound', data: inbound.map((y, x) => ({ x, y })) },
      { id: 'outbound', name: 'Outbound', data: outbound.map((y, x) => ({ x, y })) },
    ],
    [inbound, outbound]
  );
  const regions = useMemo<DataPoint[]>(
    () => [
      { x: 'Tokyo', y: last(tokyo) },
      { x: 'Lagos', y: last(lagos) },
      { x: 'Berlin', y: 47 },
      { x: 'Lima', y: 38 },
      { x: 'Oslo', y: 22 },
    ],
    [tokyo, lagos]
  );

  return (
    <article className="site-wrap site-page">
      <header className="site-page__header site-dash__header">
        <div>
          <h1 className="site-page__title">Dashboard example</h1>
          <p className="site-page__lead">
            Every frame, stat, badge and table here is <a href={CSS_URL}>cybercore-css</a>; every
            chart is a Cybercore Charts React component. The data is synthetic.
          </p>
        </div>
        <div className="site-dash__feed">
          <LiveSwitch live={live} onChange={setLive} />
          <span className="site-hero__feed-note">One sample every 2 seconds.</span>
        </div>
      </header>

      <div className="site-dash">
        <section className="cyber-hud site-dash__wide" aria-labelledby="dash-overview">
          <h2 className="cyber-hud__label" id="dash-overview">
            Sector 7 overview
          </h2>
          <div className="site-dash__stats">
            <Stat label="Nodes online" value={String(last(nodes))} history={nodes} />
            <Stat
              label="Inbound, req/s"
              value={String(last(inbound) * 12)}
              history={inbound}
              tone="green"
            />
            <Stat
              label="Latency p95, ms"
              value={String(last(latency))}
              history={latency}
              tone="yellow"
              riseIsBad
            />
            <Stat
              label="Errors per minute"
              value={String(last(errors))}
              history={errors}
              tone="magenta"
              riseIsBad
            />
          </div>
        </section>

        <section
          className="cyber-hud cyber-hud--grid site-dash__main"
          aria-labelledby="dash-throughput"
        >
          <h2 className="cyber-hud__label" id="dash-throughput">
            Throughput
          </h2>
          <CyberLineChart
            className="site-chart"
            style={{ height: 300 }}
            data={traffic}
            interpolation="smooth"
            showArea
            showPoints={false}
            animate={false}
            responsive
            xAxis={{ showLabels: false, showGrid: false }}
            yAxis={{ min: 0, max: 100 }}
            ariaLabel="Inbound and outbound traffic, last minute"
          />
        </section>

        <section className="cyber-hud site-dash__side" aria-labelledby="dash-load">
          <h2 className="cyber-hud__label" id="dash-load">
            Core load
          </h2>
          <div className="site-dash__gauges">
            <CyberGaugeChart
              className="site-chart"
              style={{ height: 150 }}
              value={last(cpu)}
              label="CPU"
              thresholds={GAUGE_ZONES}
              formatValue={percent}
              thickness={12}
              showMinMax={false}
              showTicks={false}
              responsive
              ariaLabel="CPU load"
            />
            <CyberGaugeChart
              className="site-chart"
              style={{ height: 150 }}
              value={last(memory)}
              label="Memory"
              thresholds={GAUGE_ZONES}
              formatValue={percent}
              thickness={12}
              showMinMax={false}
              showTicks={false}
              responsive
              ariaLabel="Memory in use"
            />
          </div>
          <dl className="site-specs site-dash__zones">
            <div className="site-specs__row">
              <dt>Nominal</dt>
              <dd>below 60%</dd>
            </div>
            <div className="site-specs__row">
              <dt>Elevated</dt>
              <dd>60 to 85%</dd>
            </div>
            <div className="site-specs__row">
              <dt>Critical</dt>
              <dd>above 85%</dd>
            </div>
          </dl>
        </section>

        <section className="cyber-hud site-dash__third" aria-labelledby="dash-protocols">
          <h2 className="cyber-hud__label" id="dash-protocols">
            Traffic by protocol
          </h2>
          <CyberDonutChart
            className="site-chart"
            style={{ height: 280 }}
            data={DONUT_PROTOCOLS}
            showLabels={false}
            legend={{ show: true, position: 'bottom' }}
            centerText="2.4k"
            centerSubtext="req/s"
            responsive
            ariaLabel="Traffic by protocol"
          />
        </section>

        <section className="cyber-hud site-dash__third" aria-labelledby="dash-regions">
          <h2 className="cyber-hud__label" id="dash-regions">
            Requests by region
          </h2>
          <CyberBarChart
            className="site-chart"
            style={{ height: 280 }}
            data={regions}
            orientation="horizontal"
            padding={{ left: 64 }}
            showValues
            animate={false}
            responsive
            ariaLabel="Requests by region, thousands per minute"
          />
        </section>

        <section className="cyber-hud site-dash__third" aria-labelledby="dash-nodes">
          <h2 className="cyber-hud__label" id="dash-nodes">
            Nodes
          </h2>
          <ScrollTable label="Node table">
            <table className="cyber-table cyber-table--compact">
              <thead>
                <tr>
                  <th scope="col">Node</th>
                  <th scope="col">State</th>
                  <th scope="col" className="site-table__number">
                    Load
                  </th>
                </tr>
              </thead>
              <tbody>
                {NODES.map((node) => (
                  <tr key={node.name}>
                    <th scope="row" className="site-table__key">
                      {node.name}
                    </th>
                    <td>
                      <span className={STATE_BADGE[node.state]}>{node.state}</span>
                    </td>
                    <td className="site-table__number">{node.load}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </section>
      </div>

      <section className="site-section" aria-labelledby="dash-source">
        <h2 className="site-section__title" id="dash-source">
          How it is put together
        </h2>
        <p>
          A HUD frame is a <code>section</code> named by its label. Charts take{' '}
          <code>responsive</code> and a height from CSS, so the grid decides their width. Stats say
          their change in words; the sparkline beside them is hidden from assistive technology
          because the number is already there.
        </p>
        <CodeBlock code={DASHBOARD_SOURCE} language="tsx" title="Dashboard.tsx" />
      </section>
    </article>
  );
}

export default Dashboard;
