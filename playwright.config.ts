import { defineConfig, devices } from '@playwright/test';

/**
 * Cybercore Charts - Playwright Configuration
 * Used for visual regression testing of chart components
 */
export default defineConfig({
  // Directory containing visual test specs
  testDir: './tests/visual',

  // Run tests in parallel for faster execution
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Limit workers on CI for consistent results
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'on-failure' }]],

  // Shared settings for all projects
  use: {
    // Base URL for the demo site
    baseURL: 'http://localhost:4173',

    // Capture trace on first retry
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording off by default (enable for debugging)
    video: 'off',
  },

  // Browser configurations
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Set viewport for consistent screenshots
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
    // Mobile viewports for responsive testing
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],

  // Local dev server configuration
  webServer: {
    // Start the demo preview server
    command: 'npm run preview',
    url: 'http://localhost:4173',
    // Reuse existing server in development
    reuseExistingServer: !process.env.CI,
    // Wait for server to be ready
    timeout: 120000,
  },

  // Snapshot directory for visual regression tests
  snapshotDir: './tests/visual/__snapshots__',

  // Snapshot comparison settings
  expect: {
    // Global expectation timeout
    timeout: 10000,
    toHaveScreenshot: {
      // Allow slight pixel differences (anti-aliasing, etc.)
      maxDiffPixels: 100,
      // Threshold for pixel color comparison (0-1)
      threshold: 0.2,
      // Animation must be disabled before screenshot
      animations: 'disabled',
    },
    toMatchSnapshot: {
      // Threshold for image comparison
      threshold: 0.2,
    },
  },

  // Global timeout settings
  timeout: 30000,

  // Output directory for test artifacts
  outputDir: './test-results/',
});
