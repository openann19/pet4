/**
 * Web Vitals Integration
 *
 * Minimal probe for TTFB, LCP, CLS, and long tasks.
 * One log line per session with summarized metrics.
 */

interface WebVitalsMetrics {
  ttfb?: number;
  lcp?: number;
  cls?: number;
  fid?: number;
  fcp?: number;
  longTasks?: number;
  sessionStart: number;
}

const metrics: WebVitalsMetrics = {
  sessionStart: Date.now(),
};

let longTaskCount = 0;

/**
 * Report metrics once per session
 */
function reportMetrics(): void {
  if (typeof window === 'undefined') return;

  const sessionDuration = Date.now() - metrics.sessionStart;
  const summary = {
    ttfb: metrics.ttfb,
    lcp: metrics.lcp,
    cls: metrics.cls,
    fid: metrics.fid,
    fcp: metrics.fcp,
    longTasks: longTaskCount,
    sessionDuration,
  };

  // Send to telemetry endpoint if available
  if (import.meta.env.PROD) {
    // In production, send to telemetry service
    // This would integrate with your telemetry system
    try {
      const endpoint = import.meta.env.VITE_TELEMETRY_ENDPOINT;
      if (endpoint) {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(summary),
          keepalive: true,
        }).catch(() => {
          // Silently fail if telemetry is unavailable
        });
      }
    } catch {
      // Silently fail
    }
  }
}

/**
 * Initialize Web Vitals collection
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Use Performance API for basic metrics
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.ttfb = navigation.responseStart - navigation.requestStart;
      metrics.fcp = navigation.domContentLoadedEventEnd - navigation.fetchStart;
    }

    // Long Task Observer
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              longTaskCount++;
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch {
        // Long Task Observer not supported
      }

      // LCP Observer
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            renderTime?: number;
            loadTime?: number;
          };
          if (lastEntry) {
            metrics.lcp = lastEntry.renderTime ?? lastEntry.loadTime ?? lastEntry.startTime;
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        // LCP Observer not supported
      }

      // CLS Observer
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as LayoutShift[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch {
        // CLS Observer not supported
      }

      // FID Observer
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as PerformanceEventTiming[]) {
            if (entry.processingStart && entry.startTime) {
              metrics.fid = entry.processingStart - entry.startTime;
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch {
        // FID Observer not supported
      }
    }

    // Report metrics before page unload
    window.addEventListener('beforeunload', () => {
      reportMetrics();
    });

    // Also report after a delay to capture late metrics
    setTimeout(() => {
      reportMetrics();
    }, 10000);
  } catch {
    // Silently fail if Performance API is unavailable
  }
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}
