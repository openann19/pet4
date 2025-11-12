import { createLogger } from '@/lib/logger';
import type { LayoutShiftEntry, PerformanceWithMemory } from '@/lib/types/performance-api';
import { sentryConfig } from './sentry-config';

const logger = createLogger('PerformanceMonitor');

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: number;
  tags?: Record<string, string>;
}

class PerformanceMonitorImpl {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  init(): void {
    this.setupWebVitals();
    this.setupResourceMonitoring();
    this.setupUserTimingAPI();
    this.setupMemoryMonitoring();
  }

  private setupWebVitals(): void {
    // Core Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1]!;

        this.recordMetric({
          name: 'web_vitals.lcp',
          value: lastEntry.startTime,
          unit: 'ms',
          timestamp: Date.now(),
        });
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        logger.warn('LCP observer not supported', err);
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart: number };
          this.recordMetric({
            name: 'web_vitals.fid',
            value: fidEntry.processingStart - fidEntry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
          });
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        logger.warn('FID observer not supported', err);
      }

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const clsEntry = entry as LayoutShiftEntry;
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value;
          }
        });

        this.recordMetric({
          name: 'web_vitals.cls',
          value: clsValue,
          unit: 'count',
          timestamp: Date.now(),
        });
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        logger.warn('CLS observer not supported', err);
      }
    }
  }

  private setupResourceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry) => {
          const resourceEntry = entry as PerformanceResourceTiming;
          // Monitor slow resources
          if (resourceEntry.duration > 1000) {
            this.recordMetric({
              name: 'resource.slow_load',
              value: resourceEntry.duration,
              unit: 'ms',
              timestamp: Date.now(),
              tags: {
                resource_type: resourceEntry.initiatorType,
                resource_name: resourceEntry.name.split('/').pop() || 'unknown',
              },
            });
          }

          // Monitor large resources
          if (resourceEntry.transferSize > 1000000) {
            // 1MB
            this.recordMetric({
              name: 'resource.large_size',
              value: resourceEntry.transferSize,
              unit: 'bytes',
              timestamp: Date.now(),
              tags: {
                resource_type: resourceEntry.initiatorType,
                resource_name: resourceEntry.name.split('/').pop() || 'unknown',
              },
            });
          }
        });
      });

      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        logger.warn('Resource observer not supported', err);
      }
    }
  }

  private setupUserTimingAPI(): void {
    if ('PerformanceObserver' in window) {
      const userTimingObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry) => {
          this.recordMetric({
            name: `user_timing.${String(entry.name ?? '')}`,
            value: entry.duration || entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
          });
        });
      });

      try {
        userTimingObserver.observe({ entryTypes: ['measure', 'mark'] });
        this.observers.push(userTimingObserver);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        logger.warn('User timing observer not supported', err);
      }
    }
  }

  private setupMemoryMonitoring(): void {
    // Monitor memory usage
    setInterval(() => {
      const performanceWithMemory = performance as PerformanceWithMemory;
      if (performanceWithMemory.memory) {
        const memory = performanceWithMemory.memory;

        this.recordMetric({
          name: 'memory.used_heap_size',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          timestamp: Date.now(),
        });

        this.recordMetric({
          name: 'memory.heap_usage_percentage',
          value: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
          unit: 'percentage',
          timestamp: Date.now(),
        });
      }
    }, 30000); // Every 30 seconds
  }

  // API Performance Tracking
  trackAPICall(method: string, endpoint: string, duration: number, status: number): void {
    this.recordMetric({
      name: 'api.request_duration',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: {
        method,
        endpoint: endpoint.split('?')[0] ?? endpoint, // Remove query params
        status: status.toString(),
        status_class: `${Math.floor(status / 100)}xx`,
      },
    });

    // Track errors
    if (status >= 400) {
      this.recordMetric({
        name: 'api.error_count',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        tags: {
          method,
          endpoint: endpoint.split('?')[0] ?? endpoint,
          status: status.toString(),
        },
      });
    }
  }

  // Route Performance Tracking
  trackRouteChange(route: string, loadTime: number): void {
    this.recordMetric({
      name: 'route.load_time',
      value: loadTime,
      unit: 'ms',
      timestamp: Date.now(),
      tags: {
        route: route.replace(/\/\d+/g, '/:id'), // Normalize dynamic routes
      },
    });
  }

  // Custom Performance Marks
  mark(name: string): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  measure(name: string, startMark: string, endMark?: string): void {
    if ('performance' in window && 'measure' in performance) {
      try {
        if (endMark !== undefined) {
          performance.measure(name, startMark, endMark);
        } else {
          performance.measure(name, startMark);
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        logger.warn('Failed to create performance measure', {
          error: err,
          name,
          startMark,
          endMark,
        });
      }
    }
  }

  // Feature Performance Tracking
  trackFeatureUsage(feature: string, duration?: number): void {
    this.recordMetric({
      name: 'feature.usage',
      value: duration || 1,
      unit: duration ? 'ms' : 'count',
      timestamp: Date.now(),
      tags: { feature },
    });
  }

  trackUserInteraction(interaction: string, duration: number): void {
    this.recordMetric({
      name: 'interaction.duration',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: { interaction },
    });
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Send to Sentry
    sentryConfig.addBreadcrumb({
      message: `Performance: ${String(metric.name ?? '')}`,
      category: 'performance',
      level: 'info',
      data: {
        value: metric.value,
        unit: metric.unit,
        tags: metric.tags,
      },
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      logger.debug('Performance metric recorded', metric);
    }

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Get performance summary
  getSummary(): {
    totalMetrics: number;
    averageValues: Record<string, number>;
    slowestOperations: PerformanceMetric[];
  } {
    const summary = {
      totalMetrics: this.metrics.length,
      averageValues: {} as Record<string, number>,
      slowestOperations: [] as PerformanceMetric[],
    };

    // Calculate averages by metric name
    const metricGroups = this.metrics.reduce(
      (groups, metric) => {
        if (!groups[metric.name]) {
          groups[metric.name] = [];
        }
        const group = groups[metric.name];
        if (group) {
          group.push(metric.value);
        }
        return groups;
      },
      {} as Record<string, number[]>
    );

    Object.entries(metricGroups).forEach(([name, values]) => {
      summary.averageValues[name] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    // Find slowest operations
    summary.slowestOperations = this.metrics
      .filter((m) => m.unit === 'ms' && m.value > 1000)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return summary;
  }

  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitorImpl();

// Auto-initialize on load
if (typeof window !== 'undefined') {
  performanceMonitor.init();

  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup();
  });
}
