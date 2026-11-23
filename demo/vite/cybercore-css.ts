import { readFileSync } from 'node:fs';

import type { Plugin } from 'vite';

/**
 * Tells the app what the cybercore-css build it is bundled with can do.
 *
 * `virtual:cybercore-css` exports the accent themes the stylesheet declares
 * with `[data-theme="…"]`, so the theme switcher lists exactly those and
 * disappears when there are none. A stylesheet without the features this site
 * is written against (themes, HUD frames) gets a build warning, not a broken
 * build: the charts still render, the chrome around them is plainer.
 */

const VIRTUAL_ID = 'virtual:cybercore-css';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const REQUIRED = ['.cyber-hud', '.cyber-stat', '.cyber-switch', '.cyber-range'];

function themesIn(css: string): string[] {
  const names = [...css.matchAll(/\[data-theme=["']?([\w-]+)["']?\]/g)].map((match) => match[1]);
  return [...new Set(names)];
}

export function cybercoreCss(cssPath: string): Plugin {
  return {
    name: 'cybercore-css-features',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) {
        return undefined;
      }
      this.addWatchFile(cssPath);
      const css = readFileSync(cssPath, 'utf8');
      const themes = themesIn(css);
      const missing = REQUIRED.filter((selector) => !css.includes(selector));
      if (themes.length === 0 || missing.length > 0) {
        this.warn(
          `${cssPath} is an older cybercore-css: ` +
            [
              themes.length === 0 ? 'no [data-theme] accents (theme switcher hidden)' : '',
              missing.length > 0 ? `missing ${missing.join(', ')}` : '',
            ]
              .filter(Boolean)
              .join('; ') +
            '. Update the cybercore-css devDependency, or point CYBERCORE_CSS at a newer build.'
        );
      }
      return `export const themes = ${JSON.stringify(themes)};`;
    },
  };
}
