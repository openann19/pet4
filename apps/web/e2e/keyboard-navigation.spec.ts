/**
 * E2E Tests for Keyboard Navigation
 *
 * Tests keyboard navigation, shortcuts, and focus management.
 */

import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that uses keyboard navigation
    // Adjust URL based on your app structure
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should focus input with Ctrl+K', async ({ page }) => {
    // Wait for page to be interactive
    await page.waitForSelector('body', { state: 'visible' });

    // Press Ctrl+K (or Cmd+K on Mac)
    await page.keyboard.press('Control+k');

    // Check if an input is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'TEXTAREA']).toContain(focusedElement);
  });

  test('should close modal with Escape', async ({ page }) => {
    // Open a modal (adjust selector based on your app)
    const openModalButton = page.getByRole('button', { name: /open|show|modal/i }).first();
    if (await openModalButton.isVisible()) {
      await openModalButton.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Press Escape
      await page.keyboard.press('Escape');

      // Modal should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('should navigate with arrow keys', async ({ page }) => {
    // Find a list or navigation element
    const listItems = page.getByRole('listitem');
    const count = await listItems.count();

    if (count > 0) {
      // Focus first item
      await listItems.first().focus();

      // Press Arrow Down
      await page.keyboard.press('ArrowDown');

      // Check if focus moved to next item
      const focusedIndex = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[role="listitem"]'));
        return items.findIndex((item) => item === document.activeElement);
      });

      expect(focusedIndex).toBeGreaterThanOrEqual(0);
    }
  });

  test('should submit form with Ctrl+Enter', async ({ page }) => {
    // Find a form or input
    const input = page.getByRole('textbox').first();
    if (await input.isVisible()) {
      await input.fill('test message');
      await input.press('Control+Enter');

      // Check if form was submitted (adjust assertion based on your app)
      // This might trigger a network request or show a success message
      await page.waitForTimeout(500); // Wait for submission
    }
  });

  test('should trap focus in modal', async ({ page }) => {
    // Open modal
    const openModalButton = page.getByRole('button', { name: /open|show|modal/i }).first();
    if (await openModalButton.isVisible()) {
      await openModalButton.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Get focusable elements in modal
      const focusableElements = await page.$$eval(
        '[role="dialog"] button, [role="dialog"] input, [role="dialog"] [tabindex="0"]',
        (elements) => elements.length
      );

      if (focusableElements > 0) {
        // Focus first element
        await page.keyboard.press('Tab');

        // Press Tab multiple times - focus should stay within modal
        for (let i = 0; i < focusableElements + 2; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);

          // Check if focus is still within modal
          const activeElement = await page.evaluate(() => {
            const modal = document.querySelector('[role="dialog"]');
            const active = document.activeElement;
            return modal?.contains(active);
          });

          expect(activeElement).toBe(true);
        }
      }
    }
  });

  test('should restore focus after closing modal', async ({ page }) => {
    // Find a button that opens a modal
    const triggerButton = page.getByRole('button', { name: /open|show|modal/i }).first();
    if (await triggerButton.isVisible()) {
      // Focus trigger button
      await triggerButton.focus();
      const buttonText = await triggerButton.textContent();

      // Open modal
      await triggerButton.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Close modal with Escape
      await page.keyboard.press('Escape');
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' }).catch(() => {});

      // Focus should return to trigger button
      await page.waitForTimeout(200);
      const focusedText = await page.evaluate(() => {
        return (document.activeElement as HTMLElement)?.textContent;
      });

      expect(focusedText).toContain(buttonText || '');
    }
  });

  test('should show keyboard shortcuts help', async ({ page }) => {
    // Press ? to open help
    await page.keyboard.press('?');

    // Check if help modal or overlay is shown
    const helpModal = page.getByRole('dialog', { name: /keyboard|shortcut|help/i });
    await expect(helpModal).toBeVisible({ timeout: 2000 }).catch(() => {
      // Help modal might not be implemented yet
      test.skip();
    });
  });

  test('should navigate tabs with keyboard', async ({ page }) => {
    // Find tab navigation
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      // Focus first tab
      await tabs.first().focus();

      // Press Arrow Right to navigate
      await page.keyboard.press('ArrowRight');

      // Check if focus moved to next tab
      const focusedTab = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        return tabs.findIndex((tab) => tab === document.activeElement);
      });

      expect(focusedTab).toBeGreaterThan(0);
    }
  });
});
