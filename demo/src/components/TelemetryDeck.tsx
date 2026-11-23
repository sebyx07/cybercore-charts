import { useMemo } from 'react';

import { CyberGaugeChart, CyberLineChart, CyberSparkline } from '@cybercore-charts/react';

import { GAUGE_ZONES } from '../data/samples';
import { useFeed } from '../lib/useFeed';

import type { DataSeries } from '@cybercore-charts/types';

const percent = (value: number) => `${Math.round(value)}%`;

interface TelemetryDeckProps {
  live: boolean;
  /** Heading level of the frame label, to fit the page outline. */
  as?: 'h2' | 'h3';
}

/**
 * The panel on the home page and the social card: a cybercore-css HUD frame
 * around a live line chart, a gauge and two stats with sparklines.
 */
function TelemetryDeck({ live, as: Heading = 'h2' }: TelemetryDeckProps) {
  const inbound = useFeed({ seed: 11, count: 24, start: 58, step: 14 }, live);
  const outbound = useFeed({ seed: 23, count: 24, start: 34, step: 10, max: 70 }, live);
  const load = useFeed({ seed: 5, count: 20, start: 64, step: 9, min: 20 }, live);
  const latency = useFeed({ seed: 31, count: 20, start: 42, step: 8, min: 12, max: 90 }, live);

  const series = useMemo<DataSeries[]>(
    () => [
      { id: 'inbound', name: 'Inbound', data: inbound.map((y, x) => ({ x, y })) },
      { id: 'outbound', name: 'Outbound', data: outbound.map((y, x) => ({ x, y })) },
    ],
    [inbound, outbound]
  );
  const currentLoad = load[load.length - 1] ?? 0;
  const currentLatency = latency[latency.length - 1] ?? 0;
  const currentInbound = inbound[inbound.length - 1] ?? 0;

  return (
    <section className="cyber-hud cyber-hud--grid site-deck" aria-labelledby="deck-title">
      <Heading className="cyber-hud__label" id="deck-title">
        Uplink telemetry
      </Heading>

      <CyberLineChart
        className="site-deck__chart"
        data={series}
        interpolation="smooth"
        showArea
        showPoints={false}
        animate={false}
        responsive
        xAxis={{ showLabels: false, showGrid: false }}
        yAxis={{ min: 0, max: 100, ticks: 4 }}
        ariaLabel="Inbound and outbound traffic, last 24 samples"
      />

      <div className="site-deck__row">
        <figure className="site-deck__meter">
          <CyberGaugeChart
            className="site-deck__gauge"
            value={currentLoad}
            thresholds={GAUGE_ZONES}
            formatValue={percent}
            thickness={12}
            showMinMax={false}
            showTicks={false}
            responsive
            ariaLabel="Core load"
          />
          <figcaption className="cyber-stat__label">Core load</figcaption>
        </figure>
        <div className="site-deck__stats">
          <div className="cyber-stat cyber-stat--start">
            <div className="cyber-stat__value">{currentInbound * 12}</div>
            <div className="cyber-stat__label">Inbound, req/s</div>
            <CyberSparkline
              data={inbound}
              width={120}
              height={28}
              animate={false}
              aria-hidden="true"
            />
          </div>
          <div className="cyber-stat cyber-stat--start cyber-stat--magenta">
            <div className="cyber-stat__value">{currentLatency}</div>
            <div className="cyber-stat__label">Latency p95, ms</div>
            <CyberSparkline
              data={latency}
              theme="magenta"
              width={120}
              height={28}
              animate={false}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default TelemetryDeck;
