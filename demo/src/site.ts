import cdn from './data/cdn.json' with { type: 'json' };

/**
 * Single source of truth for everything the site tells people to copy and
 * every URL it links to. index.html is filled from here at build time.
 */

export const SITE_NAME = 'Cybercore Charts';
export const SITE_URL = 'https://sebyx07.github.io/cybercore-charts';
export const SITE_TAGLINE = 'Cyberpunk SVG charts, zero dependencies';
export const SITE_DESCRIPTION =
  'Cybercore Charts is a zero-dependency SVG chart library with a neon look: line, bar, donut, gauge and sparkline, with React and Ember adapters and keyboard access.';

export const REPO_URL = 'https://github.com/sebyx07/cybercore-charts';
export const NPM_URL = 'https://www.npmjs.com/package/cybercore-charts';
export const CHANGELOG_URL = `${REPO_URL}/blob/main/CHANGELOG.md`;
export const API_URL = `${REPO_URL}#readme`;
export const CSS_URL = 'https://sebyx07.github.io/cybercore-css';
export const CSS_NPM_URL = 'https://www.npmjs.com/package/cybercore-css';
export const MAINTAINER_URL = 'https://developerz.ai';

/** The families cybercore-css names in its font tokens. */
export const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Exo+2:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Rajdhani:wght@400;500;600;700&display=swap';

export const NPM_INSTALL = 'npm install cybercore-charts';

export const CDN_VERSION = cdn.version;
export const CDN_INTEGRITY = cdn.integrity;

export const CDN_URLS = {
  jsdelivr: `https://cdn.jsdelivr.net/npm/cybercore-charts@${cdn.version}/${cdn.file}`,
  unpkg: `https://unpkg.com/cybercore-charts@${cdn.version}/${cdn.file}`,
} as const;

export type CdnName = keyof typeof CDN_URLS;

/** A script tag pinned to a published version, with its integrity hash. */
export function cdnSnippet(name: CdnName): string {
  return `<div id="chart"></div>

<script src="${CDN_URLS[name]}" integrity="${CDN_INTEGRITY}" crossorigin="anonymous"></script>
<script>
  CyberCharts.createChart('line', '#chart', {
    data: [
      { x: 'Mon', y: 12 },
      { x: 'Tue', y: 30 },
      { x: 'Wed', y: 18 },
    ],
    showArea: true,
  });
</script>`;
}
