/**
 * Cybercore Charts - Visual Regression Tests
 * Tests chart rendering across different browsers and viewports
 */

import { test, expect } from '@playwright/test';

test.describe('Chart Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo page
    await page.goto('/');
    // Wait for charts to render
    await page.waitForSelector('.cyber-chart', { state: 'visible' });
  });

  test.describe('Line Chart', () => {
    test('should render correctly', async ({ page }) => {
      await page.goto('/#/charts/line');
      await page.waitForSelector('.cyber-chart--line');
      await expect(page.locator('.cyber-chart--line').first()).toHaveScreenshot(
        'line-chart-default.png'
      );
    });

    test('should render with multiple datasets', async ({ page }) => {
      await page.goto('/#/charts/line?datasets=multiple');
      await page.waitForSelector('.cyber-chart--line');
      await expect(page.locator('.cyber-chart--line').first()).toHaveScreenshot(
        'line-chart-multiple.png'
      );
    });

    test('should render with area fill', async ({ page }) => {
      await page.goto('/#/charts/line?fill=true');
      await page.waitForSelector('.cyber-chart--line');
      await expect(page.locator('.cyber-chart--line').first()).toHaveScreenshot(
        'line-chart-filled.png'
      );
    });
  });

  test.describe('Bar Chart', () => {
    test('should render vertical bars correctly', async ({ page }) => {
      await page.goto('/#/charts/bar');
      await page.waitForSelector('.cyber-chart--bar');
      await expect(page.locator('.cyber-chart--bar').first()).toHaveScreenshot(
        'bar-chart-vertical.png'
      );
    });

    test('should render horizontal bars correctly', async ({ page }) => {
      await page.goto('/#/charts/bar?orientation=horizontal');
      await page.waitForSelector('.cyber-chart--bar');
      await expect(page.locator('.cyber-chart--bar').first()).toHaveScreenshot(
        'bar-chart-horizontal.png'
      );
    });

    test('should render grouped bars', async ({ page }) => {
      await page.goto('/#/charts/bar?grouped=true');
      await page.waitForSelector('.cyber-chart--bar');
      await expect(page.locator('.cyber-chart--bar').first()).toHaveScreenshot(
        'bar-chart-grouped.png'
      );
    });

    test('should render stacked bars', async ({ page }) => {
      await page.goto('/#/charts/bar?stacked=true');
      await page.waitForSelector('.cyber-chart--bar');
      await expect(page.locator('.cyber-chart--bar').first()).toHaveScreenshot(
        'bar-chart-stacked.png'
      );
    });
  });

  test.describe('Pie Chart', () => {
    test('should render pie chart correctly', async ({ page }) => {
      await page.goto('/#/charts/pie');
      await page.waitForSelector('.cyber-chart--pie');
      await expect(page.locator('.cyber-chart--pie').first()).toHaveScreenshot('pie-chart.png');
    });

    test('should render donut chart correctly', async ({ page }) => {
      await page.goto('/#/charts/pie?donut=true');
      await page.waitForSelector('.cyber-chart--donut');
      await expect(page.locator('.cyber-chart--donut').first()).toHaveScreenshot('donut-chart.png');
    });
  });

  test.describe('Radar Chart', () => {
    test('should render radar chart correctly', async ({ page }) => {
      await page.goto('/#/charts/radar');
      await page.waitForSelector('.cyber-chart--radar');
      await expect(page.locator('.cyber-chart--radar').first()).toHaveScreenshot('radar-chart.png');
    });

    test('should render with multiple datasets', async ({ page }) => {
      await page.goto('/#/charts/radar?datasets=multiple');
      await page.waitForSelector('.cyber-chart--radar');
      await expect(page.locator('.cyber-chart--radar').first()).toHaveScreenshot(
        'radar-chart-multiple.png'
      );
    });
  });

  test.describe('Area Chart', () => {
    test('should render area chart correctly', async ({ page }) => {
      await page.goto('/#/charts/area');
      await page.waitForSelector('.cyber-chart--area');
      await expect(page.locator('.cyber-chart--area').first()).toHaveScreenshot('area-chart.png');
    });

    test('should render with gradient', async ({ page }) => {
      await page.goto('/#/charts/area?gradient=true');
      await page.waitForSelector('.cyber-chart--area');
      await expect(page.locator('.cyber-chart--area').first()).toHaveScreenshot(
        'area-chart-gradient.png'
      );
    });
  });

  test.describe('Scatter Chart', () => {
    test('should render scatter chart correctly', async ({ page }) => {
      await page.goto('/#/charts/scatter');
      await page.waitForSelector('.cyber-chart--scatter');
      await expect(page.locator('.cyber-chart--scatter').first()).toHaveScreenshot(
        'scatter-chart.png'
      );
    });
  });
});

