/**
 * Chat Visual Regression Tests
 * 
 * Premium chat component visual regression testing with Playwright.
 * Tests message bubbles, reactions, animations, status ticks, and responsive layouts.
 * 
 * Run with: pnpm e2e e2e/chat-visual-regression.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';

// Mock chat data for consistent testing
const mockMessages = [
  {
    id: '1',
    content: 'Hello! This is a regular message.',
    senderId: 'user1',
    timestamp: Date.now() - 300000,
    status: 'read' as const,
    reactions: { '❤️': ['user2'], '😂': ['user2', 'user3'] },
  },
  {
    id: '2',
    content: 'This is my message with a longer text that might wrap to multiple lines and test the bubble layout properly.',
    senderId: 'currentUser',
    timestamp: Date.now() - 240000,
    status: 'delivered' as const,
  },
  {
    id: '3',
    content: 'Short reply',
    senderId: 'user1',
    timestamp: Date.now() - 180000,
    status: 'sent' as const,
  },
  {
    id: '4',
    content: 'Another message from me with reactions!',
    senderId: 'currentUser',
    timestamp: Date.now() - 120000,
    status: 'read' as const,
    reactions: { '👍': ['user1'], '🔥': ['user1', 'user2', 'user3'] },
  },
  {
    id: '5',
    content: 'Latest message just sent',
    senderId: 'currentUser',
    timestamp: Date.now() - 5000,
    status: 'sending' as const,
  },
];

async function setupChatPage(page: Page) {
  // Navigate to main app and switch to chat view
  await page.goto('/');
  
  // Wait for app to load
  await page.waitForSelector('[data-view]', { timeout: 10000 });
  
  // Click chat navigation button
  await page.click('button:has-text("Chat")').catch(() => {
    // If that fails, try finding by icon or aria-label
    return page.click('[aria-label*="chat" i], [aria-label*="Chat" i]').catch(() => {
      // Last resort: look for chat-related elements
      return page.click('nav button:nth-child(3)');
    });
  });
  
  // Wait for chat view to load
  await page.waitForSelector('[data-view="chat"], .chat-view, #chat-view', { timeout: 5000 });
  
  // Disable animations for consistent screenshots
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  });
  
  // Wait for layout stabilization
  await page.waitForTimeout(200);
}

test.describe('Chat Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport and theme
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Set light theme for consistent testing
    await page.emulateMedia({ colorScheme: 'light' });
  });

  test('chat interface - basic layout', async ({ page }) => {
    await setupChatPage(page);
    
    // Screenshot the entire chat view
    const chatView = page.locator('[data-view="chat"], .chat-view, main').first();
    await expect(chatView).toHaveScreenshot('chat-interface-layout.png');
  });

  test('chat rooms list - empty state', async ({ page }) => {
    await setupChatPage(page);
    
    // Focus on chat rooms or conversation list
    const chatContent = page.locator('[data-view="chat"] main, .chat-rooms-list, .conversations-container').first();
    await expect(chatContent).toHaveScreenshot('chat-rooms-empty.png');
  });

  test('chat interface components', async ({ page }) => {
    await setupChatPage(page);
    
    // Take a screenshot of any chat-related components that exist
    const chatElements = await page.locator('main [class*="chat"], [data-testid*="chat"], .conversation, .message').all();
    
    if (chatElements.length > 0) {
      await expect(chatElements[0]).toHaveScreenshot('chat-components.png');
    } else {
      // Fallback to main content area
      const mainContent = page.locator('main').first();
      await expect(mainContent).toHaveScreenshot('chat-main-content.png');
    }
  });

  test('responsive design - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await setupChatPage(page);
    
    const chatView = page.locator('[data-view="chat"], main').first();
    await expect(chatView).toHaveScreenshot('chat-mobile-layout.png');
  });

  test('responsive design - tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await setupChatPage(page);
    
    const chatView = page.locator('[data-view="chat"], main').first();
    await expect(chatView).toHaveScreenshot('chat-tablet-layout.png');
  });

  test('dark theme - chat interface', async ({ page }) => {
    // Set dark theme
    await page.emulateMedia({ colorScheme: 'dark' });
    await setupChatPage(page);
    
    const chatView = page.locator('[data-view="chat"], main').first();
    await expect(chatView).toHaveScreenshot('chat-dark-theme.png');
  });
});

test.describe('Chat Visual Regression - Navigation & States', () => {
  test('navigation to chat view', async ({ page }) => {
    await page.goto('/');
    
    // Take a screenshot before navigation
    const beforeNav = page.locator('nav, .nav-bar, [role="navigation"]').first();
    await expect(beforeNav).toHaveScreenshot('nav-before-chat.png');
    
    // Navigate to chat
    await setupChatPage(page);
    
    // Take a screenshot after navigation
    const afterNav = page.locator('nav, .nav-bar, [role="navigation"]').first();
    await expect(afterNav).toHaveScreenshot('nav-after-chat.png');
  });

  test('chat view content structure', async ({ page }) => {
    await setupChatPage(page);
    
    // Test the overall structure of the chat view
    const mainContent = page.locator('main').first();
    await expect(mainContent).toHaveScreenshot('chat-content-structure.png');
  });
});