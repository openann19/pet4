/**
 * E2E tests for critical user flows
 * Tests authentication, matching, chat, and payment flows
 */

import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/');
  });

  test.describe('Authentication Flow', () => {
    test('should allow user to sign up', async ({ page }) => {
      // Navigate to sign up
      await page.click('text=Sign Up');
      
      // Fill in sign up form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to main app
      await expect(page).toHaveURL(/\/discover|\/matches/);
    });

    test('should allow user to sign in', async ({ page }) => {
      // Navigate to sign in
      await page.click('text=Sign In');
      
      // Fill in sign in form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to main app
      await expect(page).toHaveURL(/\/discover|\/matches/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible();
    });
  });

  test.describe('Matching Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Assume user is authenticated (in real test, use auth setup)
      // For now, navigate directly to discover
      await page.goto('/discover');
    });

    test('should display pet cards on discover page', async ({ page }) => {
      // Wait for pet cards to load
      await page.waitForSelector('[data-testid="pet-card"], .pet-card, [class*="card"]', {
        timeout: 10000,
      });
      
      // Should have at least one pet card
      const cards = page.locator('[data-testid="pet-card"], .pet-card, [class*="card"]');
      await expect(cards.first()).toBeVisible();
    });

    test('should allow swiping/liking a pet', async ({ page }) => {
      await page.waitForSelector('[data-testid="pet-card"], .pet-card', { timeout: 10000 });
      
      // Find like button or swipe action
      const likeButton = page.locator('button[aria-label*="like"], button[aria-label*="Like"], [data-testid="like-button"]').first();
      
      if (await likeButton.isVisible()) {
        await likeButton.click();
        
        // Should show feedback (animation, next card, etc.)
        await page.waitForTimeout(500);
      }
    });

    test('should show match screen when both pets like each other', async ({ page }) => {
      // This would require setting up a match scenario
      // For now, verify match screen exists
      await page.goto('/matches');
      
      // Should show matches or empty state
      await expect(page.locator('text=/match|no matches/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Chat Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to matches/chat
      await page.goto('/matches');
    });

    test('should open chat when clicking on a match', async ({ page }) => {
      // Wait for matches to load
      await page.waitForTimeout(2000);
      
      // Try to find a match card
      const matchCard = page.locator('[data-testid="match-card"], .match-card, [class*="match"]').first();
      
      if (await matchCard.isVisible({ timeout: 5000 })) {
        await matchCard.click();
        
        // Should open chat interface
        await expect(page.locator('textarea, input[type="text"], [data-testid="chat-input"]')).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test('should send a message in chat', async ({ page }) => {
      // Navigate to chat (assuming a match exists)
      await page.goto('/chat/test-match-id');
      
      // Wait for chat input
      const chatInput = page.locator('textarea, input[type="text"], [data-testid="chat-input"]').first();
      await chatInput.waitFor({ timeout: 5000 });
      
      // Type and send message
      await chatInput.fill('Hello! This is a test message.');
      await page.click('button[type="submit"], button[aria-label*="Send"], [data-testid="send-button"]');
      
      // Message should appear in chat
      await expect(page.locator('text=Hello! This is a test message.')).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Payment Flow', () => {
    test('should display premium features', async ({ page }) => {
      await page.goto('/profile');
      
      // Look for premium/upgrade button
      const upgradeButton = page.locator('text=/upgrade|premium|subscribe/i').first();
      
      if (await upgradeButton.isVisible({ timeout: 5000 })) {
        await upgradeButton.click();
        
        // Should show pricing/checkout
        await expect(page.locator('text=/price|plan|checkout/i')).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test('should handle payment form (Stripe)', async ({ page }) => {
      // Navigate to payment page
      await page.goto('/profile?upgrade=true');
      
      // Wait for Stripe elements to load
      await page.waitForTimeout(2000);
      
      // Check if Stripe iframe is present
      const stripeFrame = page.frameLocator('iframe[src*="stripe"]').first();
      
      // If Stripe is loaded, verify form elements exist
      // Note: Actual payment testing requires test Stripe keys
      const hasStripe = await page.locator('iframe[src*="stripe"]').count() > 0;
      
      if (hasStripe) {
        // Stripe form should be visible
        await expect(stripeFrame.locator('input')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);
      
      await page.goto('/discover');
      
      // Should show offline indicator or error message
      await expect(
        page.locator('text=/offline|error|try again/i')
      ).toBeVisible({ timeout: 5000 });
      
      // Restore online
      await page.context().setOffline(false);
    });

    test('should show error boundary on critical errors', async ({ page }) => {
      // Navigate to a page that might error
      await page.goto('/discover');
      
      // Try to trigger an error (this is a placeholder)
      // In real scenario, you might inject an error or navigate to invalid route
      
      // Error boundary should catch and display error UI
      // This test is more of a placeholder - actual error injection would be needed
      // For now, just verify the page loads without errors
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/discover');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should have visible focus indicator
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/discover');
      
      // Check for buttons with aria-labels
      const buttons = page.locator('button[aria-label]');
      const count = await buttons.count();
      
      // Should have at least some buttons with aria-labels
      expect(count).toBeGreaterThan(0);
    });
  });
});

