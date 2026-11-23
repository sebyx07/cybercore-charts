import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from './site.ts';

/**
 * The route table as data. The app reads it for navigation and document
 * titles; the build reads it to write one HTML file and one sitemap entry per
 * page.
 */
export interface RouteMeta {
  /** Path under the site base, with a leading slash and no trailing one. */
  path: string;
  title: string;
  description: string;
}

export type ChartSlug = 'line' | 'bar' | 'donut' | 'gauge' | 'sparkline';

export interface ChartRoute extends RouteMeta {
  slug: ChartSlug;
  /** Short name for navigation: "Line". */
  name: string;
  /** One line for cards and link lists. */
  summary: string;
}

export const CHART_ROUTES: ChartRoute[] = [
  {
    slug: 'line',
    name: 'Line',
    path: '/charts/line',
    title: `Line and area chart playground | ${SITE_NAME}`,
    summary: 'Trends over time: smooth, straight or stepped, with an optional area fill.',
    description:
      'Edit a live SVG line chart: curves, area fill, points, axes and several series. Copy the code for vanilla JS, React or Ember.',
  },
  {
    slug: 'bar',
    name: 'Bar',
    path: '/charts/bar',
    title: `Bar chart playground | ${SITE_NAME}`,
    summary: 'Compare categories: vertical or horizontal, grouped or stacked.',
    description:
      'Edit a live SVG bar chart: orientation, grouped or stacked series, value labels and gaps. Copy the code for vanilla JS, React or Ember.',
  },
  {
    slug: 'donut',
    name: 'Donut',
    path: '/charts/donut',
    title: `Donut and pie chart playground | ${SITE_NAME}`,
    summary: 'Parts of a whole, as a donut with a centre readout or a full pie.',
    description:
      'Edit a live SVG donut or pie chart: inner radius, segment gap, labels, legend and centre text. Copy the code for vanilla JS, React or Ember.',
  },
  {
    slug: 'gauge',
    name: 'Gauge',
    path: '/charts/gauge',
    title: `Gauge chart playground | ${SITE_NAME}`,
    summary: 'One value against a range, with threshold zones and tick marks.',
    description:
      'Edit a live SVG gauge: value, range, sweep angle, thickness, ticks and threshold zones. Copy the code for vanilla JS, React or Ember.',
  },
  {
    slug: 'sparkline',
    name: 'Sparkline',
    path: '/charts/sparkline',
    title: `Sparkline playground | ${SITE_NAME}`,
    summary: 'A word-sized trend line for table cells, stat tiles and sentences.',
    description:
      'Edit a live SVG sparkline: area fill, end point, min and max markers and curve. Copy the code for vanilla JS, React or Ember.',
  },
];

export const ROUTES: RouteMeta[] = [
  { path: '/', title: `${SITE_NAME}: ${SITE_TAGLINE}`, description: SITE_DESCRIPTION },
  {
    path: '/charts',
    title: `Chart types | ${SITE_NAME}`,
    description:
      'Five SVG chart types with live playgrounds: line, bar, donut, gauge and sparkline. Change options and data, then copy the code.',
  },
  ...CHART_ROUTES,
  {
    path: '/dashboard',
    title: `Dashboard example | ${SITE_NAME}`,
    description:
      'A live operations dashboard built from Cybercore Charts and cybercore-css HUD frames, stats and tables, with the source to copy.',
  },
  {
    path: '/docs',
    title: `Getting started | ${SITE_NAME}`,
    description:
      'Install Cybercore Charts from npm or a CDN and draw a first chart in vanilla JS, React or Ember. Theming, server rendering and accessibility.',
  },
];

export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

// Where the pages of the previous hash-routed site (/#/line-charts) live now.
const LEGACY_PATHS: Record<string, string> = {
  '/line-charts': '/charts/line',
  '/bar-charts': '/charts/bar',
  '/radial-charts': '/charts/donut',
  '/realtime': '/dashboard',
};

export function legacyPath(path: string): string {
  return LEGACY_PATHS[normalizePath(path)] ?? path;
}
