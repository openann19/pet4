/**
 * Performance Budget Monitor
 * Monitors and enforces performance budgets for bundle sizes and runtime metrics
 */

import type {
  PerformanceBudgetConfig,
  BundleBudget,
  LoadTimeBudget,
  RuntimeBudget,
} from './performance-budget.config';
import { DEFAULT_PERFORMANCE_BUDGET } from './performance-budget.config';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PerformanceBudget');

export interface BundleMetrics {
  initial: number; // KB (gzipped)
  total: number; // KB (gzipped)
  chunks: Record<string, number>; // chunk name -> size in KB (gzipped)
  vendors: Record<string, number>; // vendor name -> size in KB (gzipped)
}

export interface LoadTimeMetrics {
  fcp?: number; // First Contentful Paint in ms
  lcp?: number; // Largest Contentful Paint in ms
  tti?: number; // Time to Interactive in ms
  fid?: number; // First Input Delay in ms
  cls?: number; // Cumulative Layout Shift score
}

export interface RuntimeMetrics {
  fps?: number; // Current FPS
  frameTime?: number; // Average frame time in ms
  memory?: number; // Memory usage in MB
  jsExecutionTime?: number; // JS execution time per frame in ms
}

export interface BudgetViolation {
  category: 'bundle' | 'loadTime' | 'runtime';
  metric: string;
  actual: number;
  budget: number;
  severity: 'warning' | 'error';
  message: string;
}

export class PerformanceBudget {
  private config: PerformanceBudgetConfig;
  private violations: BudgetViolation[] = [];

  constructor(config?: PerformanceBudgetConfig) {
    this.config = config || DEFAULT_PERFORMANCE_BUDGET;
  }

  /**
   * Check bundle sizes against budget
   */
  checkBundles(metrics: BundleMetrics): BudgetViolation[] {
    const violations: BudgetViolation[] = [];
    const budget = this.config.bundles;

    // Check initial bundle
    if (metrics.initial > budget.initial) {
      violations.push({
        category: 'bundle',
        metric: 'initial',
        actual: metrics.initial,
        budget: budget.initial,
        severity: 'error',
        message: `Initial bundle size ${metrics.initial}KB exceeds budget of ${budget.initial}KB`,
      });
    }

    // Check total bundle
    if (metrics.total > budget.total) {
      violations.push({
        category: 'bundle',
        metric: 'total',
        actual: metrics.total,
        budget: budget.total,
        severity: 'error',
        message: `Total bundle size ${metrics.total}KB exceeds budget of ${budget.total}KB`,
      });
    }

    // Check individual chunks
    for (const [chunkName, size] of Object.entries(metrics.chunks)) {
      if (size > budget.chunk) {
        violations.push({
          category: 'bundle',
          metric: `chunk:${chunkName}`,
          actual: size,
          budget: budget.chunk,
          severity: 'warning',
          message: `Chunk "${chunkName}" size ${size}KB exceeds budget of ${budget.chunk}KB`,
        });
      }
    }

    // Check vendor chunks
    for (const [vendorName, size] of Object.entries(metrics.vendors)) {
      if (size > budget.vendor) {
        violations.push({
          category: 'bundle',
          metric: `vendor:${vendorName}`,
          actual: size,
          budget: budget.vendor,
          severity: 'warning',
          message: `Vendor chunk "${vendorName}" size ${size}KB exceeds budget of ${budget.vendor}KB`,
        });
      }
    }

    this.violations.push(...violations);
    return violations;
  }

  /**
   * Check load time metrics against budget
   */
  checkLoadTimes(metrics: LoadTimeMetrics): BudgetViolation[] {
    const violations: BudgetViolation[] = [];
    const budget = this.config.loadTimes;

    if (metrics.fcp !== undefined && metrics.fcp > budget.fcp) {
      violations.push({
        category: 'loadTime',
        metric: 'fcp',
        actual: metrics.fcp,
        budget: budget.fcp,
        severity: 'error',
        message: `First Contentful Paint ${metrics.fcp}ms exceeds budget of ${budget.fcp}ms`,
      });
    }

    if (metrics.lcp !== undefined && metrics.lcp > budget.lcp) {
      violations.push({
        category: 'loadTime',
        metric: 'lcp',
        actual: metrics.lcp,
        budget: budget.lcp,
        severity: 'error',
        message: `Largest Contentful Paint ${metrics.lcp}ms exceeds budget of ${budget.lcp}ms`,
      });
    }

    if (metrics.tti !== undefined && metrics.tti > budget.tti) {
      violations.push({
        category: 'loadTime',
        metric: 'tti',
        actual: metrics.tti,
        budget: budget.tti,
        severity: 'error',
        message: `Time to Interactive ${metrics.tti}ms exceeds budget of ${budget.tti}ms`,
      });
    }

    if (metrics.fid !== undefined && metrics.fid > budget.fid) {
      violations.push({
        category: 'loadTime',
        metric: 'fid',
        actual: metrics.fid,
        budget: budget.fid,
        severity: 'warning',
        message: `First Input Delay ${metrics.fid}ms exceeds budget of ${budget.fid}ms`,
      });
    }

    if (metrics.cls !== undefined && metrics.cls > budget.cls) {
      violations.push({
        category: 'loadTime',
        metric: 'cls',
        actual: metrics.cls,
        budget: budget.cls,
        severity: 'warning',
        message: `Cumulative Layout Shift ${metrics.cls} exceeds budget of ${budget.cls}`,
      });
    }

    this.violations.push(...violations);
    return violations;
  }

