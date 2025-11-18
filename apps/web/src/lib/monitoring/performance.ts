/**
 * Performance monitoring utilities for tracking Core Web Vitals and custom metrics
 */

import type { LayoutShiftEntry } from '@/lib/types/performance-api';
import { createLogger } from '../logger';
// Unused imports removed: isTruthy, isDefined

const logger = createLogger('PerformanceMonitoring');

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

type MetricCallback = (metric: PerformanceMetric) => void;

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

function getRating(
  value: number,
  thresholds: { good: number; poor: number }
): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function createMetric(
  name: string,
  value: number,
  thresholds: { good: number; poor: number }
): PerformanceMetric {
  return {
    name,
    value,
    rating: getRating(value, thresholds),
    timestamp: Date.now(),
  };
}

/**
 * Monitor Largest Contentful Paint (LCP)
 */
export function observeLCP(callback: MetricCallback): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        const lcp = lastEntry.startTime;
        callback(createMetric('LCP', lcp, THRESHOLDS.LCP));
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Error observing LCP', err);
  }
}

/**
 * Monitor First Input Delay (FID)
 */
export function observeFID(callback: MetricCallback): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: PerformanceEntry) => {
        if ('processingStart' in entry && 'startTime' in entry) {
          const fid =
            (entry as { processingStart: number; startTime: number }).processingStart -
            entry.startTime;
          callback(createMetric('FID', fid, THRESHOLDS.FID));
        }
      });
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Error observing FID', err);
  }
}

/**
 * Monitor Cumulative Layout Shift (CLS)
 */
export function observeCLS(callback: MetricCallback): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  let clsValue = 0;
  let sessionValue = 0;
  const sessionEntries: PerformanceEntry[] = [];

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        const layoutShiftEntry = entry as LayoutShiftEntry;
        if ('value' in layoutShiftEntry && !layoutShiftEntry.hadRecentInput) {
          const value = layoutShiftEntry.value;
          sessionValue += value;
          sessionEntries.push(entry);

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            callback(createMetric('CLS', clsValue, THRESHOLDS.CLS));
          }
        }
      });
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Error observing CLS', err);
  }
}

/**
 * Monitor First Contentful Paint (FCP)
 */
export function observeFCP(callback: MetricCallback): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          callback(createMetric('FCP', entry.startTime, THRESHOLDS.FCP));
        }
      });
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Error observing FCP', err);
  }
}

/**
 * Monitor Time to First Byte (TTFB)
 */
export function observeTTFB(callback: MetricCallback): void {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return;
  }

  try {
    const navigationEntry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      callback(createMetric('TTFB', ttfb, THRESHOLDS.TTFB));
    }
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Error observing TTFB', err);
  }
}

/**
 * Initialize all Core Web Vitals monitoring
 */
export function initPerformanceMonitoring(callback: MetricCallback): void {
  if (typeof window === 'undefined') {
    return;
  }

  observeLCP(callback);
  observeFID(callback);
  observeCLS(callback);
  observeFCP(callback);
  observeTTFB(callback);
}

/**
 * Track custom performance metric
 */
export function trackMetric(name: string, value: number): void {
  if (typeof window !== 'undefined' && 'performance' in window && 'measure' in performance) {
    try {
      performance.measure(name, {
        start: 0,
        duration: value,
      });
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Error tracking metric', err, { metricName: name, value });
    }
  }
}

/**
 * Measure function execution time
 */
export function measureExecution<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  trackMetric(name, duration);
  return result;
}

/**
 * Measure async function execution time
 */
export async function measureExecutionAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  trackMetric(name, duration);
  return result;
}
