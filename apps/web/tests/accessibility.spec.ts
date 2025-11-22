/**
 * Accessibility tests using axe-core
 * Tests WCAG 2.1 AA compliance
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should have no accessibility violations on homepage', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no accessibility violations on discover page', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no accessibility violations on profile page', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    const headingViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'heading-order'
    );

    expect(headingViolations).toEqual([]);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    const labelViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'label' || violation.id === 'label-title-only'
    );

    expect(labelViolations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    const keyboardViolations = accessibilityScanResults.violations.filter(
      (violation) =>
        violation.id === 'keyboard' ||
        violation.id === 'focus-order-semantics' ||
        violation.id === 'focusable-content'
    );

    expect(keyboardViolations).toEqual([]);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    const ariaViolations = accessibilityScanResults.violations.filter(
      (violation) =>
        violation.id === 'aria-required-attr' ||
        violation.id === 'aria-valid-attr-value' ||
        violation.id === 'aria-hidden-focus'
    );

    expect(ariaViolations).toEqual([]);
  });
});

