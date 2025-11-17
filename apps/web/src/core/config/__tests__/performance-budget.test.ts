/**
 * PerformanceBudget Runtime Tests
 *
 * Tests for PerformanceBudget.checkRuntime() method and runtime metrics validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceBudget } from '../performance-budget';
import type { RuntimeMetrics } from '../performance-budget';
import { DEFAULT_PERFORMANCE_BUDGET } from '../performance-budget.config';
import { createRuntimeMetrics, createTestPerformanceBudgetConfig } from '@/test/utils/runtime-test-helpers';

describe('PerformanceBudget Runtime Tests', () => {
  let budget: PerformanceBudget;

  beforeEach(() => {
    budget = new PerformanceBudget(DEFAULT_PERFORMANCE_BUDGET);
    budget.clearViolations();
  });

  describe('checkRuntime() with valid metrics', () => {
    it('should return no violations when all metrics are within budget', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 5,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(0);
      expect(budget.hasWarnings()).toBe(false);
      expect(budget.hasErrors()).toBe(false);
    });

    it('should handle undefined optional metrics', () => {
      const metrics: RuntimeMetrics = {
        fps: undefined,
        frameTime: undefined,
        memory: undefined,
        jsExecutionTime: undefined,
      };

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(0);
      expect(budget.hasWarnings()).toBe(false);
    });

    it('should handle partial metrics', () => {
      const metrics: RuntimeMetrics = {
        fps: 60,
        frameTime: undefined,
        memory: 50,
        jsExecutionTime: undefined,
      };

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(0);
      expect(budget.hasWarnings()).toBe(false);
    });
  });

  describe('checkRuntime() with FPS violations', () => {
    it('should detect FPS below target', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30, // Below target of 60
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 5,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.category).toBe('runtime');
      expect(violations[0]?.metric).toBe('fps');
      expect(violations[0]?.actual).toBe(30);
      expect(violations[0]?.budget).toBe(60);
      expect(violations[0]?.severity).toBe('warning');
      expect(violations[0]?.message).toContain('FPS 30 is below target of 60');
      expect(budget.hasWarnings()).toBe(true);
    });

    it('should detect FPS at boundary (just below target)', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 59, // Just below target of 60
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 5,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.metric).toBe('fps');
      expect(violations[0]?.actual).toBe(59);
      expect(budget.hasWarnings()).toBe(true);
    });

    it('should not detect FPS at target', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60, // At target
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 5,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(0);
      expect(budget.hasWarnings()).toBe(false);
    });

    it('should not detect FPS above target', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 120, // Above target
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 5,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(0);
      expect(budget.hasWarnings()).toBe(false);
    });
  });

  describe('checkRuntime() with frame time violations', () => {
    it('should detect frame time exceeding budget', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 20, // Exceeds budget of 16.67ms
        memory: 50,
        jsExecutionTime: 5,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.category).toBe('runtime');
      expect(violations[0]?.metric).toBe('frameTime');
      expect(violations[0]?.actual).toBe(20);
      expect(violations[0]?.budget).toBe(16.67);
      expect(violations[0]?.severity).toBe('warning');
      expect(violations[0]?.message).toContain('Frame time 20ms exceeds budget of 16.67ms');
      expect(budget.hasWarnings()).toBe(true);
    });

    it('should detect frame time at boundary (just exceeding budget)', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.68, // Just exceeding budget
        memory: 50,
        jsExecutionTime: 5,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.metric).toBe('frameTime');
      expect(violations[0]?.actual).toBe(16.68);
      expect(budget.hasWarnings()).toBe(true);
    });

    it('should not detect frame time within budget', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.67, // Within budget
        memory: 50,
        jsExecutionTime: 5,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(0);
      expect(budget.hasWarnings()).toBe(false);
    });
  });

  describe('checkRuntime() with memory violations', () => {
    it('should detect memory usage exceeding budget', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.67,
        memory: 150, // Exceeds budget of 100MB
        jsExecutionTime: 5,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.category).toBe('runtime');
      expect(violations[0]?.metric).toBe('memory');
      expect(violations[0]?.actual).toBe(150);
      expect(violations[0]?.budget).toBe(100);
      expect(violations[0]?.severity).toBe('warning');
      expect(violations[0]?.message).toContain('Memory usage 150MB exceeds budget of 100MB');
      expect(budget.hasWarnings()).toBe(true);
    });

    it('should detect memory at boundary (just exceeding budget)', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.67,
        memory: 100.1, // Just exceeding budget
        jsExecutionTime: 5,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.metric).toBe('memory');
      expect(violations[0]?.actual).toBe(100.1);
      expect(budget.hasWarnings()).toBe(true);
    });

    it('should not detect memory within budget', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.67,
        memory: 100, // Within budget
        jsExecutionTime: 5,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(0);
      expect(budget.hasWarnings()).toBe(false);
    });
  });

  describe('checkRuntime() with JS execution time violations', () => {
    it('should detect JS execution time exceeding budget', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 15, // Exceeds budget of 10ms
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.category).toBe('runtime');
      expect(violations[0]?.metric).toBe('jsExecutionTime');
      expect(violations[0]?.actual).toBe(15);
      expect(violations[0]?.budget).toBe(10);
      expect(violations[0]?.severity).toBe('warning');
      expect(violations[0]?.message).toContain('JS execution time 15ms exceeds budget of 10ms');
      expect(budget.hasWarnings()).toBe(true);
    });

    it('should detect JS execution time at boundary (just exceeding budget)', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 10.1, // Just exceeding budget
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.metric).toBe('jsExecutionTime');
      expect(violations[0]?.actual).toBe(10.1);
      expect(budget.hasWarnings()).toBe(true);
    });

    it('should not detect JS execution time within budget', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 10, // Within budget
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(0);
      expect(budget.hasWarnings()).toBe(false);
    });
  });

  describe('checkRuntime() with multiple violations', () => {
    it('should detect multiple violations', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30, // Below target
        frameTime: 20, // Exceeds budget
        memory: 150, // Exceeds budget
        jsExecutionTime: 15, // Exceeds budget
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations).toHaveLength(4);
      expect(violations.some((v) => v.metric === 'fps')).toBe(true);
      expect(violations.some((v) => v.metric === 'frameTime')).toBe(true);
      expect(violations.some((v) => v.metric === 'memory')).toBe(true);
      expect(violations.some((v) => v.metric === 'jsExecutionTime')).toBe(true);
      expect(budget.hasWarnings()).toBe(true);
      expect(budget.getViolations()).toHaveLength(4);
    });

    it('should accumulate violations across multiple calls', () => {
      const metrics1: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
        frameTime: 16.67,
        memory: 50,
        jsExecutionTime: 5,
      });

      const metrics2: RuntimeMetrics = createRuntimeMetrics({
        fps: 60,
        frameTime: 20,
        memory: 50,
        jsExecutionTime: 5,
      });

      budget.checkRuntime(metrics1);
      budget.checkRuntime(metrics2);

      const violations = budget.getViolations();
      expect(violations.length).toBeGreaterThanOrEqual(2);
      expect(violations.some((v) => v.metric === 'fps')).toBe(true);
      expect(violations.some((v) => v.metric === 'frameTime')).toBe(true);
    });
  });

  describe('checkRuntime() violation severity levels', () => {
    it('should mark all runtime violations as warnings', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
        frameTime: 20,
        memory: 150,
        jsExecutionTime: 15,
      });

      const violations = budget.checkRuntime(metrics);

      violations.forEach((violation) => {
        expect(violation.severity).toBe('warning');
        expect(violation.category).toBe('runtime');
      });
    });

    it('should not have errors for runtime violations', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
        frameTime: 20,
        memory: 150,
        jsExecutionTime: 15,
      });

      budget.checkRuntime(metrics);

      expect(budget.hasErrors()).toBe(false);
      expect(budget.hasWarnings()).toBe(true);
    });
  });

  describe('checkRuntime() violation message formatting', () => {
    it('should format FPS violation message correctly', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations[0]?.message).toBe('FPS 30 is below target of 60');
    });

    it('should format frame time violation message correctly', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        frameTime: 20,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations[0]?.message).toBe('Frame time 20ms exceeds budget of 16.67ms');
    });

    it('should format memory violation message correctly', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        memory: 150,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations[0]?.message).toBe('Memory usage 150MB exceeds budget of 100MB');
    });

    it('should format JS execution time violation message correctly', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        jsExecutionTime: 15,
      });

      const violations = budget.checkRuntime(metrics);

      expect(violations[0]?.message).toBe('JS execution time 15ms exceeds budget of 10ms');
    });
  });

  describe('checkRuntime() integration with getViolations()', () => {
    it('should return violations from getViolations()', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
        frameTime: 20,
      });

      budget.checkRuntime(metrics);

      const violations = budget.getViolations();
      expect(violations.length).toBeGreaterThanOrEqual(2);
      expect(violations.some((v) => v.metric === 'fps')).toBe(true);
      expect(violations.some((v) => v.metric === 'frameTime')).toBe(true);
    });

    it('should return violations by severity', () => {
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 30,
        frameTime: 20,
        memory: 150,
        jsExecutionTime: 15,
      });

      budget.checkRuntime(metrics);

      const warnings = budget.getViolationsBySeverity('warning');
      expect(warnings.length).toBeGreaterThanOrEqual(4);
      warnings.forEach((v) => {
        expect(v.severity).toBe('warning');
      });

      const errors = budget.getViolationsBySeverity('error');
      expect(errors).toHaveLength(0);
    });
  });

  describe('checkRuntime() with custom budget config', () => {
    it('should use custom budget config', () => {
      const customConfig = createTestPerformanceBudgetConfig({
        runtime: {
          fps: 30,
          frameTime: 33.33,
          memory: 200,
          jsExecutionTime: 20,
        },
      });

      const customBudget = new PerformanceBudget(customConfig);
      const metrics: RuntimeMetrics = createRuntimeMetrics({
        fps: 25, // Below custom target of 30
        frameTime: 40, // Exceeds custom budget of 33.33ms
        memory: 250, // Exceeds custom budget of 200MB
        jsExecutionTime: 25, // Exceeds custom budget of 20ms
      });

      const violations = customBudget.checkRuntime(metrics);

      expect(violations).toHaveLength(4);
      expect(violations[0]?.budget).toBe(30); // Custom FPS target
      expect(violations[1]?.budget).toBe(33.33); // Custom frame time budget
      expect(violations[2]?.budget).toBe(200); // Custom memory budget
      expect(violations[3]?.budget).toBe(20); // Custom JS execution time budget
    });
  });
});
