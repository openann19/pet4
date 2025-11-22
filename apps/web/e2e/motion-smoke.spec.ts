/**
 * Playwright smoke test for AdvancedChatWindow performance
 *
 * Measures dropped frames during 5 seconds of chat activity with 30 concurrent message entries.
 * Asserts RAF dropped frames < 3%.
 */

import { test, expect } from '@playwright/test';
import logger from '@/core/logger';

test.describe('AdvancedChatWindow Performance', () => {
  test('should maintain 60fps with <3% dropped frames during message storm', async ({ page }) => {
    // Navigate to chat window (adjust route as needed)
    await page.goto('/chat/test-room');

    // Wait for chat window to load (adjust selector as needed)
    await page.waitForSelector('textarea, input[type="text"]', { timeout: 5000 });

    // Performance monitoring is done via page.evaluate()

    // Set up RAF monitoring
    await page.evaluate(() => {
      type WindowWithMetrics = typeof window & {
        __frameTimes?: number[];
        __lastFrameTime?: number;
        __frameCount?: number;
        __droppedFrames?: number;
      };
      (window as WindowWithMetrics).__frameTimes = [];
      (window as WindowWithMetrics).__lastFrameTime = performance.now();
      (window as WindowWithMetrics).__frameCount = 0;
      (window as WindowWithMetrics).__droppedFrames = 0;

      function measureFrame() {
        const now = performance.now();
        type WindowWithMetrics = typeof window & {
          __frameTimes?: number[];
          __lastFrameTime?: number;
          __frameCount?: number;
          __droppedFrames?: number;
        };
        const win = window as WindowWithMetrics;
        const delta = now - (win.__lastFrameTime ?? 0);
        win.__lastFrameTime = now;
        if (win.__frameTimes) {
          win.__frameTimes.push(delta);
        }
        win.__frameCount = (win.__frameCount ?? 0) + 1;

        // Check for dropped frames (frame time > 20ms at 60fps, or > 16.67ms ideally)
        if (delta > 20) {
          const win = window as WindowWithMetrics;
          win.__droppedFrames = (win.__droppedFrames ?? 0) + 1;
        }

        requestAnimationFrame(measureFrame);
      }

      requestAnimationFrame(measureFrame);
    });

    // Simulate 30 concurrent message entries
    const inputSelector = 'textarea, input[type="text"]';
    const sendButtonSelector =
      'button[type="submit"], button:has-text("Send"), [aria-label*="Send"]';

    for (let i = 0; i < 30; i++) {
      const input = page.locator(inputSelector).first();
      const sendButton = page.locator(sendButtonSelector).first();

      if (await input.isVisible()) {
        await input.fill(`Test message ${String(i ?? '')}`);
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
        // Small delay between messages
        await page.waitForTimeout(50);
      }
    }

    // Wait for animations to complete (5 seconds total)
    await page.waitForTimeout(monitorDuration);

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      type WindowWithMetrics = typeof window & {
        __frameTimes?: number[];
        __frameCount?: number;
        __droppedFrames?: number;
      };
      const win = window as WindowWithMetrics;
      const frameTimes = win.__frameTimes || [];
      const frameCount = win.__frameCount || 0;
      const droppedFrames = win.__droppedFrames || 0;

      return {
        frameCount,
        droppedFrames,
        averageFrameTime:
          frameTimes.length > 0
            ? frameTimes.reduce((a: number, b: number) => a + b, 0) / frameTimes.length
            : 0,
        maxFrameTime: frameTimes.length > 0 ? Math.max(...frameTimes) : 0,
      };
    });

    // Calculate dropped frame percentage
    const droppedFramePercentage =
      metrics.frameCount > 0 ? (metrics.droppedFrames / metrics.frameCount) * 100 : 0;

    // Assertions
    expect(metrics.frameCount).toBeGreaterThan(0);
    expect(droppedFramePercentage).toBeLessThan(3); // <3% dropped frames
    expect(metrics.averageFrameTime).toBeLessThan(20); // Average < 20ms (60fps)
    expect(metrics.maxFrameTime).toBeLessThan(100); // No single frame > 100ms

    logger.info('Performance Metrics:', {
      frameCount: metrics.frameCount,
      droppedFrames: metrics.droppedFrames,
      droppedFramePercentage: droppedFramePercentage.toFixed(2) + '%',
      averageFrameTime: metrics.averageFrameTime.toFixed(2) + 'ms',
      maxFrameTime: metrics.maxFrameTime.toFixed(2) + 'ms',
    });
  });

  test('should respect reduced motion preferences', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/chat/test-room');
    await page.waitForSelector('textarea, input[type="text"]', { timeout: 5000 });

    // Check that animations are instant (≤120ms)
    const animationDuration = await page.evaluate(() => {
      const animatedElements = document.querySelectorAll(
        '[style*="transition"], [style*="animation"]'
      );
      let maxDuration = 0;

      animatedElements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const transitionDuration = parseFloat(style.transitionDuration || '0') * 1000;
        const animationDuration = parseFloat(style.animationDuration || '0') * 1000;
        maxDuration = Math.max(maxDuration, transitionDuration, animationDuration);
      });

      return maxDuration;
    });

    // All animations should be ≤120ms when reduced motion is enabled
    expect(animationDuration).toBeLessThanOrEqual(120);
  });
});
