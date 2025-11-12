import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 *
 * Configures Playwright for E2E testing, visual regression, and performance testing.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // UI Audit screenshot projects
    {
      name: 'ui-audit-xs',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 },
      },
      testMatch: '**/ui-audit/**/*.spec.ts',
    },
    {
      name: 'ui-audit-sm',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 640, height: 960 },
      },
      testMatch: '**/ui-audit/**/*.spec.ts',
    },
    {
      name: 'ui-audit-md',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
      testMatch: '**/ui-audit/**/*.spec.ts',
    },
    {
      name: 'ui-audit-lg',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
      },
      testMatch: '**/ui-audit/**/*.spec.ts',
    },
    {
      name: 'ui-audit-xl',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: '**/ui-audit/**/*.spec.ts',
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },

  // Visual regression testing
  expect: {
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 100,
    },
  },
});
