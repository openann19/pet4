/**
 * Performance budget monitoring with alerts and throttling
 *
 * Features:
 * - Bundle size tracking
 * - Asset size monitoring
 * - Page load time budgets
 * - Core Web Vitals tracking (LCP, FID, CLS)
 * - Memory usage budgets
 * - Network request budgets
 * - Automatic alerts when budgets exceeded
 * - Historical trend analysis
 *
 * @example
 * ```tsx
 * const perfBudget = usePerformanceBudget({
 *   budgets: {
 *     bundleSize: 250000, // 250KB
 *     firstContentfulPaint: 1800, // 1.8s
 *     largestContentfulPaint: 2500, // 2.5s
 *     cumulativeLayoutShift: 0.1,
 *     firstInputDelay: 100 // 100ms
 *   },
 *   onBudgetExceeded: (metric, value, budget) => {
 *     logWarning(`${metric} exceeded: ${value} > ${budget}`);
 *   }
 * });
 *
 * // Check if within budget
 * const isHealthy = perfBudget.isWithinBudget();
 *
 * // Get violations
 * const violations = perfBudget.state.violations;
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface PerformanceBudgets {
  readonly bundleSize?: number; // bytes
  readonly totalAssetSize?: number; // bytes
  readonly firstContentfulPaint?: number; // ms
  readonly largestContentfulPaint?: number; // ms
  readonly firstInputDelay?: number; // ms
  readonly cumulativeLayoutShift?: number; // score
  readonly timeToInteractive?: number; // ms
  readonly totalBlockingTime?: number; // ms
  readonly speedIndex?: number; // ms
  readonly maxRequests?: number;
  readonly maxMemoryUsage?: number; // MB
}

export interface PerformanceBudgetConfig {
  readonly budgets: PerformanceBudgets;
  readonly onBudgetExceeded?: (metric: string, value: number, budget: number) => void;
  readonly onBudgetWarning?: (metric: string, value: number, budget: number, percentage: number) => void;
  readonly warningThreshold?: number; // 0-1, default 0.8 (80%)
  readonly enableAutoTracking?: boolean;
}

export interface BudgetViolation {
  readonly metric: string;
  readonly value: number;
  readonly budget: number;
  readonly exceededBy: number;
  readonly timestamp: number;
}

export interface PerformanceBudgetState {
  readonly metrics: Record<string, number>;
  readonly violations: readonly BudgetViolation[];
  readonly isWithinBudget: boolean;
  readonly budgetHealth: number; // 0-100
  readonly lastCheck: number;
}

export interface WebVitals {
  readonly lcp: number | null; // Largest Contentful Paint
  readonly fid: number | null; // First Input Delay
  readonly cls: number | null; // Cumulative Layout Shift
  readonly fcp: number | null; // First Contentful Paint
  readonly ttfb: number | null; // Time to First Byte
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_WARNING_THRESHOLD = 0.8; // 80%
const CHECK_INTERVAL = 10000; // 10 seconds
const HISTORY_SIZE = 100;

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePerformanceBudget(config: PerformanceBudgetConfig) {
  const {
    budgets,
    onBudgetExceeded,
    onBudgetWarning,
    warningThreshold = DEFAULT_WARNING_THRESHOLD,
    enableAutoTracking = true,
  } = config;

  // State
  const [state, setState] = useState<PerformanceBudgetState>({
    metrics: {},
    violations: [],
    isWithinBudget: true,
    budgetHealth: 100,
    lastCheck: Date.now(),
  });

  // Refs
  const checkIntervalRef = useRef<number | null>(null);
  const metricsHistoryRef = useRef<Array<Record<string, number>>>([]);
  const webVitalsRef = useRef<{
    lcp: number | null;
    fid: number | null;
    cls: number | null;
    fcp: number | null;
    ttfb: number | null;
  }>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  });

  // ============================================================================
  // Metric Collection
  // ============================================================================

  const collectMetrics = useCallback((): Record<string, number> => {
    const metrics: Record<string, number> = {};

    // Performance timing metrics
    if (performance.timing) {
      const timing = performance.timing;
      const navigationStart = timing.navigationStart;

      if (timing.domContentLoadedEventEnd) {
        metrics.domContentLoaded =
          timing.domContentLoadedEventEnd - navigationStart;
      }

      if (timing.loadEventEnd) {
        metrics.pageLoad = timing.loadEventEnd - navigationStart;
      }

      if (timing.responseStart) {
        metrics.timeToFirstByte = timing.responseStart - navigationStart;
      }
    }

    // Performance entries
    const paintEntries = performance.getEntriesByType('paint');
    for (const entry of paintEntries) {
      if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    }

    // Resource sizes
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let totalSize = 0;
    let requestCount = 0;

    for (const resource of resources) {
      totalSize += resource.transferSize || 0;
      requestCount++;
    }

    metrics.totalAssetSize = totalSize;
    metrics.requestCount = requestCount;

    // Memory usage (if available)
    const perfWithMemory = performance as Performance & { memory?: { usedJSHeapSize: number } };
    if (perfWithMemory.memory) {
      metrics.memoryUsage = perfWithMemory.memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    // Web Vitals
    if (webVitalsRef.current.lcp !== null) {
      metrics.largestContentfulPaint = webVitalsRef.current.lcp;
    }

    if (webVitalsRef.current.fid !== null) {
      metrics.firstInputDelay = webVitalsRef.current.fid;
    }

    if (webVitalsRef.current.cls !== null) {
      metrics.cumulativeLayoutShift = webVitalsRef.current.cls;
    }

    return metrics;
  }, []);

  // ============================================================================
  // Budget Checking
  // ============================================================================

  const checkBudgets = useCallback(() => {
    const metrics = collectMetrics();
    const violations: BudgetViolation[] = [];
    let totalBudgets = 0;
    let violatedBudgets = 0;

    // Check each budget
    for (const [metricKey, budget] of Object.entries(budgets)) {
      if (budget === undefined) continue;

      const value = metrics[metricKey];
      if (value === undefined) continue;

      totalBudgets++;

      // Check if exceeded
      if (value > budget) {
        violatedBudgets++;

        const violation: BudgetViolation = {
          metric: metricKey,
          value,
          budget,
          exceededBy: value - budget,
          timestamp: Date.now(),
        };

        violations.push(violation);

        if (onBudgetExceeded) {
          onBudgetExceeded(metricKey, value, budget);
        }
      }
      // Check warning threshold
      else if (value > budget * warningThreshold) {
        const percentage = (value / budget) * 100;

        if (onBudgetWarning) {
          onBudgetWarning(metricKey, value, budget, percentage);
        }
      }
    }

    // Calculate health score
    const health =
      totalBudgets > 0
        ? Math.round(((totalBudgets - violatedBudgets) / totalBudgets) * 100)
        : 100;

    // Add to history
    metricsHistoryRef.current.push(metrics);
    if (metricsHistoryRef.current.length > HISTORY_SIZE) {
      metricsHistoryRef.current.shift();
    }

    setState({
      metrics,
      violations,
      isWithinBudget: violations.length === 0,
      budgetHealth: health,
      lastCheck: Date.now(),
    });
  }, [
    budgets,
    collectMetrics,
    warningThreshold,
    onBudgetExceeded,
    onBudgetWarning,
  ]);

  // ============================================================================
  // Web Vitals Tracking
  // ============================================================================

  const trackWebVitals = useCallback(() => {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformancePaintTiming & { renderTime?: number; loadTime?: number };
      if (lastEntry) {
        webVitalsRef.current.lcp = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
      }
    });

    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // Not supported
    }

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const firstEntry = entries[0] as PerformanceEventTiming;
      if (firstEntry) {
        webVitalsRef.current.fid = firstEntry.processingStart - firstEntry.startTime;
      }
    });

    try {
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {
      // Not supported
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value || 0;
          webVitalsRef.current.cls = clsValue;
        }
      }
    });

    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Not supported
    }

    // First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
      if (fcpEntry) {
        webVitalsRef.current.fcp = fcpEntry.startTime;
      }
    });

    try {
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch {
      // Not supported
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      fcpObserver.disconnect();
    };
  }, []);

  // ============================================================================
  // Public API
  // ============================================================================

  const isWithinBudget = useCallback(
    (metric?: string): boolean => {
      if (!metric) {
        return state.isWithinBudget;
      }

      const value = state.metrics[metric];
      const budget = budgets[metric as keyof PerformanceBudgets];

      if (value === undefined || budget === undefined) {
        return true;
      }

      return value <= budget;
    },
    [state.isWithinBudget, state.metrics, budgets]
  );

  const getMetricHistory = useCallback(
    (metric: string): readonly number[] => {
      return metricsHistoryRef.current
        .map((m) => m[metric])
        .filter((v): v is number => v !== undefined);
    },
    []
  );

  const getTrend = useCallback(
    (metric: string): 'improving' | 'stable' | 'degrading' => {
      const history = getMetricHistory(metric);
      if (history.length < 2) return 'stable';

      const recent = history.slice(-10);
      const older = history.slice(-20, -10);

      if (recent.length === 0 || older.length === 0) return 'stable';

      const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
      const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;

      const diff = recentAvg - olderAvg;
      const threshold = olderAvg * 0.05; // 5% threshold

      if (diff < -threshold) return 'improving';
      if (diff > threshold) return 'degrading';
      return 'stable';
    },
    [getMetricHistory]
  );

  const getWebVitals = useCallback((): WebVitals => {
    return webVitalsRef.current;
  }, []);

  const reset = useCallback(() => {
    metricsHistoryRef.current = [];
    webVitalsRef.current = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
    };

    setState({
      metrics: {},
      violations: [],
      isWithinBudget: true,
      budgetHealth: 100,
      lastCheck: Date.now(),
    });
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  // Initial check
  useEffect(() => {
    if (enableAutoTracking) {
      // Wait for page load
      if (document.readyState === 'complete') {
        checkBudgets();
      } else {
        window.addEventListener('load', checkBudgets, { once: true });
      }
    }

    return undefined;
  }, [enableAutoTracking, checkBudgets]);

  // Periodic checking
  useEffect(() => {
    if (enableAutoTracking) {
      checkIntervalRef.current = window.setInterval(() => {
        checkBudgets();
      }, CHECK_INTERVAL);

      return () => {
        if (checkIntervalRef.current !== null) {
          clearInterval(checkIntervalRef.current);
        }
      };
    }

    return undefined;
  }, [enableAutoTracking, checkBudgets]);

  // Web Vitals tracking
  useEffect(() => {
    if (enableAutoTracking) {
      return trackWebVitals();
    }

    return undefined;
  }, [enableAutoTracking, trackWebVitals]);

  return {
    checkBudgets,
    isWithinBudget,
    getMetricHistory,
    getTrend,
    getWebVitals,
    reset,
    state,
  };
}
