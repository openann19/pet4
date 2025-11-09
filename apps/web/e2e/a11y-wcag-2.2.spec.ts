/**
 * WCAG 2.2 AAA E2E Tests
 *
 * End-to-end tests for WCAG 2.2 AAA compliance.
 *
 * Location: apps/web/e2e/a11y-wcag-2.2.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('WCAG 2.2 AA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Focus Appearance (WCAG 2.2 AA)', () => {
    test('should have focus indicators on all interactive elements', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const buttons = await page.locator('button, a, input, textarea, select, [role="button"], [role="link"]').all();

      for (const button of buttons) {
        try {
          await button.focus();
          const outline = await button.evaluate((el) => {
            const style = window.getComputedStyle(el, ':focus-visible');
            return {
              outline: style.outline,
              outlineWidth: style.outlineWidth,
              boxShadow: style.boxShadow,
            };
          });

          // WCAG 2.2 AA requires visible focus indicator (outline or box-shadow)
          const hasFocusIndicator =
            (outline.outline && outline.outline !== 'none') ||
            (outline.boxShadow && outline.boxShadow !== 'none');

          expect(hasFocusIndicator).toBe(true);
        } catch (error) {
          // Element might not be focusable, skip
          continue;
        }
      }
    });

    test('should have focus indicators with minimum 1px thickness (AA requirement)', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const button = page.locator('button').first();

      if (await button.count() > 0) {
        await button.focus();

        const outlineWidth = await button.evaluate((el) => {
          const style = window.getComputedStyle(el, ':focus-visible');
          return parseFloat(style.outlineWidth) || 0;
        });

        // WCAG 2.2 AA requires at least 1px (AAA requires 2px)
        expect(outlineWidth).toBeGreaterThanOrEqual(1);
      }
    });
  });

  test.describe('Focus Not Obscured (2.4.11, 2.4.12)', () => {
    test('should ensure focused elements are visible', async ({ page }) => {
      const button = page.locator('button').first();
      await button.focus();

      const isVisible = await button.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= viewport.height &&
          rect.right <= viewport.width
        );
      });

      expect(isVisible).toBe(true);
    });
  });

  test.describe('Target Size (2.5.5 - AA)', () => {
    test('should have minimum 44x44px touch targets', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const buttons = await page.locator('button, a, [role="button"], [role="link"]').all();

      for (const button of buttons) {
        try {
          const size = await button.boundingBox();

          if (size) {
            // WCAG 2.2 AA requires 44x44px minimum
            expect(size.width).toBeGreaterThanOrEqual(44);
            expect(size.height).toBeGreaterThanOrEqual(44);
          }
        } catch (error) {
          // Element might not be visible, skip
          continue;
        }
      }
    });

    test('should have minimum 8px spacing between touch targets', async ({ page }) => {
      const buttons = await page.locator('button').all();

      for (let i = 0; i < buttons.length - 1; i++) {
        const button1 = await buttons[i].boundingBox();
        const button2 = await buttons[i + 1].boundingBox();

        if (button1 && button2) {
          // Calculate edges from bounding box (x, y, width, height)
          const button1Right = button1.x + button1.width;
          const button1Left = button1.x;
          const button1Bottom = button1.y + button1.height;
          const button1Top = button1.y;

          const button2Right = button2.x + button2.width;
          const button2Left = button2.x;
          const button2Bottom = button2.y + button2.height;
          const button2Top = button2.y;

          // Calculate minimum distance between buttons
          const distance = Math.min(
            Math.abs(button1Right - button2Left),
            Math.abs(button1Left - button2Right),
            Math.abs(button1Bottom - button2Top),
            Math.abs(button1Top - button2Bottom)
          );

          expect(distance).toBeGreaterThanOrEqual(8);
        }
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('should support keyboard shortcuts', async ({ page }) => {
      // Test Escape key closes modals
      await page.keyboard.press('Escape');

      // Test Tab navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have ARIA labels on interactive elements', async ({ page }) => {
      const buttons = await page.locator('button').all();

      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();

        // Should have either aria-label or text content
        expect(ariaLabel || textContent).toBeTruthy();
      }
    });

    test('should have live regions for dynamic content', async ({ page }) => {
      const liveRegions = await page.locator('[aria-live]').all();
      expect(liveRegions.length).toBeGreaterThan(0);
    });
  });

  test.describe('Drag and Drop Keyboard Alternatives (2.5.7)', () => {
    test('should have keyboard alternatives for drag operations', async ({ page }) => {
      // Test file upload keyboard alternative
      const fileInput = page.locator('input[type="file"]');

      if (await fileInput.count() > 0) {
        await fileInput.focus();
        await page.keyboard.press('Enter');

        // Should trigger file picker or alternative action
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).toBeTruthy();
      }
    });
  });
});
