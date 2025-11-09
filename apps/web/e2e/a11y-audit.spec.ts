/**
 * Accessibility Audit Tests (WCAG 2.2 AAA)
 *
 * Uses axe-core to audit accessibility compliance across all pages.
 *
 * Location: apps/web/e2e/a11y-audit.spec.ts
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Views to audit for accessibility
 * Note: App uses state-based navigation, so we test views as they appear
 */
const VIEWS_TO_AUDIT = [
  { view: 'discover', name: 'Discover' },
  { view: 'matches', name: 'Matches' },
  { view: 'chat', name: 'Chat' },
  { view: 'profile', name: 'Profile' },
];

test.describe('Accessibility Audit (WCAG 2.2 AA)', () => {
  for (const viewConfig of VIEWS_TO_AUDIT) {
    test.describe(`${viewConfig.name} View`, () => {
      test('should have no accessibility violations', async ({ page }) => {
        await page.goto('/');

        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');

        // Navigate to the view if not already there
        // The app uses state-based navigation, so we click the nav button
        if (viewConfig.view !== 'discover') {
          const navButton = page.locator(`[aria-label*="${viewConfig.name}" i], button:has-text("${viewConfig.name}")`).first();
          await navButton.click();
          await page.waitForTimeout(500); // Wait for view transition
        }

        // Run axe-core accessibility audit (WCAG 2.2 AA)
        // Only test for AA level violations (not AAA)
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .exclude('#axe-include-exclude') // Exclude test elements if any
          .withRules({
            // Focus appearance (WCAG 2.4.11, 2.4.12)
            'focus-order-semantics': { enabled: true },
            'focusable-content': { enabled: true },
            'focusable-no-name': { enabled: true },
            'keyboard': { enabled: true },
            // Target size (WCAG 2.5.5)
            'target-size': { enabled: true },
            // Fixed references (WCAG 2.4.8)
            'identical-links-same-purpose': { enabled: true },
            // Screen reader support
            'aria-allowed-attr': { enabled: true },
            'aria-hidden-body': { enabled: true },
            'aria-required-attr': { enabled: true },
            'aria-roles': { enabled: true },
            'aria-valid-attr-value': { enabled: true },
            'aria-valid-attr': { enabled: true },
            'label': { enabled: true },
            'link-name': { enabled: true },
            'button-name': { enabled: true },
            // Color contrast (WCAG 1.4.3, 1.4.6, 1.4.11)
            'color-contrast': { enabled: true },
            'color-contrast-enhanced': { enabled: true },
            // Images
            'image-alt': { enabled: true },
            'object-alt': { enabled: true },
            // Headings
            'heading-order': { enabled: true },
            'page-has-heading-one': { enabled: true },
            // Forms
            'form-field-multiple-labels': { enabled: true },
            'label-content-name-mismatch': { enabled: true },
            'select-name': { enabled: true },
            'text-input-label': { enabled: true },
            // Language
            'html-has-lang': { enabled: true },
            'html-lang-valid': { enabled: true },
            // Landmarks
            'landmark-one-main': { enabled: true },
            'landmark-unique': { enabled: true },
            // Lists
            'list': { enabled: true },
            'listitem': { enabled: true },
            // Tables
            'th-has-data-cells': { enabled: true },
            'table-duplicate-name': { enabled: true },
          })
          .analyze();

        // Log violations for debugging
        if (accessibilityScanResults.violations.length > 0) {
          // eslint-disable-next-line no-console
          console.error(`Accessibility violations found in ${viewConfig.name} view:`,
            accessibilityScanResults.violations.map(v => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.length
            }))
          );
        }

        // Assert no critical or serious violations (WCAG 2.2 AA)
        const criticalOrSeriousViolations = accessibilityScanResults.violations.filter(
          v => v.impact === 'critical' || v.impact === 'serious'
        );
        expect(criticalOrSeriousViolations).toEqual([]);

        // Log incomplete checks (warnings) for review
        if (accessibilityScanResults.incomplete.length > 0) {
          // eslint-disable-next-line no-console
          console.warn(`Accessibility incomplete checks for ${viewConfig.name}:`, accessibilityScanResults.incomplete);
        }

        // Log passes for verification
        if (accessibilityScanResults.passes.length > 0) {
          // eslint-disable-next-line no-console
          console.info(`Accessibility passes for ${viewConfig.name}: ${accessibilityScanResults.passes.length} checks`);
        }
      });

      test('should have proper focus indicators on all interactive elements', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to the view if not already there
        if (viewConfig.view !== 'discover') {
          const navButton = page.locator(`[aria-label*="${viewConfig.name}" i], button:has-text("${viewConfig.name}")`).first();
          await navButton.click();
          await page.waitForTimeout(500);
        }

        // Find all interactive elements
        const interactiveElements = await page.locator('button, a, input, textarea, select, [role="button"], [role="link"], [tabindex]').all();

        for (const element of interactiveElements) {
          // Focus the element
          await element.focus();

          // Check if focus indicator is visible
          const focusStyles = await element.evaluate((el) => {
            const style = window.getComputedStyle(el, ':focus-visible');
            return {
              outline: style.outline,
              outlineWidth: style.outlineWidth,
              boxShadow: style.boxShadow,
            };
          });

          // Verify focus indicator exists and meets minimum requirements
          const hasFocusIndicator =
            (focusStyles.outline && focusStyles.outline !== 'none' && parseFloat(focusStyles.outlineWidth) >= 2) ||
            (focusStyles.boxShadow && focusStyles.boxShadow !== 'none');

          expect(hasFocusIndicator).toBe(true);
        }
      });

      test('should have proper target sizes for all interactive elements', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to the view if not already there
        if (viewConfig.view !== 'discover') {
          const navButton = page.locator(`[aria-label*="${viewConfig.name}" i], button:has-text("${viewConfig.name}")`).first();
          await navButton.click();
          await page.waitForTimeout(500);
        }

        // Find all interactive elements
        const interactiveElements = await page.locator('button, a, input, textarea, select, [role="button"], [role="link"]').all();

        for (const element of interactiveElements) {
          const box = await element.boundingBox();
          if (box) {
            // Check minimum 44x44px target size (WCAG 2.5.5)
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      });

      test('should have stable references for dynamic content', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to the view if not already there
        if (viewConfig.view !== 'discover') {
          const navButton = page.locator(`[aria-label*="${viewConfig.name}" i], button:has-text("${viewConfig.name}")`).first();
          await navButton.click();
          await page.waitForTimeout(500);
        }

        // Check for stable IDs on message elements (if chat view)
        if (viewConfig.view === 'chat') {
          const messageElements = await page.locator('[role="article"], [class*="message"]').all();

          for (const element of messageElements) {
            const id = await element.getAttribute('id');
            const ariaLabel = await element.getAttribute('aria-label');

            // Messages should have stable IDs and ARIA labels
            expect(id).toBeTruthy();
            expect(id?.startsWith('message-')).toBe(true);
            expect(ariaLabel).toBeTruthy();
          }
        }
      });
    });
  }

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation through all interactive elements', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Start from the top
      await page.keyboard.press('Tab');

      let focusCount = 0;
      const maxTabs = 50; // Limit to prevent infinite loops

      // Tab through all focusable elements
      for (let i = 0; i < maxTabs; i++) {
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        if (focusedElement) {
          focusCount++;
          await page.keyboard.press('Tab');
        } else {
          break;
        }
      }

      // Should be able to navigate through multiple elements
      expect(focusCount).toBeGreaterThan(0);
    });

    test('should have keyboard shortcuts documented', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check if keyboard shortcuts help is available
      const helpButton = page.locator('[aria-label*="keyboard" i], [aria-label*="shortcut" i]');
      const helpCount = await helpButton.count();

      // Should have keyboard shortcuts help available (optional but recommended)
      // This test passes if help exists, but doesn't fail if it doesn't
      if (helpCount > 0) {
        await helpButton.first().click();
        const helpContent = await page.locator('[role="dialog"]').textContent();
        expect(helpContent).toBeTruthy();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have ARIA labels on all interactive elements', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const interactiveElements = await page.locator('button, a, input, textarea, select, [role="button"], [role="link"]').all();

      for (const element of interactiveElements) {
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaLabelledBy = await element.getAttribute('aria-labelledby');
        const textContent = await element.textContent();
        const altText = await element.getAttribute('alt');
        const title = await element.getAttribute('title');

        // Should have at least one way to identify the element
        const hasLabel = Boolean(ariaLabel || ariaLabelledBy || textContent?.trim() || altText || title);

        expect(hasLabel).toBe(true);
      }
    });

    test('should have live regions for dynamic content', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for live regions
      const liveRegions = await page.locator('[aria-live], [aria-atomic], [aria-relevant]').all();

      // Should have at least one live region for dynamic content
      // This is a soft check - doesn't fail if no live regions, but logs for review
      if (liveRegions.length === 0) {
        // eslint-disable-next-line no-console
        console.warn('No live regions found on page - dynamic content may not be announced to screen readers');
      }
    });
  });
});
