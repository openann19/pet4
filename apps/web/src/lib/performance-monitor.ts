/**
 * Performance Monitor
 * Tracks performance metrics, frame rates, memory usage, and telemetry
 */

import { createLogger } from './logger';

const logger = createLogger('PerformanceMonitor');

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface PerformanceMetrics {
  readonly operation: string;
  readonly duration: number;
  readonly timestamp: number;
  readonly stage?: string;
  readonly memoryUsage?: number;
  readonly frameTime?: number;
  readonly workerTime?: number;
  readonly webglTime?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface FrameRateMetrics {
  readonly fps: number;
  readonly frameTime: number;
  readonly droppedFrames: number;
  readonly timestamp: number;
}

export interface MemoryMetrics {
  readonly used: number;
  readonly total: number;
  readonly percentage: number;
  readonly timestamp: number;
}

export interface PerformanceBudget {
  readonly maxDuration: number;
  readonly maxMemory: number;
  readonly maxFrameTime: number;
  readonly maxDroppedFrames: number;
}

// ============================================================================
// Performance Monitor Class
// ============================================================================

export class PerformanceMonitor {
  private readonly metrics: PerformanceMetrics[] = [];
  private readonly frameRateHistory: FrameRateMetrics[] = [];
  private readonly memoryHistory: MemoryMetrics[] = [];
  private readonly budgets = new Map<string, PerformanceBudget>();
  private frameCount = 0;
  private lastFrameTime = 0;
  private droppedFrames = 0;
  private frameTimeSum = 0;
  private readonly maxHistorySize = 1000;

  private frameRateTimer: number | null = null;
  private memoryTimer: number | null = null;
  private readonly frameRateInterval = 1000; // 1 second
  private readonly memoryInterval = 5000; // 5 seconds

  /**
   * Start monitoring frame rate
   */
  startFrameRateMonitoring(): void {
    if (this.frameRateTimer !== null) {
      return;
    }

    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.frameTimeSum = 0;

    const measureFrame = (): void => {
      const currentTime = performance.now();
      const frameTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;

      this.frameCount++;
      this.frameTimeSum += frameTime;

      // Check for dropped frames (frame time > 20ms at 60fps)
      if (frameTime > 20) {
        this.droppedFrames++;
      }

      // Calculate FPS every second
      if (this.frameCount >= 60) {
        const avgFrameTime = this.frameTimeSum / this.frameCount;
        const fps = 1000 / avgFrameTime;

        const metrics: FrameRateMetrics = {
          fps,
          frameTime: avgFrameTime,
          droppedFrames: this.droppedFrames,
          timestamp: currentTime,
        };

        this.frameRateHistory.push(metrics);
        if (this.frameRateHistory.length > this.maxHistorySize) {
          this.frameRateHistory.shift();
        }

        // Check budget
        this.checkFrameRateBudget(metrics);

        // Reset counters
        this.frameCount = 0;
        this.droppedFrames = 0;
        this.frameTimeSum = 0;
      }

      this.frameRateTimer = requestAnimationFrame(measureFrame);
    };

    this.frameRateTimer = requestAnimationFrame(measureFrame);
  }

  /**
   * Stop monitoring frame rate
   */
  stopFrameRateMonitoring(): void {
    if (this.frameRateTimer !== null) {
      cancelAnimationFrame(this.frameRateTimer);
      this.frameRateTimer = null;
    }
  }

  /**
   * Start monitoring memory usage
   */
  startMemoryMonitoring(): void {
    if (this.memoryTimer !== null) {
      return;
    }

    const measureMemory = (): void => {
      if ('memory' in performance) {
        const memory = (performance as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        if (memory) {
          const used = memory.usedJSHeapSize;
          const total = memory.jsHeapSizeLimit;
          const percentage = (used / total) * 100;

          const metrics: MemoryMetrics = {
            used,
            total,
            percentage,
            timestamp: Date.now(),
          };

          this.memoryHistory.push(metrics);
          if (this.memoryHistory.length > this.maxHistorySize) {
            this.memoryHistory.shift();
          }

          // Check budget
          this.checkMemoryBudget(metrics);
        }
      }

      this.memoryTimer = window.setTimeout(measureMemory, this.memoryInterval);
    };

    this.memoryTimer = window.setTimeout(measureMemory, this.memoryInterval);
  }

  /**
   * Stop monitoring memory usage
   */
  stopMemoryMonitoring(): void {
    if (this.memoryTimer !== null) {
      clearTimeout(this.memoryTimer);
      this.memoryTimer = null;
    }
  }

  /**
   * Record performance metrics for an operation
   */
  recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    if (this.metrics.length > this.maxHistorySize) {
      this.metrics.shift();
    }

    // Check budget
    this.checkPerformanceBudget(metrics);

    // Log warning if operation is slow
    if (metrics.duration > 1000) {
      logger.warn('Slow operation detected', {
        operation: metrics.operation,
        duration: metrics.duration,
        stage: metrics.stage,
      });
    }
  }

  /**
   * Measure operation duration
   */
  async measureOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.getCurrentMemoryUsage();

    try {
      const result = await fn();
      const endTime = performance.now();
      const endMemory = this.getCurrentMemoryUsage();
      const duration = endTime - startTime;
      const memoryUsage = endMemory !== null && startMemory !== null ? endMemory - startMemory : undefined;

      this.recordMetrics({
        operation,
        duration,
        timestamp: Date.now(),
        memoryUsage,
        metadata,
      });

      return result;
    } catch (_error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetrics({
        operation,
        duration,
        timestamp: Date.now(),
        stage: '_error',
        metadata: {
          ...metadata,
          _error: _error instanceof Error ? _error.message : String(_error),
        },
      });

      throw error;
    }
  }

  /**
   * Measure synchronous operation duration
   */
  measureOperationSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const startTime = performance.now();
    const startMemory = this.getCurrentMemoryUsage();

    try {
      const result = fn();
      const endTime = performance.now();
      const endMemory = this.getCurrentMemoryUsage();
      const duration = endTime - startTime;
      const memoryUsage = endMemory !== null && startMemory !== null ? endMemory - startMemory : undefined;

      this.recordMetrics({
        operation,
        duration,
        timestamp: Date.now(),
        memoryUsage,
        metadata,
      });

      return result;
    } catch (_error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetrics({
        operation,
        duration,
        timestamp: Date.now(),
        stage: '_error',
        metadata: {
          ...metadata,
          _error: _error instanceof Error ? _error.message : String(_error),
        },
      });

      throw error;
    }
  }

  /**
   * Set performance budget for an operation
   */
  setBudget(operation: string, budget: PerformanceBudget): void {
    this.budgets.set(operation, budget);
  }

  /**
   * Check performance budget
   */
  private checkPerformanceBudget(metrics: PerformanceMetrics): void {
    const budget = this.budgets.get(metrics.operation);
    if (!budget) {
      return;
    }

    if (metrics.duration > budget.maxDuration) {
      logger.warn('Performance budget exceeded', {
        operation: metrics.operation,
        duration: metrics.duration,
        maxDuration: budget.maxDuration,
      });
    }

    if (metrics.memoryUsage !== undefined && metrics.memoryUsage > budget.maxMemory) {
      logger.warn('Memory budget exceeded', {
        operation: metrics.operation,
        memoryUsage: metrics.memoryUsage,
        maxMemory: budget.maxMemory,
      });
    }
  }

  /**
   * Check frame rate budget
   */
  private checkFrameRateBudget(metrics: FrameRateMetrics): void {
    const budget = this.budgets.get('frame-rate');
    if (!budget) {
      return;
    }

    if (metrics.frameTime > budget.maxFrameTime) {
      logger.warn('Frame time budget exceeded', {
        frameTime: metrics.frameTime,
        maxFrameTime: budget.maxFrameTime,
      });
    }

    if (metrics.droppedFrames > budget.maxDroppedFrames) {
      logger.warn('Dropped frames budget exceeded', {
        droppedFrames: metrics.droppedFrames,
        maxDroppedFrames: budget.maxDroppedFrames,
      });
    }
  }

  /**
   * Check memory budget
   */
  private checkMemoryBudget(metrics: MemoryMetrics): void {
    const budget = this.budgets.get('memory');
    if (!budget) {
      return;
    }

    if (metrics.used > budget.maxMemory) {
      logger.warn('Memory budget exceeded', {
        used: metrics.used,
        maxMemory: budget.maxMemory,
      });
    }
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number | null {
    if ('memory' in performance) {
      const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
      return memory?.usedJSHeapSize ?? null;
    }
    return null;
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    readonly metrics: readonly PerformanceMetrics[];
    readonly frameRate: readonly FrameRateMetrics[];
    readonly memory: readonly MemoryMetrics[];
    readonly averageFrameRate: number;
    readonly averageMemoryUsage: number;
  } {
    const avgFrameRate =
      this.frameRateHistory.length > 0
        ? this.frameRateHistory.reduce((sum, m) => sum + m.fps, 0) / this.frameRateHistory.length
        : 0;

    const avgMemoryUsage =
      this.memoryHistory.length > 0
        ? this.memoryHistory.reduce((sum, m) => sum + m.used, 0) / this.memoryHistory.length
        : 0;

    return {
      metrics: [...this.metrics],
      frameRate: [...this.frameRateHistory],
      memory: [...this.memoryHistory],
      averageFrameRate: avgFrameRate,
      averageMemoryUsage: avgMemoryUsage,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.length = 0;
    this.frameRateHistory.length = 0;
    this.memoryHistory.length = 0;
    this.budgets.clear();
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopFrameRateMonitoring();
    this.stopMemoryMonitoring();
    this.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let monitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
}
