/**
 * Runtime Test Helpers
 *
 * Utilities for testing runtime validation, monitoring, and configuration code
 */

import { vi } from 'vitest';
import type { RuntimeMetrics } from '@/core/config/performance-budget';
import type { PerformanceBudgetConfig } from '@/core/config/performance-budget.config';

/**
 * Mock runtime environment variables
 * Uses vi.stubEnv to mock import.meta.env values
 * Note: This must be called BEFORE importing modules that use import.meta.env
 */
export function mockRuntimeEnvironment(env: Record<string, string | boolean>): () => void {
  const originalEnv: Record<string, unknown> = {};

  // Store original values before stubbing
  Object.keys(env).forEach((key) => {
    try {
      originalEnv[key] = (import.meta.env as Record<string, unknown>)[key];
    } catch {
      // Ignore if key doesn't exist
      originalEnv[key] = undefined;
    }
  });

  // Stub environment variables using vi.stubEnv
  // This works with Vite's import.meta.env by setting process.env values
  // that Vite will inject into import.meta.env
  Object.entries(env).forEach(([key, value]) => {
    const stringValue = typeof value === 'boolean' ? value.toString() : value;
    vi.stubEnv(key, stringValue);
  });

  // For PROD flag, we also need to handle import.meta.env.PROD
  // This is set by Vite based on the mode, but we can't directly modify it
  // The tests should use vi.unmock() and dynamic imports to test with different env values

  // Return cleanup function
  return () => {
    // Restore original values
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        vi.stubEnv(key, String(value));
      } else {
        // Remove stubbed env var
        delete process.env[key];
      }
    });
    vi.unstubAllEnvs();
  };
}

/**
 * Mock Performance API
 * Mocks window.performance and PerformanceObserver for runtime tests
 */
