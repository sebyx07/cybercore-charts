// Screenshots of the demo pages, compared against tests/visual/__snapshots__/.
// Run through scripts/visual.sh (see playwright.config.ts).
//
// The config emulates prefers-reduced-motion, which also keeps the demo's live data feeds
// paused: their series are seeded, so every page renders the same pixels on every run.
import { expect, test } from '@playwright/test';

import type { Page } from '@playwright/test';

// Paths are relative to the baseURL (the site's /cybercore-charts/ base).
const PAGES = [
  { name: 'home', path: '' },
  { name: 'charts', path: 'charts/' },
  { name: 'line', path: 'charts/line/' },
  { name: 'bar', path: 'charts/bar/' },
  { name: 'donut', path: 'charts/donut/' },
  { name: 'gauge', path: 'charts/gauge/' },
  { name: 'sparkline', path: 'charts/sparkline/' },
  { name: 'dashboard', path: 'dashboard/' },
  { name: 'docs', path: 'docs/' },
];

// The pages whose layout changes most between one column and several.
const PHONE_PAGES = PAGES.filter(({ name }) => ['home', 'line', 'dashboard'].includes(name));

async function settle(page: Page, path: string): Promise<void> {
  await page.goto(path);
  // Lazy routes show a skeleton first; the page is there once its heading is.
  await page.locator('main h1').waitFor();
  await page.evaluate(() => document.fonts.ready);
  // Responsive charts redraw once after measuring their container.
  await page.waitForLoadState('networkidle');
}

for (const { name, path } of PAGES) {
  test(`${name} page`, async ({ page }) => {
    await settle(page, path);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}

test.describe('phone width', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const { name, path } of PHONE_PAGES) {
    test(`${name} page`, async ({ page }) => {
      await settle(page, path);
      await expect(page).toHaveScreenshot(`${name}-phone.png`, { fullPage: true });
    });
  }

  test('menu opens and lists the pages', async ({ page }) => {
    await settle(page, '');
    await page.getByRole('button', { name: 'Menu' }).click();
    const menu = page.getByRole('navigation', { name: 'Main' });
    await expect(menu.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
  });
});

test('old hash links land on the page that replaced them', async ({ page }) => {
  await page.goto('#/radial-charts');
  await expect(page).toHaveURL(/\/charts\/donut$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Donut chart' })).toBeVisible();
});

test('an unknown address shows the not-found page', async ({ page }) => {
  await page.goto('no-such-page/');
  await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
});
