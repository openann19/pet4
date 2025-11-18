export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)! as ReturnType<T>;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

import { createLogger } from './logger';

const logger = createLogger('performance-utils');

export function lazyLoad<T>(
  importFunc: () => Promise<{ default: T }>,
  fallback: T
): () => Promise<T> {
  let cached: T | null = null;

  return async () => {
    if (cached) return cached;

    try {
      const module = await importFunc();
      cached = module.default;
      return cached;
    } catch (_error) {
      logger.error('Lazy load failed', _error instanceof Error ? _error : new Error(String(_error)));
      return fallback;
    }
  };
}

export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, number[]>();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number | null {
    const start = this.marks.get(startMark);
    if (!start) return null;

    const duration = performance.now() - start;

    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);

    return duration;
  }

  getAverage(name: string): number | null {
    const measurements = this.measures.get(name);
    if (!measurements || measurements.length === 0) return null;

    const sum = measurements.reduce((acc, val) => acc + val, 0);
    return sum / measurements.length;
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }

  report(): Record<string, { count: number; average: number; min: number; max: number }> {
    const report: Record<string, { count: number; average: number; min: number; max: number }> = {};

    this.measures.forEach((measurements, name) => {
      if (measurements.length > 0) {
        report[name] = {
          count: measurements.length,
          average: measurements.reduce((acc, val) => acc + val, 0) / measurements.length,
          min: Math.min(...measurements),
          max: Math.max(...measurements),
        };
      }
    });

    return report;
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const startMark = `${name}-start-${Date.now()}`;
  performanceMonitor.mark(startMark);

  return fn().then(
    (result) => {
      performanceMonitor.measure(name, startMark);
      return result;
    },
    (error) => {
      performanceMonitor.measure(`${name}-error`, startMark);
      throw error;
    }
  );
}

export function batchUpdates(updates: (() => void)[], batchSize = 10, delay = 0): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;

    function processBatch() {
      const end = Math.min(index + batchSize, updates.length);

      for (let i = index; i < end; i++) {
        const update = updates[i];
        if (update) {
          update();
        }
      }

      index = end;

      if (index < updates.length) {
        setTimeout(processBatch, delay);
      } else {
        resolve();
      }
    }

    processBatch();
  });
}

export function prefetchImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

export function prefetchImages(sources: string[]): Promise<void[]> {
  return Promise.all(sources.map(prefetchImage));
}

export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

export function idleCallback(callback: () => void, options?: { timeout?: number }): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, options?.timeout ?? 1);
  }
}
