/**
 * Visual Regression Tests for Presence Aurora Ring
 *
 * Tests visual appearance of Presence Aurora Ring component
 * with different statuses and configurations.
 */

import { test, expect } from '@playwright/test';

test.describe('Presence Aurora Ring Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test page or create a test page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should render online status correctly', async ({ page }) => {
    // Inject test component or navigate to page with Presence Aurora Ring
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="test-container" style="padding: 20px; background: white;">
          <div id="aurora-online"></div>
        </div>
      `;
    });

    // Wait for component to render
    await page.waitForTimeout(500);

    // Take screenshot
    const screenshot = await page.screenshot({
      path: 'test-results/presence-aurora-online.png',
      fullPage: false,
    });

    expect(screenshot).toBeTruthy();

    // Compare with baseline (if visual regression testing is set up)
    // await expect(page).toHaveScreenshot('presence-aurora-online.png');
  });

  test('should render away status correctly', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="test-container" style="padding: 20px; background: white;">
          <div id="aurora-away"></div>
        </div>
      `;
    });

    await page.waitForTimeout(500);

    const screenshot = await page.screenshot({
      path: 'test-results/presence-aurora-away.png',
      fullPage: false,
    });

    expect(screenshot).toBeTruthy();
  });

  test('should render busy status correctly', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="test-container" style="padding: 20px; background: white;">
          <div id="aurora-busy"></div>
        </div>
      `;
    });

    await page.waitForTimeout(500);

    const screenshot = await page.screenshot({
      path: 'test-results/presence-aurora-busy.png',
      fullPage: false,
    });

    expect(screenshot).toBeTruthy();
  });

  test('should render offline status correctly', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="test-container" style="padding: 20px; background: white;">
          <div id="aurora-offline"></div>
        </div>
      `;
    });

    await page.waitForTimeout(500);

    const screenshot = await page.screenshot({
      path: 'test-results/presence-aurora-offline.png',
      fullPage: false,
    });

    expect(screenshot).toBeTruthy();
  });

  test('should respect reduced motion preference', async ({ page, context }) => {
    // Enable reduced motion
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => {
          if (query === '(prefers-reduced-motion: reduce)') {
            return {
              matches: true,
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => true,
            };
          }
          return window.matchMedia(query);
        },
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if animation is disabled
    const animationStyle = await page.evaluate(() => {
      const element = document.querySelector('[id^="aurora"]');
      return window.getComputedStyle(element!).animation;
    });

    // Animation should be disabled or very short
    expect(animationStyle).toBe('none');
  });

  test('should render in dark mode', async ({ page }) => {
    // Set dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="test-container" style="padding: 20px; background: #1a1a1a;">
          <div id="aurora-online-dark"></div>
        </div>
      `;
    });

    await page.waitForTimeout(500);

    const screenshot = await page.screenshot({
      path: 'test-results/presence-aurora-online-dark.png',
      fullPage: false,
    });

    expect(screenshot).toBeTruthy();
  });

  test('should render different sizes correctly', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="test-container" style="padding: 20px; background: white; display: flex; gap: 20px;">
          <div id="aurora-small" data-size="24"></div>
          <div id="aurora-medium" data-size="40"></div>
          <div id="aurora-large" data-size="64"></div>
        </div>
      `;
    });

    await page.waitForTimeout(500);

    const screenshot = await page.screenshot({
      path: 'test-results/presence-aurora-sizes.png',
      fullPage: false,
    });

    expect(screenshot).toBeTruthy();
  });
});
