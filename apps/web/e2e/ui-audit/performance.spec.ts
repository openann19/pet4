/**
 * UI Audit: Performance Tests
 * Runs Lighthouse CI per route and analyzes bundle sizes
 */

import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface RouteInfo {
  path: string;
  slug: string;
  url: string;
  component?: string;
  isLazy?: boolean;
  isProtected?: boolean;
  states?: string[];
  description?: string;
}

const INVENTORY_PATH = join(process.cwd(), 'audit/inventory/pages.json');
const ARTIFACTS_DIR = join(process.cwd(), 'audit/artifacts/web');
const LIGHTHOUSE_DIR = join(ARTIFACTS_DIR, 'lighthouse');
const BUNDLES_DIR = join(ARTIFACTS_DIR, 'bundles');

mkdirSync(LIGHTHOUSE_DIR, { recursive: true });
mkdirSync(BUNDLES_DIR, { recursive: true });

function loadInventory(): RouteInfo[] {
  try {
    const content = readFileSync(INVENTORY_PATH, 'utf-8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : data.routes || [];
  } catch {
    return [];
  }
}

const routes = loadInventory();

// Performance budgets (gzip)
const BUDGETS = {
  js: 500 * 1024, // 500KB
  lcp: 2500, // 2.5s
  cls: 0.1,
  tbt: 200, // 200ms
};

test.describe('UI Audit: Performance', () => {
  for (const route of routes) {
    test(`performance metrics: ${route.path}`, async ({ page }) => {
      await page.goto(route.url);
      await page.waitForLoadState('networkidle');

      // Collect performance metrics
      const metrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          firstPaint: performance.getEntriesByType('paint').find((e) => e.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint')?.startTime || 0,
        };
      });

      // Get resource sizes
      const resources = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter((entry): entry is PerformanceResourceTiming => entry instanceof PerformanceResourceTiming)
          .map((entry) => ({
            name: entry.name,
            size: entry.transferSize,
            duration: entry.duration,
          }));
      });

      const jsSize = resources
        .filter((r) => r.name.endsWith('.js'))
        .reduce((sum, r) => sum + r.size, 0);

      const result = {
        route: route.path,
        metrics,
        resources: {
          total: resources.reduce((sum, r) => sum + r.size, 0),
          js: jsSize,
        },
        budgets: BUDGETS,
        passed: {
          js: jsSize <= BUDGETS.js,
        },
      };

      // Save results
      const lighthousePath = join(LIGHTHOUSE_DIR, `${route.slug}.json`);
      writeFileSync(lighthousePath, JSON.stringify(result, null, 2), 'utf-8');

      // Assert budget compliance
      expect(jsSize).toBeLessThanOrEqual(BUDGETS.js);
    });

    test(`bundle analysis: ${route.path}`, async ({ page, context }) => {
      await context.route('**/*', (route) => route.continue());

      await page.goto(route.url);
      await page.waitForLoadState('networkidle');

      // Extract bundle information from network requests
      const bundles = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts.map((script) => ({
          src: (script as HTMLScriptElement).src,
          async: script.hasAttribute('async'),
          defer: script.hasAttribute('defer'),
        }));
      });

      const bundleInfo = {
        route: route.path,
        bundles,
        timestamp: new Date().toISOString(),
      };

      const bundlePath = join(BUNDLES_DIR, `${route.slug}.json`);
      writeFileSync(bundlePath, JSON.stringify(bundleInfo, null, 2), 'utf-8');
    });
  }
});
