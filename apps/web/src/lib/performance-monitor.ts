import { createLogger } from './logger';

const logger = createLogger('PerformanceMonitor');

export interface PerformanceMetrics {
  coldStart: number;
  fps: number;
  frameDrops: number;
  memoryUsage: number;
  longFrames: number;
  avgResponseTime: number;
}

export interface CrashReport {
  timestamp: number;
  error: string;
  stack?: string;
  componentStack?: string;
  userAgent: string;
  url: string;
  crashId: string;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

class PerformanceMonitor {
  private startTime: number = Date.now();
  private frameCount = 0;
  private lastFrameTime: number = performance.now();
  private frameDrops = 0;
  private longFrames = 0;
  private crashes: CrashReport[] = [];
  private sessions = 0;
  private crashFreeSessions = 0;
  private monitoring = false;
  private animationFrameId: number | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    this.trackColdStart();
    this.setupErrorHandling();
    this.startFrameMonitoring();
  }

  private trackColdStart() {
    if (performance.timing) {
      const coldStart =
        performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
      logger.info('Cold start measured', { coldStart });
    }
  }

  private setupErrorHandling() {
    window.addEventListener('error', (event) => {
      this.recordCrash({
        timestamp: Date.now(),
        error: event.message,
        stack: event.error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        crashId: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordCrash({
        timestamp: Date.now(),
        error: `Unhandled Promise Rejection: ${event.reason}`,
        userAgent: navigator.userAgent,
        url: window.location.href,
        crashId: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    });
  }

  private startFrameMonitoring() {
    if (this.monitoring) return;
    this.monitoring = true;

    const monitorFrame = (currentTime: number) => {
      const delta = currentTime - this.lastFrameTime;
      this.frameCount++;

      if (delta > 16.67) {
        this.frameDrops++;
      }

      if (delta > 16) {
        this.longFrames++;
      }

      this.lastFrameTime = currentTime;
      this.animationFrameId = requestAnimationFrame(monitorFrame);
    };

    this.animationFrameId = requestAnimationFrame(monitorFrame);
  }

  stopFrameMonitoring() {
    this.monitoring = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  recordCrash(report: CrashReport) {
    this.crashes.push(report);
    logger.error('Crash recorded', new Error(report.error), report);
  }

  recordSession(hadCrash = false) {
    this.sessions++;
    if (!hadCrash) {
      this.crashFreeSessions++;
    }
  }

  getCrashFreeRate(): number {
    if (this.sessions === 0) return 100;
    return (this.crashFreeSessions / this.sessions) * 100;
  }

  getMetrics(): PerformanceMetrics {
    const runtime = (Date.now() - this.startTime) / 1000;
    const fps = runtime > 0 ? this.frameCount / runtime : 60;

    let memoryUsage = 0;
    const perfWithMemory = performance as PerformanceWithMemory;
    if (perfWithMemory.memory) {
      memoryUsage = perfWithMemory.memory.usedJSHeapSize / 1048576;
    }

    return {
      coldStart:
        performance.timing?.domContentLoadedEventEnd - performance.timing?.navigationStart || 0,
      fps: Math.min(fps, 60),
      frameDrops: this.frameDrops,
      memoryUsage,
      longFrames: this.longFrames,
      avgResponseTime: 0,
    };
  }

  getCrashes(): CrashReport[] {
    return [...this.crashes];
  }

  reset() {
    this.frameCount = 0;
    this.frameDrops = 0;
    this.longFrames = 0;
    this.lastFrameTime = performance.now();
  }

  destroy() {
    this.stopFrameMonitoring();
  }
}

export const performanceMonitor = new PerformanceMonitor();

export const measurePerformance = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.debug('Performance measurement', { name, duration });
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(
      `Performance measurement failed: ${name}`,
      error instanceof Error ? error : new Error(String(error)),
      { duration }
    );
    throw error;
  }
};

export const trackPageLoad = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (perfData) {
        const metrics = {
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          request: perfData.responseStart - perfData.requestStart,
          response: perfData.responseEnd - perfData.responseStart,
          dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          load: perfData.loadEventEnd - perfData.loadEventStart,
          total: perfData.loadEventEnd - perfData.fetchStart,
        };

        logger.info('Page load metrics', metrics);
      }
    }, 0);
  });
};