  /**
   * Check runtime metrics against budget
   */
  checkRuntime(metrics: RuntimeMetrics): BudgetViolation[] {
    const violations: BudgetViolation[] = [];
    const budget = this.config.runtime;

    if (metrics.fps !== undefined && metrics.fps < budget.fps) {
      violations.push({
        category: 'runtime',
        metric: 'fps',
        actual: metrics.fps,
        budget: budget.fps,
        severity: 'warning',
        message: `FPS ${metrics.fps} is below target of ${budget.fps}`,
      });
    }

    if (metrics.frameTime !== undefined && metrics.frameTime > budget.frameTime) {
      violations.push({
        category: 'runtime',
        metric: 'frameTime',
        actual: metrics.frameTime,
        budget: budget.frameTime,
        severity: 'warning',
        message: `Frame time ${metrics.frameTime}ms exceeds budget of ${budget.frameTime}ms`,
      });
    }

    if (metrics.memory !== undefined && metrics.memory > budget.memory) {
      violations.push({
        category: 'runtime',
        metric: 'memory',
        actual: metrics.memory,
        budget: budget.memory,
        severity: 'warning',
        message: `Memory usage ${metrics.memory}MB exceeds budget of ${budget.memory}MB`,
      });
    }

    if (metrics.jsExecutionTime !== undefined && metrics.jsExecutionTime > budget.jsExecutionTime) {
      violations.push({
        category: 'runtime',
        metric: 'jsExecutionTime',
        actual: metrics.jsExecutionTime,
        budget: budget.jsExecutionTime,
        severity: 'warning',
        message: `JS execution time ${metrics.jsExecutionTime}ms exceeds budget of ${budget.jsExecutionTime}ms`,
      });
    }

    this.violations.push(...violations);
    return violations;
  }

  /**
   * Get all violations
   */
  getViolations(): BudgetViolation[] {
    return [...this.violations];
  }

  /**
   * Get violations by severity
   */
  getViolationsBySeverity(severity: 'warning' | 'error'): BudgetViolation[] {
    return this.violations.filter((v) => v.severity === severity);
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.violations.some((v) => v.severity === 'error');
  }

  /**
   * Check if there are any warnings
   */
  hasWarnings(): boolean {
    return this.violations.some((v) => v.severity === 'warning');
  }

  /**
   * Clear all violations
   */
  clearViolations(): void {
    this.violations = [];
  }

  /**
   * Generate a report of all violations
   */
  generateReport(): string {
    if (this.violations.length === 0) {
      return '✅ All performance budgets met!';
    }

    const errors = this.getViolationsBySeverity('error');
    const warnings = this.getViolationsBySeverity('warning');

    let report = '\n📊 Performance Budget Report\n';
    report += '='.repeat(50) + '\n\n';

    if (errors.length > 0) {
      report += `❌ Errors (${errors.length}):\n`;
      errors.forEach((violation) => {
        report += `   • ${violation.message}\n`;
      });
      report += '\n';
    }

    if (warnings.length > 0) {
      report += `⚠️  Warnings (${warnings.length}):\n`;
      warnings.forEach((violation) => {
        report += `   • ${violation.message}\n`;
      });
      report += '\n';
    }

    return report;
  }

  /**
   * Log violations to console
   */
  logViolations(): void {
    if (this.violations.length === 0) {
      logger.info('All performance budgets met');
      return;
    }

    const errors = this.getViolationsBySeverity('error');
    const warnings = this.getViolationsBySeverity('warning');

    if (errors.length > 0) {
      logger.error(`Performance budget errors: ${errors.length}`);
      errors.forEach((violation) => {
        logger.error(violation.message);
      });
    }

    if (warnings.length > 0) {
      logger.warn(`Performance budget warnings: ${warnings.length}`);
      warnings.forEach((violation) => {
        logger.warn(violation.message);
      });
    }
  }
}

// Export singleton instance
export const performanceBudget = new PerformanceBudget();
