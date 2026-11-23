/**
 * CyberCore Charts with Ember (5+, Octane and Polaris).
 *
 *   npm install cybercore-charts ember-modifier
 *
 * One modifier, `cyberChart`, draws every chart type. Its first argument names
 * the chart; named arguments are the chart options and event handlers. The
 * chart is created with the element, updated in place when a tracked argument
 * changes, and destroyed with the element.
 *
 * Classic templates: re-export the modifier once as app/modifiers/cyber-chart.js
 *
 *   export { default } from 'cybercore-charts/ember';
 *
 * and write `{{cyber-chart "line" data=this.points}}`.
 */

import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

import { cyberChart } from 'cybercore-charts/ember';

import type { ChartEvent, DataPoint, DonutSegment, GaugeThreshold } from 'cybercore-charts/ember';
import type { GaugeChart } from 'cybercore-charts';

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

const percent = (value: number): string => `${Math.round(value)}%`;

export default class Dashboard extends Component {
  @tracked points: DataPoint[] = [
    { x: 'Mon', y: 12 },
    { x: 'Tue', y: 30 },
    { x: 'Wed', y: 18 },
    { x: 'Thu', y: 41 },
  ];

  @tracked load = 72;

  @tracked selected = 'Nothing selected yet.';

  // Kept for imperative calls such as gauge.toSVG().
  gauge: GaugeChart | null = null;

  keepGauge = (chart: GaugeChart): void => {
    this.gauge = chart;
  };

  select = (event: ChartEvent<{ point: DataPoint }>): void => {
    this.selected = `${String(event.data.point.x)}: ${event.data.point.y}`;
  };

  // Replace tracked arrays instead of mutating them, so the modifier re-runs.
  addPoint = (): void => {
    const next = Math.round(10 + Math.random() * 40);
    this.points = [...this.points, { x: `Day ${this.points.length + 1}`, y: next }];
    this.load = Math.min(100, next * 2);
  };

  <template>
    <section aria-labelledby="traffic-title">
      <h2 id="traffic-title">Traffic</h2>
      {{! A responsive chart fills its element, so the element needs a height. }}
      <div
        style="height: 280px"
        {{cyberChart
          "line"
          data=this.points
          interpolation="smooth"
          showArea=true
          responsive=true
          ariaLabel="Requests per day"
          onPointClick=this.select
        }}
      ></div>
      <p aria-live="polite">{{this.selected}}</p>
      <button type="button" {{on "click" this.addPoint}}>Add a day</button>
    </section>

    <section aria-labelledby="load-title">
      <h2 id="load-title">Core load</h2>
      <div
        style="height: 220px"
        {{cyberChart
          "gauge"
          value=this.load
          thresholds=ZONES
          formatValue=percent
          responsive=true
          ariaLabel="Core load"
          onCreated=this.keepGauge
        }}
      ></div>
    </section>

    <section aria-labelledby="protocols-title">
      <h2 id="protocols-title">Traffic by protocol</h2>
      <div
        style="height: 280px"
        {{cyberChart "donut" data=PROTOCOLS centerText="100%" responsive=true ariaLabel="Traffic by protocol"}}
      ></div>
    </section>
  </template>
}
