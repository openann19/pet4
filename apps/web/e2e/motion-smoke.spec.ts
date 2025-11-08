/**
 * Playwright smoke test for AdvancedChatWindow performance
 *
 * Measures dropped frames during 5 seconds of chat activity with 30 concurrent message entries.
 * Asserts RAF dropped frames < 3%.
 */

import { test, expect } from '@playwright/test';

test.describe('AdvancedChatWindow Performance', () => {
  test('should maintain 60fps with <3% dropped frames during message storm', async ({ page }) => {
    // Navigate to chat window (adjust route as needed)
    await page.goto('/chat/test-room');

    // Wait for chat window to load (adjust selector as needed)
    await page.waitForSelector('textarea, input[type="text"]', { timeout: 5000 });

    // Start performance monitoring
    const frameTimes: number[] = [];
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let droppedFrames = 0;

    // Monitor frame times for 5 seconds
    const monitorDuration = 5000; // 5 seconds
    const startTime = Date.now();

    // Set up RAF monitoring
    await page.evaluate(() => {
      (window as any).__frameTimes = [];
      (window as any).__lastFrameTime = performance.now();
      (window as any).__frameCount = 0;
      (window as any).__droppedFrames = 0;

      function measureFrame() {
        const now = performance.now();
        const delta = now - (window as any).__lastFrameTime;
        (window as any).__lastFrameTime = now;
        (window as any).__frameTimes.push(delta);
        (window as any).__frameCount++;

        // Check for dropped frames (frame time > 20ms at 60fps, or > 16.67ms ideally)
        if (delta > 20) {
          (window as any).__droppedFrames++;
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
        await input.fill(`Test message ${i}`);
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
      const frameTimes = (window as any).__frameTimes || [];
      const frameCount = (window as any).__frameCount || 0;
      const droppedFrames = (window as any).__droppedFrames || 0;

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

    console.log('Performance Metrics:', {
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
