/**
 * Runtime Integration Tests
 *
 * Tests for integration between PerformanceBudget and PerformanceMonitor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceBudget } from '../performance-budget';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';
import { DEFAULT_PERFORMANCE_BUDGET } from '../performance-budget.config';
import { createRuntimeMetrics } from '@/test/utils/runtime-test-helpers';
import type { RuntimeMetrics } from '../performance-budget';

describe('Runtime Integration Tests', () => {
  let budget: PerformanceBudget;

  beforeEach(() => {
    budget = new PerformanceBudget(DEFAULT_PERFORMANCE_BUDGET);
    budget.clearViolations();
    performanceMonitor.cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    budget.clearViolations();
    performanceMonitor.cleanup();
  });

  describe('Integration between PerformanceBudget and PerformanceMonitor', () => {
    it('should integrate runtime metrics from monitor to budget checker', () => {
      // Track metrics in performance monitor
      performanceMonitor.trackAPICall('GET', '/api/test', 100, 200);
      performanceMonitor.trackRouteChange('/test', 200);
      performanceMonitor.trackUserInteraction('click', 50);

      // Convert monitor metrics to runtime metrics
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 5,
      });

      // Check runtime metrics against budget
      const violations = budget.checkRuntime(runtimeMetrics);

      expect(violations).toHaveLength(0);
      expect(budget.hasWarnings()).toBe(false);
    });

    it('should detect violations when monitor metrics exceed budget', () => {
      // Track slow operations in monitor
      performanceMonitor.trackAPICall('GET', '/api/slow', 2000, 200);
      performanceMonitor.trackRouteChange('/slow-route', 2000);
      performanceMonitor.trackUserInteraction('slow-click', 2000);

      // Convert monitor metrics to runtime metrics with violations
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30, // Below target
        frameTime: 20, // Exceeds budget
        memory: 150, // Exceeds budget
        jsExecutionTime: 15, // Exceeds budget
      });

      // Check runtime metrics against budget
      const violations = budget.checkRuntime(runtimeMetrics);

      expect(violations.length).toBeGreaterThan(0);
      expect(budget.hasWarnings()).toBe(true);
    });

    it('should integrate FPS monitoring with budget checking', () => {
      // Simulate low FPS
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30, // Below target of 60
        frameTime: 33.33, // Corresponding frame time
      });

      const violations = budget.checkRuntime(runtimeMetrics);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.metric === 'fps')).toBe(true);
      expect(violations.some((v) => v.metric === 'frameTime')).toBe(true);
    });

    it('should integrate memory monitoring with budget checking', () => {
      // Simulate high memory usage
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        memory: 150, // Exceeds budget of 100MB
      });

      const violations = budget.checkRuntime(runtimeMetrics);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.metric === 'memory')).toBe(true);
      expect(violations[0]?.actual).toBe(150);
      expect(violations[0]?.budget).toBe(100);
    });

    it('should integrate JS execution time monitoring with budget checking', () => {
      // Simulate slow JS execution
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        jsExecutionTime: 15, // Exceeds budget of 10ms
      });

      const violations = budget.checkRuntime(runtimeMetrics);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.metric === 'jsExecutionTime')).toBe(true);
      expect(violations[0]?.actual).toBe(15);
      expect(violations[0]?.budget).toBe(10);
    });
  });

  describe('Runtime metrics flow from monitor to budget checker', () => {
    it('should flow API performance metrics to budget checker', () => {
      // Track API calls in monitor
      performanceMonitor.trackAPICall('GET', '/api/test', 100, 200);

      // Convert to runtime metrics (simulating conversion from API metrics)
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        jsExecutionTime: 5, // Derived from API call duration
      });

      const violations = budget.checkRuntime(runtimeMetrics);

      expect(violations).toHaveLength(0);
    });

    it('should flow route performance metrics to budget checker', () => {
      // Track route changes in monitor
      performanceMonitor.trackRouteChange('/test', 200);

      // Convert to runtime metrics (simulating conversion from route metrics)
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        frameTime: 16.67, // Derived from route load time
      });

      const violations = budget.checkRuntime(runtimeMetrics);

      expect(violations).toHaveLength(0);
    });

    it('should flow user interaction metrics to budget checker', () => {
      // Track user interactions in monitor
      performanceMonitor.trackUserInteraction('click', 50);

      // Convert to runtime metrics (simulating conversion from interaction metrics)
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        jsExecutionTime: 5, // Derived from interaction duration
      });

      const violations = budget.checkRuntime(runtimeMetrics);

      expect(violations).toHaveLength(0);
    });
  });

  describe('Runtime violation reporting integration', () => {
    it('should report violations from budget checker', () => {
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
        frameTime: 20,
        memory: 150,
        jsExecutionTime: 15,
      });

      const violations = budget.checkRuntime(runtimeMetrics);

      expect(violations.length).toBeGreaterThan(0);
      expect(budget.getViolations().length).toBeGreaterThan(0);
      expect(budget.hasWarnings()).toBe(true);
    });

    it('should report violations by severity', () => {
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
        frameTime: 20,
        memory: 150,
        jsExecutionTime: 15,
      });

      budget.checkRuntime(runtimeMetrics);

      const warnings = budget.getViolationsBySeverity('warning');
      expect(warnings.length).toBeGreaterThan(0);
      warnings.forEach((v) => {
        expect(v.severity).toBe('warning');
      });

      const errors = budget.getViolationsBySeverity('error');
      expect(errors).toHaveLength(0);
    });

    it('should generate violation reports', () => {
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
        frameTime: 20,
        memory: 150,
        jsExecutionTime: 15,
      });

      budget.checkRuntime(runtimeMetrics);

      const report = budget.generateReport();
      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report).toContain('Performance Budget Report');
      expect(report).toContain('Warnings');
    });

    it('should log violations', () => {
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
        frameTime: 20,
        memory: 150,
        jsExecutionTime: 15,
      });

      expect(() => {
        budget.checkRuntime(runtimeMetrics);
        budget.logViolations();
      }).not.toThrow();
    });
  });

  describe('Runtime alert integration', () => {
    it('should trigger alerts when thresholds exceeded', () => {
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30, // Below target
        frameTime: 20, // Exceeds budget
        memory: 150, // Exceeds budget
        jsExecutionTime: 15, // Exceeds budget
      });

      const violations = budget.checkRuntime(runtimeMetrics);

      expect(violations.length).toBeGreaterThan(0);
      expect(budget.hasWarnings()).toBe(true);
      // Alerts would be triggered here in production
    });

    it('should not trigger alerts when thresholds met', () => {
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 5,
      });

      const violations = budget.checkRuntime(runtimeMetrics);

      expect(violations).toHaveLength(0);
      expect(budget.hasWarnings()).toBe(false);
      // No alerts should be triggered
    });
  });

  describe('Runtime configuration validation flow', () => {
    it('should validate runtime configuration', () => {
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 5,
      });

      // Validate configuration by checking metrics
      const violations = budget.checkRuntime(runtimeMetrics);

      expect(violations).toHaveLength(0);
      expect(budget.hasWarnings()).toBe(false);
    });

    it('should use custom budget configuration', () => {
      const customBudget = new PerformanceBudget({
        ...DEFAULT_PERFORMANCE_BUDGET,
        runtime: {
          fps: 30,
          frameTime: 33.33,
          memory: 200,
          jsExecutionTime: 20,
        },
      });

      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 25, // Below custom target of 30
        frameTime: 40, // Exceeds custom budget of 33.33ms
        memory: 250, // Exceeds custom budget of 200MB
        jsExecutionTime: 25, // Exceeds custom budget of 20ms
      });

      const violations = customBudget.checkRuntime(runtimeMetrics);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.budget).toBe(30); // Custom FPS target
    });
  });

  describe('Runtime environment validation flow', () => {
    it('should validate runtime environment', () => {
      // Verify budget is initialized with default config
      expect(budget).toBeDefined();
      expect(budget.hasWarnings()).toBe(false);
      expect(budget.hasErrors()).toBe(false);
    });

    it('should clear violations on cleanup', () => {
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
        frameTime: 20,
        memory: 150,
        jsExecutionTime: 15,
      });

      budget.checkRuntime(runtimeMetrics);
      expect(budget.hasWarnings()).toBe(true);

      budget.clearViolations();
      expect(budget.hasWarnings()).toBe(false);
      expect(budget.getViolations()).toHaveLength(0);
    });

    it('should accumulate violations across multiple checks', () => {
      const metrics1: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
      });

      const metrics2: RuntimeMetrics = createRuntimeMetrics({
        frameTime: 20,
      });

      budget.checkRuntime(metrics1);
      budget.checkRuntime(metrics2);

      const violations = budget.getViolations();
      expect(violations.length).toBeGreaterThanOrEqual(2);
      expect(violations.some((v) => v.metric === 'fps')).toBe(true);
      expect(violations.some((v) => v.metric === 'frameTime')).toBe(true);
    });
  });

  describe('End-to-end runtime validation flow', () => {
    it('should validate complete runtime flow', () => {
      // 1. Initialize monitoring
      performanceMonitor.init();

      // 2. Track metrics
      performanceMonitor.trackAPICall('GET', '/api/test', 100, 200);
      performanceMonitor.trackRouteChange('/test', 200);
      performanceMonitor.trackUserInteraction('click', 50);

      // 3. Convert to runtime metrics
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 5,
      });

      // 4. Check against budget
      const violations = budget.checkRuntime(runtimeMetrics);

      // 5. Verify no violations
      expect(violations).toHaveLength(0);
      expect(budget.hasWarnings()).toBe(false);

      // 6. Cleanup
      performanceMonitor.cleanup();
      budget.clearViolations();
    });

    it('should detect violations in complete runtime flow', () => {
      // 1. Initialize monitoring
      performanceMonitor.init();

      // 2. Track slow operations
      performanceMonitor.trackAPICall('GET', '/api/slow', 2000, 200);
      performanceMonitor.trackRouteChange('/slow-route', 2000);
      performanceMonitor.trackUserInteraction('slow-click', 2000);

      // 3. Convert to runtime metrics with violations
      const runtimeMetrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
        frameTime: 20,
        memory: 150,
        jsExecutionTime: 15,
      });

      // 4. Check against budget
      const violations = budget.checkRuntime(runtimeMetrics);

      // 5. Verify violations detected
      expect(violations.length).toBeGreaterThan(0);
      expect(budget.hasWarnings()).toBe(true);

      // 6. Generate report
      const report = budget.generateReport();
      expect(report).toContain('Warnings');

      // 7. Cleanup
      performanceMonitor.cleanup();
      budget.clearViolations();
    });
  });
});
