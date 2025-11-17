/**
 * UI Audit: Accessibility and Visual Regression Tests
 * Reads from audit/inventory/pages.json and runs axe + visual snapshots per route
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
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
const AXE_DIR = join(ARTIFACTS_DIR, 'axe');
const SNAPSHOTS_DIR = join(ARTIFACTS_DIR, 'snapshots');

// Ensure directories exist
mkdirSync(AXE_DIR, { recursive: true });
mkdirSync(SNAPSHOTS_DIR, { recursive: true });

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

if (routes.length === 0) {
  test.skip('No routes found in inventory. Run: pnpm audit:inventory', () => {});
}

test.describe('UI Audit: Accessibility and Visual', () => {
  for (const route of routes) {
    test.describe(`Route: ${route.path}`, () => {
      test('axe accessibility audit', async ({ page }) => {
        await page.goto(route.url);
        await page.waitForLoadState('networkidle');

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();

        // Save results to file
        const axePath = join(AXE_DIR, `${route.slug}.json`);
        writeFileSync(axePath, JSON.stringify(results, null, 2), 'utf-8');

        // Assert no critical or serious violations
        const criticalOrSerious = results.violations.filter(
          v => v.impact === 'critical' || v.impact === 'serious'
        );
        expect(criticalOrSerious).toEqual([]);
      });

      test('visual snapshot - desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto(route.url);
        await page.waitForLoadState('networkidle');

        const snapshotDir = join(SNAPSHOTS_DIR, route.slug);
        mkdirSync(snapshotDir, { recursive: true });

        await expect(page).toHaveScreenshot({
          path: join(snapshotDir, 'desktop.png'),
          fullPage: true,
        });
      });

      test('visual snapshot - mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(route.url);
        await page.waitForLoadState('networkidle');

        const snapshotDir = join(SNAPSHOTS_DIR, route.slug);
        mkdirSync(snapshotDir, { recursive: true });

        await expect(page).toHaveScreenshot({
          path: join(snapshotDir, 'mobile.png'),
          fullPage: true,
        });
      });
    });
  }
});