test.describe('Chart Components', () => {
  test('should render legend correctly', async ({ page }) => {
    await page.goto('/#/charts/line?legend=true');
    await page.waitForSelector('.cyber-chart-legend');
    await expect(page.locator('.cyber-chart-legend').first()).toHaveScreenshot('chart-legend.png');
  });

  test('should render axes correctly', async ({ page }) => {
    await page.goto('/#/charts/line?axes=true');
    await page.waitForSelector('.cyber-chart-axis');
    await expect(page.locator('.cyber-chart').first()).toHaveScreenshot('chart-with-axes.png');
  });

  test('should render grid correctly', async ({ page }) => {
    await page.goto('/#/charts/line?grid=true');
    await page.waitForSelector('.cyber-chart-grid');
    await expect(page.locator('.cyber-chart').first()).toHaveScreenshot('chart-with-grid.png');
  });

  test('should render title correctly', async ({ page }) => {
    await page.goto('/#/charts/line?title=Test%20Chart');
    await page.waitForSelector('.cyber-chart-title');
    await expect(page.locator('.cyber-chart').first()).toHaveScreenshot('chart-with-title.png');
  });
});

test.describe('Chart Themes', () => {
  test('should render with cyan theme', async ({ page }) => {
    await page.goto('/#/charts/line?theme=cyan');
    await page.waitForSelector('.cyber-chart');
    await expect(page.locator('.cyber-chart').first()).toHaveScreenshot('chart-theme-cyan.png');
  });

  test('should render with magenta theme', async ({ page }) => {
    await page.goto('/#/charts/line?theme=magenta');
    await page.waitForSelector('.cyber-chart');
    await expect(page.locator('.cyber-chart').first()).toHaveScreenshot('chart-theme-magenta.png');
  });

  test('should render with green theme', async ({ page }) => {
    await page.goto('/#/charts/line?theme=green');
    await page.waitForSelector('.cyber-chart');
    await expect(page.locator('.cyber-chart').first()).toHaveScreenshot('chart-theme-green.png');
  });

  test('should render with yellow theme', async ({ page }) => {
    await page.goto('/#/charts/line?theme=yellow');
    await page.waitForSelector('.cyber-chart');
    await expect(page.locator('.cyber-chart').first()).toHaveScreenshot('chart-theme-yellow.png');
  });
});

test.describe('Chart Interactions', () => {
  test('should show tooltip on hover', async ({ page }) => {
    await page.goto('/#/charts/line?tooltip=true');
    await page.waitForSelector('.cyber-chart');

    // Hover over a data point
    const point = page.locator('.cyber-chart-point').first();
    await point.hover();

    // Wait for tooltip to appear
    await page.waitForSelector('.cyber-chart-tooltip', { state: 'visible' });
    await expect(page.locator('.cyber-chart-tooltip')).toHaveScreenshot('chart-tooltip.png');
  });

  test('should highlight on hover', async ({ page }) => {
    await page.goto('/#/charts/bar');
    await page.waitForSelector('.cyber-chart-bar');

    // Hover over a bar
    const bar = page.locator('.cyber-chart-bar').first();
    await bar.hover();

    await expect(page.locator('.cyber-chart').first()).toHaveScreenshot('chart-bar-hover.png');
  });
});

test.describe('Responsive Charts', () => {
  test('should render at small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/charts/line?responsive=true');
    await page.waitForSelector('.cyber-chart');
    await expect(page.locator('.cyber-chart').first()).toHaveScreenshot('chart-small-viewport.png');
  });

  test('should render at medium viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/#/charts/line?responsive=true');
    await page.waitForSelector('.cyber-chart');
    await expect(page.locator('.cyber-chart').first()).toHaveScreenshot(
      'chart-medium-viewport.png'
    );
  });

  test('should render at large viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/#/charts/line?responsive=true');
    await page.waitForSelector('.cyber-chart');
    await expect(page.locator('.cyber-chart').first()).toHaveScreenshot('chart-large-viewport.png');
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/#/charts/line');
    await page.waitForSelector('.cyber-chart');

    const chart = page.locator('.cyber-chart svg').first();
    await expect(chart).toHaveAttribute('role', 'img');
  });

  test('should support reduced motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/charts/line?animate=true');
    await page.waitForSelector('.cyber-chart');

    // Chart should have reduced motion class
    const chart = page.locator('.cyber-chart');
    await expect(chart).toHaveClass(/cyber-chart--reduced-motion/);
  });
});

test.describe('Dark Mode', () => {
  test('should render correctly in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/#/charts/line');
    await page.waitForSelector('.cyber-chart');
    await expect(page.locator('.cyber-chart').first()).toHaveScreenshot('chart-dark-mode.png');
  });
});
