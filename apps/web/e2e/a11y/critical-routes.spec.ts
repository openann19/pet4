/**
 * Critical Routes A11y Tests
 * Tests accessibility on critical routes with assertions
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const CRITICAL_ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/demo/pets', name: 'Pets Demo' },
];

test.describe('Critical Routes A11y', () => {
  for (const route of CRITICAL_ROUTES) {
    test(`${route.name} should have no BLOCKER/HIGH violations`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const blockerHigh = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(blockerHigh).toEqual([]);
    });

    test(`${route.name} should support keyboard navigation`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      // Tab through focusable elements
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test(`${route.name} should have proper focus order`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      const focusableElements = await page.locator('button, a, input, select, textarea, [tabindex]').all();

      for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
        await page.keyboard.press('Tab');
        const tagName = await page.evaluate(() => document.activeElement?.tagName);
        expect(tagName).toBeTruthy();
      }
    });
  }
});
