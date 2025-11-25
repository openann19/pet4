/**
 * Performance Budget Configuration
 * Defines acceptable limits for bundle sizes, load times, and runtime metrics
 */

export interface BundleBudget {
  /** Maximum initial bundle size in KB (gzipped) */
  initial: number;
  /** Maximum total bundle size in KB (gzipped) */
  total: number;
  /** Maximum size for individual chunks in KB (gzipped) */
  chunk: number;
  /** Maximum size for vendor chunks in KB (gzipped) */
  vendor: number;
}

export interface LoadTimeBudget {
  /** First Contentful Paint - maximum time in ms */
  fcp: number;
  /** Largest Contentful Paint - maximum time in ms */
  lcp: number;
  /** Time to Interactive - maximum time in ms */
  tti: number;
  /** First Input Delay - maximum time in ms */
  fid: number;
  /** Cumulative Layout Shift - maximum score */
  cls: number;
}

export interface RuntimeBudget {
  /** Target FPS for animations */
  fps: number;
  /** Maximum frame time in ms (1000/fps) */
  frameTime: number;
  /** Maximum memory usage in MB */
  memory: number;
  /** Maximum JavaScript execution time per frame in ms */
  jsExecutionTime: number;
}

export interface PerformanceBudgetConfig {
  bundles: BundleBudget;
  loadTimes: LoadTimeBudget;
  runtime: RuntimeBudget;
}

/**
 * Default performance budget configuration
 * Based on web performance best practices and modern device capabilities
 */
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudgetConfig = {
  bundles: {
    initial: 200, // 200 KB initial bundle (gzipped)
    total: 1000, // 1 MB total bundle (gzipped)
    chunk: 300, // 300 KB per chunk (gzipped)
    vendor: 500, // 500 KB vendor chunks (gzipped)
  },
  loadTimes: {
    fcp: 1800, // 1.8s First Contentful Paint
    lcp: 2500, // 2.5s Largest Contentful Paint
    tti: 3800, // 3.8s Time to Interactive
    fid: 100, // 100ms First Input Delay
    cls: 0.1, // 0.1 Cumulative Layout Shift
  },
  runtime: {
    fps: 60, // 60 FPS target
    frameTime: 16.67, // ~16.67ms per frame (1000/60)
    memory: 100, // 100 MB max memory
    jsExecutionTime: 10, // 10ms max JS execution per frame
  },
};

/**
 * Strict performance budget for production
 * More aggressive limits for high-performance requirements
 */
export const STRICT_PERFORMANCE_BUDGET: PerformanceBudgetConfig = {
  bundles: {
    initial: 150, // 150 KB initial bundle (gzipped)
    total: 800, // 800 KB total bundle (gzipped)
    chunk: 250, // 250 KB per chunk (gzipped)
    vendor: 400, // 400 KB vendor chunks (gzipped)
  },
  loadTimes: {
    fcp: 1500, // 1.5s First Contentful Paint
    lcp: 2000, // 2.0s Largest Contentful Paint
    tti: 3000, // 3.0s Time to Interactive
    fid: 50, // 50ms First Input Delay
    cls: 0.05, // 0.05 Cumulative Layout Shift
  },
  runtime: {
    fps: 60,
    frameTime: 16.67,
    memory: 80, // 80 MB max memory
    jsExecutionTime: 8, // 8ms max JS execution per frame
  },
};

/**
 * Lenient performance budget for development
 * More forgiving limits during development
 */
export const LENIENT_PERFORMANCE_BUDGET: PerformanceBudgetConfig = {
  bundles: {
    initial: 300, // 300 KB initial bundle (gzipped)
    total: 1500, // 1.5 MB total bundle (gzipped)
    chunk: 400, // 400 KB per chunk (gzipped)
    vendor: 600, // 600 KB vendor chunks (gzipped)
  },
  loadTimes: {
    fcp: 2500, // 2.5s First Contentful Paint
    lcp: 3500, // 3.5s Largest Contentful Paint
    tti: 5000, // 5.0s Time to Interactive
    fid: 200, // 200ms First Input Delay
    cls: 0.2, // 0.2 Cumulative Layout Shift
  },
  runtime: {
    fps: 60,
    frameTime: 16.67,
    memory: 150, // 150 MB max memory
    jsExecutionTime: 15, // 15ms max JS execution per frame
  },
};

/**
 * Get performance budget based on environment
 */
export function getPerformanceBudget(): PerformanceBudgetConfig {
  const isProduction = import.meta.env.PROD;
  const budgetMode =
    (import.meta.env.VITE_PERFORMANCE_BUDGET_MODE as string | undefined) ?? 'default';

  if (budgetMode === 'strict') {
    return STRICT_PERFORMANCE_BUDGET;
  }

  if (budgetMode === 'lenient' || !isProduction) {
    return LENIENT_PERFORMANCE_BUDGET;
  }

  return DEFAULT_PERFORMANCE_BUDGET;
}
