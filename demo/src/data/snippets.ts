/** The hand-written code samples of the home page and the docs. */

export const VANILLA_USAGE = `import { LineChart } from 'cybercore-charts';

const chart = new LineChart('#traffic', {
  data: [
    { x: 'Mon', y: 12 },
    { x: 'Tue', y: 30 },
    { x: 'Wed', y: 18 },
  ],
  showArea: true,
  responsive: true,
  ariaLabel: 'Requests per day',
});

chart.update(nextData);   // new data, same chart
chart.destroy();          // removes the SVG, observers and tooltip`;

export const REACT_USAGE = `import { CyberLineChart } from 'cybercore-charts/react';

export function Traffic({ data }) {
  return (
    <CyberLineChart
      data={data}
      showArea
      responsive
      ariaLabel="Requests per day"
      style={{ height: 320 }}
      onPointClick={(event) => console.log(event.data)}
    />
  );
}`;

export const EMBER_USAGE = `import { cyberChart } from 'cybercore-charts/ember';

<template>
  <div
    style="height: 320px"
    {{cyberChart "line"
      data=@data
      showArea=true
      responsive=true
      ariaLabel="Requests per day"
      onPointClick=@onSelect
    }}
  ></div>
</template>`;

export const REACT_REF = `import { useRef } from 'react';
import { CyberDonutChart } from 'cybercore-charts/react';

export function Storage({ segments }) {
  const chart = useRef(null);

  const download = () => {
    const svg = chart.current.toSVG();   // the chart as an SVG string
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    window.open(url);
  };

  return (
    <>
      <CyberDonutChart ref={chart} data={segments} ariaLabel="Storage by volume" />
      <button type="button" onClick={download}>Export SVG</button>
    </>
  );
}`;

export const REACT_HOOK = `import { LineChart } from 'cybercore-charts';
import { useChart } from 'cybercore-charts/react';

// useChart mounts any chart class, including your own BaseChart subclass.
export function Traffic({ data }) {
  const ref = useChart(LineChart, { data, responsive: true });
  return <div ref={ref} style={{ height: 320 }} />;
}`;

export const NEXT_USAGE = `'use client';

// The components draw after mount, so they belong in a client component.
// On the server they render an empty container: give it a height and the
// page does not shift when the chart appears.
export { CyberLineChart } from 'cybercore-charts/react';`;

export const EMBER_CLASSIC = `// app/modifiers/cyber-chart.js
export { default } from 'cybercore-charts/ember';`;

export const EMBER_CLASSIC_TEMPLATE = `<div
  style="height: 240px"
  {{cyber-chart "gauge"
    value=this.load
    max=100
    label="Core load"
    onCreated=this.keepChart
  }}
></div>`;

export const THEME_ATTRIBUTE = `<!-- The whole page -->
<html data-theme="magenta">

<!-- Or one region -->
<section data-theme="amber">
  <div id="heat"></div>
</section>`;

export const THEME_OPTIONS = `// Pin a hue, whatever the page theme is
new LineChart('#errors', { data, theme: 'magenta' });

// Colour one series or one segment yourself
new LineChart('#traffic', {
  data: [
    { id: 'in', name: 'Inbound', data: inbound },
    { id: 'out', name: 'Outbound', data: outbound, color: '#b388ff' },
  ],
});`;

export const THEME_TOKENS = `/* Without cybercore-css: set the tokens the charts read */
:root {
  --color-accent: #7cf;
  --color-accent-light: #aef;
  --color-accent-dark: #38a;
  --color-text-secondary: #9aa3b5;
  --color-border-default: #2a2f3d;
}`;

export const A11Y_OPTIONS = `new BarChart('#regions', {
  data,
  ariaLabel: 'Requests per region',                    // the accessible name
  description: 'Tokyo leads with 84 thousand requests.', // replaces the generated summary
  locale: 'en-GB',                                      // number and date formatting
  dataTable: true,                                      // hidden table of the values (default)
  keyboard: true,                                       // arrow-key navigation (default)
});`;

export const DASHBOARD_SOURCE = `import { CyberGaugeChart, CyberLineChart, CyberSparkline } from 'cybercore-charts/react';
import 'cybercore-css';

export function Overview({ nodes, traffic, load }) {
  return (
    <>
      {/* A HUD frame groups a panel and names it */}
      <section className="cyber-hud" aria-labelledby="overview">
        <h2 className="cyber-hud__label" id="overview">Sector 7</h2>
        <div className="cyber-grid cyber-grid--4 cyber-gap-md">
          <div className="cyber-stat cyber-stat--start">
            <div className="cyber-stat__value">{nodes.online}</div>
            <div className="cyber-stat__label">Nodes online</div>
            <div className="cyber-stat__delta cyber-stat__delta--up">Up 3 since 09:00</div>
            {/* The number is in text, so the sparkline is decoration */}
            <CyberSparkline data={nodes.history} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="cyber-hud cyber-hud--grid" aria-labelledby="throughput">
        <h2 className="cyber-hud__label" id="throughput">Throughput</h2>
        <CyberLineChart
          data={traffic}
          interpolation="smooth"
          showArea
          responsive
          ariaLabel="Inbound and outbound traffic, last hour"
          style={{ height: 280 }}
        />
      </section>

      <section className="cyber-hud" aria-labelledby="load">
        <h2 className="cyber-hud__label" id="load">Core load</h2>
        <CyberGaugeChart
          value={load}
          formatValue={(value) => \`\${Math.round(value)}%\`}
          thresholds={[
            { value: 60, theme: 'green' },
            { value: 85, theme: 'yellow' },
            { value: 100, theme: 'magenta' },
          ]}
          responsive
          style={{ height: 220 }}
        />
      </section>
    </>
  );
}`;
