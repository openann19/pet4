import { createLogger } from './logger';
import type { LayoutShiftEntry } from './types/performance-api';

const logger = createLogger('AdvancedPerformance');

export class AdvancedPerformance {
  private static observers = new Map<string, IntersectionObserver>();
  private static _prefetchCache = new Set<string>();
  
  // Public accessor for prefetch cache
  static get prefetchCache(): Set<string> {
    return AdvancedPerformance._prefetchCache;
  }

  static lazyLoadImages(container: HTMLElement = document.body): void {
    const images = container.querySelectorAll('img[data-src]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.getAttribute('data-src');

            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    images.forEach((img) => observer.observe(img));
    this.observers.set('images', observer);
  }

  static prefetchOnHover(selector: string): void {
    document.addEventListener('mouseover', (e) => {
      const target = (e.target as HTMLElement).closest(selector);
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || this.prefetchCache.has(href)) return;

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);

      this.prefetchCache.add(href);
    });
  }

  static prefetchViewport(): void {
    const links = document.querySelectorAll('a[href]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.href;

            if (!this.prefetchCache.has(href)) {
              const prefetchLink = document.createElement('link');
              prefetchLink.rel = 'prefetch';
              prefetchLink.href = href;
              document.head.appendChild(prefetchLink);

              this.prefetchCache.add(href);
            }

            observer.unobserve(link);
          }
        });
      },
      { rootMargin: '100px' }
    );

    links.forEach((link) => observer.observe(link));
    this.observers.set('links', observer);
  }

  static async preloadCriticalResources(urls: string[]): Promise<void> {
    const promises = urls.map((url) => {
      return new Promise<void>((resolve, reject) => {
        if (/\.(jpg|jpeg|png|gif|webp)$/i.exec(url)) {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        } else if (/\.(mp4|webm|ogg)$/i.exec(url)) {
          const video = document.createElement('video');
          video.onloadeddata = () => resolve();
          video.onerror = reject;
          video.src = url;
        } else {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'fetch';
          link.href = url;
          link.onload = () => resolve();
          link.onerror = reject;
          document.head.appendChild(link);
        }
      });
    });

    await Promise.allSettled(promises);
  }

  static deferNonCritical(callback: () => void, timeout = 1000): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout });
    } else {
      setTimeout(callback, timeout);
    }
  }

  static measurePerformance(label: string, fn: () => void): number {
    const start = performance.now();
    fn();
    const end = performance.now();
    const duration = end - start;

    logger.debug(`Performance: ${label}`, { duration });
    return duration;
  }

  static async measureAsyncPerformance<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    logger.debug(`Performance: ${label}`, { duration });
    return { result, duration };
  }

  static throttleRAF<T extends (...args: unknown[]) => void>(fn: T): T {
    let rafId: number | null = null;
    let lastArgs: Parameters<T>;

    return ((...args: Parameters<T>) => {
      lastArgs = args;

      rafId ??= requestAnimationFrame(() => {
        fn(...lastArgs);
        rafId = null;
      });
    }) as T;
  }

  static memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key)!;
      }

      const result = fn(...args) as ReturnType<T>;
      cache.set(key, result);
      return result;
    }) as T;
  }

  static batchUpdates<T>(
    items: T[],
    processFn: (item: T) => void,
    batchSize = 50,
    delay = 0
  ): Promise<void> {
    return new Promise((resolve) => {
      let index = 0;

      const processBatch = () => {
        const batch = items.slice(index, index + batchSize);
        batch.forEach(processFn);

        index += batchSize;

        if (index < items.length) {
          if (delay > 0) {
            setTimeout(processBatch, delay);
          } else {
            requestAnimationFrame(processBatch);
          }
        } else {
          resolve();
        }
      };

      processBatch();
    });
  }

  static virtualizeList<T>(
    items: T[],
    containerHeight: number,
    itemHeight: number,
    scrollTop: number
  ): { visibleItems: T[]; startIndex: number; offsetY: number } {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);

    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;

    return { visibleItems, startIndex, offsetY };
  }

  static optimizeImages(container: HTMLElement = document.body): void {
    const images = container.querySelectorAll('img');

    images.forEach((img) => {
      if (!img.loading) {
        img.loading = 'lazy';
      }

      if (!img.decoding) {
        img.decoding = 'async';
      }

      if (!img.sizes && img.width) {
        img.sizes = `${img.width}px`;
      }
    });
  }

  static reduceMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  static getCLS(): Promise<number> {
    return new Promise((resolve) => {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as LayoutShiftEntry;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 5000);
    });
  }

  static getLCP(): Promise<number> {
    return new Promise((resolve) => {
      let lcpValue = 0;

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          lcpValue = lastEntry.startTime;
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });

      setTimeout(() => {
        observer.disconnect();
        resolve(lcpValue);
      }, 5000);
    });
  }

  static cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.prefetchCache.clear();
  }
}

export function useVirtualList<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0);

  const { visibleItems, startIndex, offsetY } = AdvancedPerformance.virtualizeList(
    items,
    containerHeight,
    itemHeight,
    scrollTop
  );

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    startIndex,
    offsetY,
    totalHeight,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

import { useEffect, useState } from 'react';

export function usePrefetch(url: string, condition = true) {
  useEffect(() => {
    if (!condition || AdvancedPerformance.prefetchCache.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);

    AdvancedPerformance.prefetchCache.add(url);

    return () => {
      document.head.removeChild(link);
    };
  }, [url, condition]);
}

export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry) {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      }
    }, options);

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
}