export function mockPerformanceAPI(): {
  performance: Performance;
  PerformanceObserver: typeof PerformanceObserver;
  cleanup: () => void;
} {
  const mockMemory: PerformanceMemory = {
    usedJSHeapSize: 50 * 1024 * 1024, // 50 MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100 MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2 GB
  };

  const mockPerformance: Performance = {
    memory: mockMemory,
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    getEntries: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    now: vi.fn(() => Date.now()),
    navigation: {
      type: 0,
      redirectCount: 0,
    } as PerformanceNavigation,
    timing: {
      navigationStart: 0,
      unloadEventStart: 0,
      unloadEventEnd: 0,
      redirectStart: 0,
      redirectEnd: 0,
      fetchStart: 0,
      domainLookupStart: 0,
      domainLookupEnd: 0,
      connectStart: 0,
      connectEnd: 0,
      secureConnectionStart: 0,
      requestStart: 0,
      responseStart: 0,
      responseEnd: 0,
      domLoading: 0,
      domInteractive: 0,
      domContentLoadedEventStart: 0,
      domContentLoadedEventEnd: 0,
      domComplete: 0,
      loadEventStart: 0,
      loadEventEnd: 0,
    } as PerformanceTiming,
    timeOrigin: Date.now(),
    toJSON: vi.fn(() => ({})),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as Performance;

  // Create a proper constructor for PerformanceObserver
  class MockPerformanceObserver implements PerformanceObserver {
    private callback: PerformanceObserverCallback;
    public observe: (options?: PerformanceObserverInit) => void;
    public disconnect: () => void;
    public takeRecords: () => PerformanceEntryList;

    constructor(callback: PerformanceObserverCallback) {
      this.callback = callback;
      this.observe = vi.fn((options?: PerformanceObserverInit) => {
        // Mock implementation
      });
      this.disconnect = vi.fn(() => {
        // Mock implementation
      });
      this.takeRecords = vi.fn(() => []) as () => PerformanceEntryList;
    }

    // Required by PerformanceObserver interface
    readonly supportedEntryTypes: readonly string[] = [];
  }

  const mockPerformanceObserver = MockPerformanceObserver as unknown as typeof PerformanceObserver;

  // Store original values
  const originalPerformance = global.performance;
  const originalWindowPerformance = (global as typeof globalThis & { window?: Window }).window?.performance;
  const originalPerformanceObserver = global.PerformanceObserver;
  const originalWindowPerformanceObserver = (global as typeof globalThis & { window?: Window }).window?.PerformanceObserver;

  // Mock global performance
  Object.defineProperty(global, 'performance', {
    value: mockPerformance,
    writable: true,
    configurable: true,
  });

  // Mock global PerformanceObserver
  Object.defineProperty(global, 'PerformanceObserver', {
    value: mockPerformanceObserver,
    writable: true,
    configurable: true,
  });

  // Mock window.performance and window.PerformanceObserver (jsdom uses window)
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'performance', {
      value: mockPerformance,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'PerformanceObserver', {
      value: mockPerformanceObserver,
      writable: true,
      configurable: true,
    });
  }

  // Return cleanup function
  return {
    performance: mockPerformance,
    PerformanceObserver: mockPerformanceObserver,
    cleanup: () => {
      Object.defineProperty(global, 'performance', {
        value: originalPerformance,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'PerformanceObserver', {
        value: originalPerformanceObserver,
        writable: true,
        configurable: true,
      });
      if (typeof window !== 'undefined') {
        if (originalWindowPerformance) {
          Object.defineProperty(window, 'performance', {
            value: originalWindowPerformance,
            writable: true,
            configurable: true,
          });
        } else {
          delete (window as unknown as Record<string, unknown>).performance;
        }
        if (originalWindowPerformanceObserver) {
          Object.defineProperty(window, 'PerformanceObserver', {
            value: originalWindowPerformanceObserver,
            writable: true,
            configurable: true,
          });
        } else {
          delete (window as unknown as Record<string, unknown>).PerformanceObserver;
        }
      }
    },
  };
}

/**
 * Mock Memory API
 * Mocks performance.memory for memory-related tests
 */
export function mockMemoryAPI(memory?: {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}): () => void {
  const mockMemory: PerformanceMemory = {
    usedJSHeapSize: memory?.usedJSHeapSize ?? 50 * 1024 * 1024, // 50 MB
    totalJSHeapSize: memory?.totalJSHeapSize ?? 100 * 1024 * 1024, // 100 MB
    jsHeapSizeLimit: memory?.jsHeapSizeLimit ?? 2 * 1024 * 1024 * 1024, // 2 GB
  };

  const originalPerformance = global.performance;
  const mockPerformance = {
    ...originalPerformance,
    memory: mockMemory,
  } as Performance & { memory: PerformanceMemory };

  Object.defineProperty(global, 'performance', {
    value: mockPerformance,
    writable: true,
    configurable: true,
  });

  // Return cleanup function
  return () => {
    Object.defineProperty(global, 'performance', {
      value: originalPerformance,
      writable: true,
      configurable: true,
    });
  };
}

/**
 * Create test runtime metrics
 * Helper to create RuntimeMetrics objects for testing
 */
export function createRuntimeMetrics(overrides?: Partial<RuntimeMetrics>): RuntimeMetrics {
  return {
    fps: 60,
    frameTime: 16.67,
    memory: 50,
    jsExecutionTime: 5,
    ...overrides,
  };
}

/**
 * Create test performance budget config
 * Helper to create PerformanceBudgetConfig objects for testing
 */
export function createTestPerformanceBudgetConfig(
  overrides?: Partial<PerformanceBudgetConfig>
): PerformanceBudgetConfig {
  return {
    bundles: {
      initial: 200,
      total: 1000,
      chunk: 300,
      vendor: 500,
      ...overrides?.bundles,
    },
    loadTimes: {
      fcp: 1800,
      lcp: 2500,
      tti: 3800,
      fid: 100,
      cls: 0.1,
      ...overrides?.loadTimes,
    },
    runtime: {
      fps: 60,
      frameTime: 16.67,
      memory: 100,
      jsExecutionTime: 10,
      ...overrides?.runtime,
    },
  };
}

/**
 * Wait for runtime check to complete
 * Helper to wait for async runtime checks (e.g., performance monitoring)
 */
export async function waitForRuntimeCheck(timeout = 1000): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

/**
 * Mock requestAnimationFrame for FPS/frame time tests
 */
export function mockRequestAnimationFrame(): {
  raf: typeof requestAnimationFrame;
  cancelRaf: typeof cancelAnimationFrame;
  cleanup: () => void;
} {
  let rafId = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  let lastTime = 0;

  const mockRaf: typeof requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    rafId += 1;
    callbacks.set(rafId, callback);
    // Simulate frame timing (16.67ms for 60fps)
    lastTime += 16.67;
    setTimeout(() => {
      callback(lastTime);
    }, 0);
    return rafId;
  });

  const mockCancelRaf: typeof cancelAnimationFrame = vi.fn((id: number) => {
    callbacks.delete(id);
  });

  const originalRaf = global.requestAnimationFrame;
  const originalCancelRaf = global.cancelAnimationFrame;

  Object.defineProperty(global, 'requestAnimationFrame', {
    value: mockRaf,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(global, 'cancelAnimationFrame', {
    value: mockCancelRaf,
    writable: true,
    configurable: true,
  });

  return {
    raf: mockRaf,
    cancelRaf: mockCancelRaf,
    cleanup: () => {
      Object.defineProperty(global, 'requestAnimationFrame', {
        value: originalRaf,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'cancelAnimationFrame', {
        value: originalCancelRaf,
        writable: true,
        configurable: true,
      });
      callbacks.clear();
    },
  };
}

/**
 * Performance Memory interface
 * Extends Performance interface with memory property
 */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}
