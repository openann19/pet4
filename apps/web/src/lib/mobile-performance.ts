/**
 * Mobile Performance Monitoring
 *
 * Tracks cold start time, FPS, memory usage, and crash-free sessions
 * for mobile app store readiness.
 */

import { createLogger } from './logger';

const logger = createLogger('mobile-performance');

export interface PerformanceMetrics {
  coldStartTime: number | null;
  averageFPS: number | null;
  frameTime95th: number | null;
  peakMemoryMB: number | null;
  crashFreeSessions: number;
  totalSessions: number;
  errorCount: number;
}

export interface PerformanceBudget {
  coldStartMaxMs: number;
  targetFPS: number;
  maxFrameTimeMs: number;
  maxMemoryMB: number;
  targetCrashFreeRate: number;
}

const DEFAULT_BUDGET: PerformanceBudget = {
  coldStartMaxMs: 3000,
  targetFPS: 60,
  maxFrameTimeMs: 16,
  maxMemoryMB: 500,
  targetCrashFreeRate: 0.995,
};

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    coldStartTime: null,
    averageFPS: null,
    frameTime95th: null,
    peakMemoryMB: null,
    crashFreeSessions: 0,
    totalSessions: 0,
    errorCount: 0,
  };

  private budget: PerformanceBudget = DEFAULT_BUDGET;
  private coldStartMark: number | null = null;
  private frameTimes: number[] = [];
  private fpsSamplingActive = false;
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private samplingStartTime = 0;
  private memoryBaseline: number | null = null;
  private unhandledErrorHandler: ((event: ErrorEvent) => void) | null = null;
  private unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Track cold start
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.coldStartMark = performance.now();

      // Mark DOMContentLoaded as end of cold start
      if (document.readyState === 'complete') {
        this.endColdStartTracking();
      } else {
        window.addEventListener('load', () => this.endColdStartTracking(), { once: true });
      }
    }

    // Initialize memory baseline
    this.updateMemoryBaseline();

    // Track crashes and errors
    this.setupErrorTracking();
  }

  private endColdStartTracking(): void {
    if (this.coldStartMark === null) {
      return;
    }

    const coldStartTime = performance.now() - this.coldStartMark;
    this.metrics.coldStartTime = Math.round(coldStartTime);
    this.coldStartMark = null;

    logger.info('Cold start completed', { timeMs: this.metrics.coldStartTime });

    // Persist to storage
    this.persistMetrics();
  }

  startFPSSampling(durationMs = 5000): void {
    if (this.fpsSamplingActive) {
      return;
    }

    this.fpsSamplingActive = true;
    this.frameTimes = [];
    this.frameCount = 0;
    this.samplingStartTime = performance.now();

    const sampleFrame = (currentTime: number): void => {
      if (!this.fpsSamplingActive) {
        return;
      }

      const frameTime = currentTime - this.lastFrameTime;
      this.frameTimes.push(frameTime);
      this.frameCount++;
      this.lastFrameTime = currentTime;

      const elapsed = currentTime - this.samplingStartTime;
      if (elapsed >= durationMs) {
        this.endFPSSampling();
        return;
      }

      requestAnimationFrame(sampleFrame);
    };

    this.lastFrameTime = performance.now();
    requestAnimationFrame(sampleFrame);
  }

  private endFPSSampling(): void {
    if (!this.fpsSamplingActive || this.frameTimes.length === 0) {
      return;
    }

    this.fpsSamplingActive = false;

    // Calculate average FPS
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.metrics.averageFPS = Math.round(1000 / avgFrameTime);

    // Calculate 95th percentile frame time
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const index95 = Math.floor(sorted.length * 0.95);
    this.metrics.frameTime95th = Math.round(sorted[index95] ?? 0);

    logger.info('FPS sampling completed', {
      averageFPS: this.metrics.averageFPS,
      frameTime95th: this.metrics.frameTime95th,
    });

    this.persistMetrics();
  }

  private updateMemoryBaseline(): void {
    const perfWithMemory = performance as { memory?: { usedJSHeapSize: number } };
    if (
      'memory' in performance &&
      perfWithMemory.memory &&
      'usedJSHeapSize' in perfWithMemory.memory
    ) {
      const memory = perfWithMemory.memory;
      const memoryMB = memory.usedJSHeapSize / (1024 * 1024);

      this.memoryBaseline ??= memoryMB;

      if (this.metrics.peakMemoryMB === null || memoryMB > this.metrics.peakMemoryMB) {
        this.metrics.peakMemoryMB = Math.round(memoryMB);
      }
    }
  }

  private setupErrorTracking(): void {
    // Track unhandled errors
    this.unhandledErrorHandler = (event: ErrorEvent): void => {
      this.metrics.errorCount++;
      this.metrics.totalSessions++;
      this.persistMetrics();
      logger.error('Unhandled error detected', new Error(event.message));
    };

    // Track unhandled promise rejections
    this.unhandledRejectionHandler = (event: PromiseRejectionEvent): void => {
      this.metrics.errorCount++;
      this.metrics.totalSessions++;
      this.persistMetrics();
      logger.error('Unhandled promise rejection', new Error(String(event.reason)));
    };

    window.addEventListener('error', this.unhandledErrorHandler);
    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);
  }

  recordSession(successful: boolean): void {
    this.metrics.totalSessions++;
    if (successful) {
      this.metrics.crashFreeSessions++;
    }
    this.persistMetrics();
  }

  private persistMetrics(): void {
    try {
      const key = 'pawfectmatch:performance:metrics';
      localStorage.setItem(key, JSON.stringify(this.metrics));
    } catch (_error) {
      logger.warn(
        'Failed to persist metrics',
        _error instanceof Error ? _error : new Error(String(_error))
      );
    }
  }

  loadMetrics(): PerformanceMetrics {
    try {
      const key = 'pawfectmatch:performance:metrics';
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PerformanceMetrics>;
        this.metrics = {
          ...this.metrics,
          ...parsed,
        };
      }
    } catch (_error) {
      logger.warn(
        'Failed to load metrics',
        _error instanceof Error ? _error : new Error(String(_error))
      );
    }

    return { ...this.metrics };
  }

  getMetrics(): PerformanceMetrics {
    this.updateMemoryBaseline();
    return { ...this.metrics };
  }

  getCrashFreeRate(): number {
    if (this.metrics.totalSessions === 0) {
      return 1.0;
    }
    return this.metrics.crashFreeSessions / this.metrics.totalSessions;
  }

  checkBudget(): { passed: boolean; violations: string[] } {
    const violations: string[] = [];

    if (
      this.metrics.coldStartTime !== null &&
      this.metrics.coldStartTime > this.budget.coldStartMaxMs
    ) {
      violations.push(
        `Cold start ${this.metrics.coldStartTime}ms exceeds budget ${this.budget.coldStartMaxMs}ms`
      );
    }

    if (this.metrics.averageFPS !== null && this.metrics.averageFPS < this.budget.targetFPS) {
      violations.push(
        `Average FPS ${this.metrics.averageFPS} below target ${this.budget.targetFPS}`
      );
    }

    if (
      this.metrics.frameTime95th !== null &&
      this.metrics.frameTime95th > this.budget.maxFrameTimeMs
    ) {
      violations.push(
        `95th percentile frame time ${this.metrics.frameTime95th}ms exceeds budget ${this.budget.maxFrameTimeMs}ms`
      );
    }

    if (this.metrics.peakMemoryMB !== null && this.metrics.peakMemoryMB > this.budget.maxMemoryMB) {
      violations.push(
        `Peak memory ${this.metrics.peakMemoryMB}MB exceeds budget ${this.budget.maxMemoryMB}MB`
      );
    }

    const crashFreeRate = this.getCrashFreeRate();
    if (crashFreeRate < this.budget.targetCrashFreeRate) {
      violations.push(
        `Crash-free rate ${(crashFreeRate * 100).toFixed(2)}% below target ${(this.budget.targetCrashFreeRate * 100).toFixed(1)}%`
      );
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  setBudget(budget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...budget };
  }

  generateReport(): string {
    const metrics = this.getMetrics();
    const crashFreeRate = this.getCrashFreeRate();
    const budgetCheck = this.checkBudget();

    return `
Performance Report
==================
Cold Start: ${metrics.coldStartTime != null ? `${metrics.coldStartTime}ms` : 'Not measured'}                                       
Average FPS: ${metrics.averageFPS != null ? String(metrics.averageFPS) : 'Not measured'}                                                                 
95th Percentile Frame Time: ${metrics.frameTime95th != null ? `${metrics.frameTime95th}ms` : 'Not measured'}                       
Peak Memory: ${metrics.peakMemoryMB != null ? `${metrics.peakMemoryMB}MB` : 'Not measured'}                                        
Crash-Free Rate: ${String((crashFreeRate * 100).toFixed(2))}% (${String(metrics.crashFreeSessions ?? '')}/${String(metrics.totalSessions ?? '')} sessions)
Errors: ${String(metrics.errorCount ?? '')}

Budget Status: ${budgetCheck.passed ? 'PASSED' : 'FAILED'}
${budgetCheck.violations.length > 0 ? budgetCheck.violations.map((v) => `  - ${v}`).join('\n') : '  No violations'}
`.trim();
  }

  reset(): void {
    this.metrics = {
      coldStartTime: null,
      averageFPS: null,
      frameTime95th: null,
      peakMemoryMB: null,
      crashFreeSessions: 0,
      totalSessions: 0,
      errorCount: 0,
    };
    this.persistMetrics();
  }

  destroy(): void {
    if (this.unhandledErrorHandler) {
      window.removeEventListener('error', this.unhandledErrorHandler);
    }
    if (this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
    }
    this.fpsSamplingActive = false;
  }
}

// Singleton instance
let monitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
    monitorInstance.loadMetrics();
  }
  return monitorInstance;
}

export function startPerformanceTracking(): void {
  const monitor = getPerformanceMonitor();
  monitor.startFPSSampling(10000); // Sample for 10 seconds
}
