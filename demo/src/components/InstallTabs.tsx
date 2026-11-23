import { CDN_VERSION, cdnSnippet, NPM_INSTALL } from '../site';

import CodeTabs from './CodeTabs';

import type { CodeTab } from './CodeTabs';

const TABS: CodeTab[] = [
  {
    id: 'npm',
    label: 'npm',
    language: 'bash',
    code: NPM_INSTALL,
    note: 'Then import from "cybercore-charts", "cybercore-charts/react" or "cybercore-charts/ember".',
  },
  {
    id: 'jsdelivr',
    label: 'jsDelivr',
    language: 'html',
    code: cdnSnippet('jsdelivr'),
    note: `Pinned to ${CDN_VERSION} with a Subresource Integrity hash, so the file cannot change under you. The script defines one global, CyberCharts.`,
  },
  {
    id: 'unpkg',
    label: 'unpkg',
    language: 'html',
    code: cdnSnippet('unpkg'),
    note: `The same ${CDN_VERSION} file and the same integrity hash, served by unpkg.`,
  },
];

/** Install commands: npm, or a script tag from either CDN. */
function InstallTabs() {
  return <CodeTabs label="Install method" tabs={TABS} />;
}

export default InstallTabs;
