import {
  CyberBarChart,
  CyberDonutChart,
  CyberGaugeChart,
  CyberLineChart,
  CyberSparkline,
} from '@cybercore-charts/react';

import { BAR_SINGLE, DONUT_STORAGE, GAUGE_ZONES, LINE_SINGLE, SPARK_NOISY } from '../data/samples';

import type { ChartSlug } from '../routes';

// Thumbnails are pictures of a chart next to a link that names it: no
// tooltip, no tab stops, no hidden data table.
const QUIET = {
  responsive: true,
  tooltip: { enabled: false },
  keyboard: false,
  dataTable: false,
} as const;

/** A small, non-interactive rendering of one chart type. */
function ChartThumb({ slug }: { slug: ChartSlug }) {
  switch (slug) {
    case 'line':
      return (
        <CyberLineChart
          {...QUIET}
          data={LINE_SINGLE}
          interpolation="smooth"
          showArea
          xAxis={{ showLabels: false, showGrid: false }}
          yAxis={{ showLabels: false }}
          padding={{ top: 12, right: 12, bottom: 12, left: 12 }}
        />
      );
    case 'bar':
      return (
        <CyberBarChart
          {...QUIET}
          data={BAR_SINGLE}
          xAxis={{ showLabels: false }}
          yAxis={{ showLabels: false }}
          padding={{ top: 12, right: 12, bottom: 12, left: 12 }}
        />
      );
    case 'donut':
      return (
        <CyberDonutChart
          {...QUIET}
          data={DONUT_STORAGE}
          showLabels={false}
          legend={{ show: false }}
          centerText="68%"
          padding={{ top: 8, right: 8, bottom: 8, left: 8 }}
        />
      );
    case 'gauge':
      return (
        <CyberGaugeChart
          {...QUIET}
          value={72}
          thresholds={GAUGE_ZONES}
          thickness={14}
          showMinMax={false}
          showTicks={false}
          padding={{ top: 8, right: 8, bottom: 8, left: 8 }}
        />
      );
    default:
      return <CyberSparkline data={SPARK_NOISY} width={220} height={56} showArea showMinMax />;
  }
}

export default ChartThumb;
