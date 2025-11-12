/**
 * Performance Tests for Animations
 *
 * Tests animation performance, frame rates, and dropped frames.
 */

import { test, expect } from '@playwright/test';

interface PerformanceMonitoringData {
  frameTimes: number[];
  frameCount: number;
  droppedFrames: number;
}

interface WindowWithPerformance extends Window {
  __frameTimes?: number[];
  __lastFrameTime?: number;
  __frameCount?: number;
  __droppedFrames?: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

test.describe('Animation Performance', () => {
  test('should maintain 60fps for Presence Aurora Ring', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const win = window as WindowWithPerformance;
      win.__frameTimes = [];
      win.__lastFrameTime = performance.now();
      win.__frameCount = 0;
      win.__droppedFrames = 0;

      function measureFrame(): void {
        const now = performance.now();
        const lastTime = win.__lastFrameTime ?? now;
        const delta = now - lastTime;
        win.__lastFrameTime = now;
        win.__frameTimes?.push(delta);
        win.__frameCount = (win.__frameCount ?? 0) + 1;

        // Check for dropped frames (frame time > 20ms at 60fps)
        if (delta > 20) {
          win.__droppedFrames = (win.__droppedFrames ?? 0) + 1;
        }

        requestAnimationFrame(measureFrame);
      }

      requestAnimationFrame(measureFrame);
    });

    // Wait for animations to run
    await page.waitForTimeout(5000); // 5 seconds

    // Get performance data
    const performanceData = await page.evaluate((): PerformanceMonitoringData => {
      const win = window as WindowWithPerformance;
      return {
        frameTimes: win.__frameTimes ?? [],
        frameCount: win.__frameCount ?? 0,
        droppedFrames: win.__droppedFrames ?? 0,
      };
    });

    const { frameTimes: collectedFrameTimes, frameCount, droppedFrames: dropped } = performanceData;

    // Calculate average frame time
    const averageFrameTime =
      collectedFrameTimes.reduce((a: number, b: number) => a + b, 0) / collectedFrameTimes.length;

    // Calculate dropped frame percentage
    const droppedFramePercentage = (dropped / frameCount) * 100;

    // Assertions
    expect(averageFrameTime).toBeLessThan(20); // Should be < 20ms for 60fps
    expect(droppedFramePercentage).toBeLessThan(5); // < 5% dropped frames
    expect(frameCount).toBeGreaterThan(200); // Should have many frames in 5 seconds
  });

  test('should maintain performance with multiple animations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set up performance monitoring
    await page.evaluate(() => {
      const win = window as WindowWithPerformance;
      win.__frameTimes = [];
      win.__lastFrameTime = performance.now();
      win.__frameCount = 0;
      win.__droppedFrames = 0;

      function measureFrame(): void {
        const now = performance.now();
        const lastTime = win.__lastFrameTime ?? now;
        const delta = now - lastTime;
        win.__lastFrameTime = now;
        win.__frameTimes?.push(delta);
        win.__frameCount = (win.__frameCount ?? 0) + 1;

        if (delta > 20) {
          win.__droppedFrames = (win.__droppedFrames ?? 0) + 1;
        }

        requestAnimationFrame(measureFrame);
      }

      requestAnimationFrame(measureFrame);
    });

    // Trigger multiple animations (adjust based on your app)
    // This might involve scrolling, hovering, clicking, etc.
    await page.mouse.move(100, 100);
    await page.waitForTimeout(1000);
    await page.mouse.move(200, 200);
    await page.waitForTimeout(1000);
    await page.mouse.move(300, 300);
    await page.waitForTimeout(1000);

    // Get performance data
    const performanceData = await page.evaluate((): PerformanceMonitoringData => {
      const win = window as WindowWithPerformance;
      return {
        frameTimes: win.__frameTimes ?? [],
        frameCount: win.__frameCount ?? 0,
        droppedFrames: win.__droppedFrames ?? 0,
      };
    });

    const { frameTimes, frameCount, droppedFrames } = performanceData;

    const averageFrameTime =
      frameTimes.reduce((a: number, b: number) => a + b, 0) / frameTimes.length;
    const droppedFramePercentage = (droppedFrames / frameCount) * 100;

    // Should still maintain good performance with multiple animations
    expect(averageFrameTime).toBeLessThan(25); // Slightly more lenient with multiple animations
    expect(droppedFramePercentage).toBeLessThan(10); // < 10% dropped frames
  });

  test('should not cause memory leaks with long-running animations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial memory usage
    const initialMemory = await page.evaluate((): number => {
      const perf = performance as PerformanceWithMemory;
      return perf.memory?.usedJSHeapSize ?? 0;
    });

    // Run animations for extended period
    await page.waitForTimeout(10000); // 10 seconds

    // Get memory usage after animations
    const finalMemory = await page.evaluate((): number => {
      const perf = performance as PerformanceWithMemory;
      return perf.memory?.usedJSHeapSize ?? 0;
    });

    // Memory increase should be reasonable (< 10MB)
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
  });

  test('should respect reduced motion preference for performance', async ({ page, context }) => {
    // Enable reduced motion
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => {
          if (query === '(prefers-reduced-motion: reduce)') {
            return {
              matches: true,
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => true,
            };
          }
          return window.matchMedia(query);
        },
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Set up performance monitoring
    await page.evaluate(() => {
      const win = window as WindowWithPerformance;
      win.__frameTimes = [];
      win.__lastFrameTime = performance.now();
      win.__frameCount = 0;

      function measureFrame(): void {
        const now = performance.now();
        const lastTime = win.__lastFrameTime ?? now;
        const delta = now - lastTime;
        win.__lastFrameTime = now;
        win.__frameTimes?.push(delta);
        win.__frameCount = (win.__frameCount ?? 0) + 1;

        requestAnimationFrame(measureFrame);
      }

      requestAnimationFrame(measureFrame);
    });

    await page.waitForTimeout(5000);

    // With reduced motion, animations should be minimal
    const performanceData = await page.evaluate((): Pick<PerformanceMonitoringData, 'frameTimes' | 'frameCount'> => {
      const win = window as WindowWithPerformance;
      return {
        frameTimes: win.__frameTimes ?? [],
        frameCount: win.__frameCount ?? 0,
      };
    });

    // Frame times should be very low with reduced motion
    const averageFrameTime =
      performanceData.frameTimes.reduce((a: number, b: number) => a + b, 0) /
      performanceData.frameTimes.length;

    expect(averageFrameTime).toBeLessThan(5); // Very low frame time with reduced motion
  });
});
