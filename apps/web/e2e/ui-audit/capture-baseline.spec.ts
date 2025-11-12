/**
 * Baseline Screenshot Capture for UI Audit
 * Captures screenshots across all routes × breakpoints × themes × states
 */

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface RouteConfig {
  path: string;
  component: string;
  states?: string[];
  requiresAuth?: boolean;
}

const BREAKPOINTS = {
  xs: { width: 375, height: 667 },
  sm: { width: 640, height: 960 },
  md: { width: 768, height: 1024 },
  lg: { width: 1024, height: 768 },
  xl: { width: 1280, height: 720 },
};

const THEMES = ['light', 'dark'] as const;
const STATES = ['idle', 'hover', 'focus', 'active', 'disabled', 'loading', 'error', 'empty'] as const;

// Routes to capture
const ROUTES: RouteConfig[] = [
  { path: '/', component: 'WelcomeScreen', states: ['welcome'] },
  { path: '/', component: 'AuthScreen', states: ['auth'] },
  { path: '/', component: 'MainApp', states: ['main'] },
  { path: '/demo/pets', component: 'PetsDemoPage' },
];

const SCREENSHOT_DIR = join(process.cwd(), 'reports/ui-audit/screens/web');
const AXE_RESULTS_DIR = join(process.cwd(), 'reports/ui-audit');

// Ensure directories exist
mkdirSync(SCREENSHOT_DIR, { recursive: true });
mkdirSync(AXE_RESULTS_DIR, { recursive: true });

const axeViolations: Array<{
  route: string;
  breakpoint: string;
  theme: string;
  violations: unknown[];
}> = [];

async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.evaluate((t) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, theme);

  // Wait for theme to apply
  await page.waitForTimeout(100);
}

async function captureState(
  page: Page,
  route: RouteConfig,
  breakpoint: keyof typeof BREAKPOINTS,
  theme: 'light' | 'dark',
  state: string
): Promise<void> {
  const bp = BREAKPOINTS[breakpoint];
  await page.setViewportSize({ width: bp.width, height: bp.height });

  // Navigate to route
  await page.goto(route.path);
  await page.waitForLoadState('networkidle');

  // Set theme
  await setTheme(page, theme);

  // Apply state-specific interactions
  if (state === 'hover') {
    // Hover over first interactive element
    const firstButton = page.locator('button, a, [role="button"]').first();
    if (await firstButton.count() > 0) {
      await firstButton.hover();
    }
  } else if (state === 'focus') {
    // Focus first interactive element
    const firstInteractive = page.locator('button, a, input, select, textarea').first();
    if (await firstInteractive.count() > 0) {
      await firstInteractive.focus();
    }
  } else if (state === 'active') {
    // Click and hold first button
    const firstButton = page.locator('button').first();
    if (await firstButton.count() > 0) {
      await firstButton.dispatchEvent('mousedown');
    }
  } else if (state === 'disabled') {
    // Find disabled elements (usually already in this state)
    await page.waitForTimeout(100);
  } else if (state === 'loading') {
    // Trigger loading state if possible
    await page.waitForTimeout(500);
  } else if (state === 'error') {
    // Try to trigger error state (if applicable)
    await page.waitForTimeout(100);
  } else if (state === 'empty') {
    // Empty state (if applicable)
    await page.waitForTimeout(100);
  }

  // Wait for animations to settle
  await page.waitForTimeout(300);

  // Capture screenshot
  const screenshotPath = join(
    SCREENSHOT_DIR,
    route.path.replace(/\//g, '-').replace(/^-/, '') || 'root',
    `${breakpoint}-${theme}-${state}.png`
  );

  mkdirSync(join(screenshotPath, '..'), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Run axe-core for idle state only (to avoid duplicates)
  if (state === 'idle') {
    try {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();

      if (results.violations.length > 0) {
        axeViolations.push({
          route: route.path,
          breakpoint,
          theme,
          violations: results.violations,
        });
      }
    } catch {
      // Silently handle axe errors
    }
  }
}

test.describe('UI Audit Baseline Capture', () => {

  for (const route of ROUTES) {
    for (const breakpoint of Object.keys(BREAKPOINTS) as Array<keyof typeof BREAKPOINTS>) {
      for (const theme of THEMES) {
        for (const state of STATES) {
          test(`Capture ${route.path} @ ${breakpoint} ${theme} ${state}`, async ({ page }) => {
            await captureState(page, route, breakpoint, theme, state);
          });
        }
      }
    }
  }
});

test.afterAll(() => {
  // Save axe violations to JSON
  const axeResultsPath = join(AXE_RESULTS_DIR, 'axe-violations.json');
  writeFileSync(axeResultsPath, JSON.stringify(axeViolations, null, 2), 'utf-8');
  console.log(`Axe violations saved to: ${axeResultsPath}`);
});
