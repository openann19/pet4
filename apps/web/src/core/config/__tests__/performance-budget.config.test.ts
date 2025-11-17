/**
 * Performance Budget Config Runtime Tests
 *
 * Tests for performance-budget.config.ts runtime configuration and environment-based selection
 *
 * Note: import.meta.env.PROD is a Vite build-time constant and cannot be mocked at runtime.
 * Tests focus on what can be tested: VITE_PERFORMANCE_BUDGET_MODE selection logic.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DEFAULT_PERFORMANCE_BUDGET,
  STRICT_PERFORMANCE_BUDGET,
  LENIENT_PERFORMANCE_BUDGET,
  getPerformanceBudget,
} from '../performance-budget.config';
import type { PerformanceBudgetConfig } from '../performance-budget.config';

describe('Performance Budget Config Runtime Tests', () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear any stubbed env vars
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe('getPerformanceBudget() mode-based selection', () => {
    it('should return STRICT when mode=strict', async () => {
      vi.stubEnv('VITE_PERFORMANCE_BUDGET_MODE', 'strict');

      const configModule = await import('../performance-budget.config');
      const budget = configModule.getPerformanceBudget();

      expect(budget).toBeDefined();
      expect(budget.bundles.initial).toBe(STRICT_PERFORMANCE_BUDGET.bundles.initial);
      expect(budget.bundles.total).toBe(STRICT_PERFORMANCE_BUDGET.bundles.total);
      expect(budget.loadTimes.fcp).toBe(STRICT_PERFORMANCE_BUDGET.loadTimes.fcp);
      expect(budget.runtime.fps).toBe(STRICT_PERFORMANCE_BUDGET.runtime.fps);
      expect(budget.runtime.memory).toBe(STRICT_PERFORMANCE_BUDGET.runtime.memory);
    });

    it('should return LENIENT when mode=lenient', async () => {
      vi.stubEnv('VITE_PERFORMANCE_BUDGET_MODE', 'lenient');

      const configModule = await import('../performance-budget.config');
      const budget = configModule.getPerformanceBudget();

      expect(budget).toBeDefined();
      expect(budget.bundles.initial).toBe(LENIENT_PERFORMANCE_BUDGET.bundles.initial);
      expect(budget.bundles.total).toBe(LENIENT_PERFORMANCE_BUDGET.bundles.total);
      expect(budget.loadTimes.fcp).toBe(LENIENT_PERFORMANCE_BUDGET.loadTimes.fcp);
      expect(budget.runtime.fps).toBe(LENIENT_PERFORMANCE_BUDGET.runtime.fps);
      expect(budget.runtime.memory).toBe(LENIENT_PERFORMANCE_BUDGET.runtime.memory);
    });

    it('should return appropriate budget based on PROD and mode', async () => {
      // In test environment, PROD is set at build time and cannot be mocked
      // The function returns:
      // - STRICT if mode='strict'
      // - LENIENT if mode='lenient' OR !isProduction
      // - DEFAULT if mode='default' and isProduction
      const configModule = await import('../performance-budget.config');
      const budget = configModule.getPerformanceBudget();

      expect(budget).toBeDefined();
      expect(budget.bundles).toBeDefined();
      expect(budget.loadTimes).toBeDefined();
      expect(budget.runtime).toBeDefined();
      // Check that budget values are reasonable
      expect(budget.bundles.initial).toBeGreaterThan(0);
      expect(budget.runtime.fps).toBe(60);
      expect(budget.runtime.frameTime).toBe(16.67);
    });

    it('should handle default mode (no VITE_PERFORMANCE_BUDGET_MODE set)', async () => {
      // Don't set VITE_PERFORMANCE_BUDGET_MODE
      const configModule = await import('../performance-budget.config');
      const budget = configModule.getPerformanceBudget();

      expect(budget).toBeDefined();
      // Should return DEFAULT if PROD is true, or LENIENT if PROD is false
      // Since we can't mock PROD, we test that it returns a valid config
      expect(budget.bundles).toBeDefined();
      expect(budget.loadTimes).toBeDefined();
      expect(budget.runtime).toBeDefined();
      expect(budget.runtime.fps).toBe(60);
    });

    it('should prioritize strict mode over production check', async () => {
      vi.stubEnv('VITE_PERFORMANCE_BUDGET_MODE', 'strict');

      const configModule = await import('../performance-budget.config');
      const budget = configModule.getPerformanceBudget();

      expect(budget).toBeDefined();
      // Strict mode should always return STRICT, regardless of PROD
      expect(budget.bundles.initial).toBe(STRICT_PERFORMANCE_BUDGET.bundles.initial);
      expect(budget.runtime.memory).toBe(STRICT_PERFORMANCE_BUDGET.runtime.memory);
    });

    it('should prioritize lenient mode over production check', async () => {
      vi.stubEnv('VITE_PERFORMANCE_BUDGET_MODE', 'lenient');

      const configModule = await import('../performance-budget.config');
      const budget = configModule.getPerformanceBudget();

      expect(budget).toBeDefined();
      // Lenient mode should always return LENIENT, regardless of PROD
      expect(budget.bundles.initial).toBe(LENIENT_PERFORMANCE_BUDGET.bundles.initial);
      expect(budget.runtime.memory).toBe(LENIENT_PERFORMANCE_BUDGET.runtime.memory);
    });
  });

  describe('Config structure validation', () => {
    it('should have all required fields in DEFAULT config', () => {
      expect(DEFAULT_PERFORMANCE_BUDGET).toBeDefined();
      expect(DEFAULT_PERFORMANCE_BUDGET.bundles).toBeDefined();
      expect(DEFAULT_PERFORMANCE_BUDGET.loadTimes).toBeDefined();
      expect(DEFAULT_PERFORMANCE_BUDGET.runtime).toBeDefined();

      expect(DEFAULT_PERFORMANCE_BUDGET.bundles).toHaveProperty('initial');
      expect(DEFAULT_PERFORMANCE_BUDGET.bundles).toHaveProperty('total');
      expect(DEFAULT_PERFORMANCE_BUDGET.bundles).toHaveProperty('chunk');
      expect(DEFAULT_PERFORMANCE_BUDGET.bundles).toHaveProperty('vendor');

      expect(DEFAULT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('fcp');
      expect(DEFAULT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('lcp');
      expect(DEFAULT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('tti');
      expect(DEFAULT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('fid');
      expect(DEFAULT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('cls');

      expect(DEFAULT_PERFORMANCE_BUDGET.runtime).toHaveProperty('fps');
      expect(DEFAULT_PERFORMANCE_BUDGET.runtime).toHaveProperty('frameTime');
      expect(DEFAULT_PERFORMANCE_BUDGET.runtime).toHaveProperty('memory');
      expect(DEFAULT_PERFORMANCE_BUDGET.runtime).toHaveProperty('jsExecutionTime');
    });

    it('should have all required fields in STRICT config', () => {
      expect(STRICT_PERFORMANCE_BUDGET).toBeDefined();
      expect(STRICT_PERFORMANCE_BUDGET.bundles).toBeDefined();
      expect(STRICT_PERFORMANCE_BUDGET.loadTimes).toBeDefined();
      expect(STRICT_PERFORMANCE_BUDGET.runtime).toBeDefined();

      expect(STRICT_PERFORMANCE_BUDGET.bundles).toHaveProperty('initial');
      expect(STRICT_PERFORMANCE_BUDGET.bundles).toHaveProperty('total');
      expect(STRICT_PERFORMANCE_BUDGET.bundles).toHaveProperty('chunk');
      expect(STRICT_PERFORMANCE_BUDGET.bundles).toHaveProperty('vendor');

      expect(STRICT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('fcp');
      expect(STRICT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('lcp');
      expect(STRICT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('tti');
      expect(STRICT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('fid');
      expect(STRICT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('cls');

      expect(STRICT_PERFORMANCE_BUDGET.runtime).toHaveProperty('fps');
      expect(STRICT_PERFORMANCE_BUDGET.runtime).toHaveProperty('frameTime');
      expect(STRICT_PERFORMANCE_BUDGET.runtime).toHaveProperty('memory');
      expect(STRICT_PERFORMANCE_BUDGET.runtime).toHaveProperty('jsExecutionTime');
    });

    it('should have all required fields in LENIENT config', () => {
      expect(LENIENT_PERFORMANCE_BUDGET).toBeDefined();
      expect(LENIENT_PERFORMANCE_BUDGET.bundles).toBeDefined();
      expect(LENIENT_PERFORMANCE_BUDGET.loadTimes).toBeDefined();
      expect(LENIENT_PERFORMANCE_BUDGET.runtime).toBeDefined();

      expect(LENIENT_PERFORMANCE_BUDGET.bundles).toHaveProperty('initial');
      expect(LENIENT_PERFORMANCE_BUDGET.bundles).toHaveProperty('total');
      expect(LENIENT_PERFORMANCE_BUDGET.bundles).toHaveProperty('chunk');
      expect(LENIENT_PERFORMANCE_BUDGET.bundles).toHaveProperty('vendor');

      expect(LENIENT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('fcp');
      expect(LENIENT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('lcp');
      expect(LENIENT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('tti');
      expect(LENIENT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('fid');
      expect(LENIENT_PERFORMANCE_BUDGET.loadTimes).toHaveProperty('cls');

      expect(LENIENT_PERFORMANCE_BUDGET.runtime).toHaveProperty('fps');
      expect(LENIENT_PERFORMANCE_BUDGET.runtime).toHaveProperty('frameTime');
      expect(LENIENT_PERFORMANCE_BUDGET.runtime).toHaveProperty('memory');
      expect(LENIENT_PERFORMANCE_BUDGET.runtime).toHaveProperty('jsExecutionTime');
    });
  });

  describe('Budget value ranges validation', () => {
    it('should have STRICT budget values more restrictive than DEFAULT', () => {
      expect(STRICT_PERFORMANCE_BUDGET.bundles.initial).toBeLessThan(
        DEFAULT_PERFORMANCE_BUDGET.bundles.initial
      );
      expect(STRICT_PERFORMANCE_BUDGET.bundles.total).toBeLessThan(
        DEFAULT_PERFORMANCE_BUDGET.bundles.total
      );
      expect(STRICT_PERFORMANCE_BUDGET.loadTimes.fcp).toBeLessThan(
        DEFAULT_PERFORMANCE_BUDGET.loadTimes.fcp
      );
      expect(STRICT_PERFORMANCE_BUDGET.loadTimes.lcp).toBeLessThan(
        DEFAULT_PERFORMANCE_BUDGET.loadTimes.lcp
      );
      expect(STRICT_PERFORMANCE_BUDGET.runtime.memory).toBeLessThan(
        DEFAULT_PERFORMANCE_BUDGET.runtime.memory
      );
      expect(STRICT_PERFORMANCE_BUDGET.runtime.jsExecutionTime).toBeLessThan(
        DEFAULT_PERFORMANCE_BUDGET.runtime.jsExecutionTime
      );
    });

    it('should have LENIENT budget values more permissive than DEFAULT', () => {
      expect(LENIENT_PERFORMANCE_BUDGET.bundles.initial).toBeGreaterThan(
        DEFAULT_PERFORMANCE_BUDGET.bundles.initial
      );
      expect(LENIENT_PERFORMANCE_BUDGET.bundles.total).toBeGreaterThan(
        DEFAULT_PERFORMANCE_BUDGET.bundles.total
      );
      expect(LENIENT_PERFORMANCE_BUDGET.loadTimes.fcp).toBeGreaterThan(
        DEFAULT_PERFORMANCE_BUDGET.loadTimes.fcp
      );
      expect(LENIENT_PERFORMANCE_BUDGET.loadTimes.lcp).toBeGreaterThan(
        DEFAULT_PERFORMANCE_BUDGET.loadTimes.lcp
      );
      expect(LENIENT_PERFORMANCE_BUDGET.runtime.memory).toBeGreaterThan(
        DEFAULT_PERFORMANCE_BUDGET.runtime.memory
      );
      expect(LENIENT_PERFORMANCE_BUDGET.runtime.jsExecutionTime).toBeGreaterThan(
        DEFAULT_PERFORMANCE_BUDGET.runtime.jsExecutionTime
      );
    });

    it('should have all budget values as positive numbers', () => {
      const validateBudget = (budget: PerformanceBudgetConfig) => {
        expect(budget.bundles.initial).toBeGreaterThan(0);
        expect(budget.bundles.total).toBeGreaterThan(0);
        expect(budget.bundles.chunk).toBeGreaterThan(0);
        expect(budget.bundles.vendor).toBeGreaterThan(0);

        expect(budget.loadTimes.fcp).toBeGreaterThan(0);
        expect(budget.loadTimes.lcp).toBeGreaterThan(0);
        expect(budget.loadTimes.tti).toBeGreaterThan(0);
        expect(budget.loadTimes.fid).toBeGreaterThan(0);
        expect(budget.loadTimes.cls).toBeGreaterThanOrEqual(0);

        expect(budget.runtime.fps).toBeGreaterThan(0);
        expect(budget.runtime.frameTime).toBeGreaterThan(0);
        expect(budget.runtime.memory).toBeGreaterThan(0);
        expect(budget.runtime.jsExecutionTime).toBeGreaterThan(0);
      };

      validateBudget(DEFAULT_PERFORMANCE_BUDGET);
      validateBudget(STRICT_PERFORMANCE_BUDGET);
      validateBudget(LENIENT_PERFORMANCE_BUDGET);
    });

    it('should have FPS values consistent across all configs', () => {
      expect(DEFAULT_PERFORMANCE_BUDGET.runtime.fps).toBe(60);
      expect(STRICT_PERFORMANCE_BUDGET.runtime.fps).toBe(60);
      expect(LENIENT_PERFORMANCE_BUDGET.runtime.fps).toBe(60);
    });

    it('should have frameTime values consistent across all configs', () => {
      expect(DEFAULT_PERFORMANCE_BUDGET.runtime.frameTime).toBe(16.67);
      expect(STRICT_PERFORMANCE_BUDGET.runtime.frameTime).toBe(16.67);
      expect(LENIENT_PERFORMANCE_BUDGET.runtime.frameTime).toBe(16.67);
    });
  });

  describe('getPerformanceBudget() return value validation', () => {
    it('should return a PerformanceBudgetConfig object', () => {
      const budget = getPerformanceBudget();

      expect(budget).toBeDefined();
      expect(typeof budget).toBe('object');
      expect(budget).toHaveProperty('bundles');
      expect(budget).toHaveProperty('loadTimes');
      expect(budget).toHaveProperty('runtime');
    });

    it('should return consistent values for same environment', () => {
      const budget1 = getPerformanceBudget();
      const budget2 = getPerformanceBudget();

      // Should return same config values for same environment
      expect(budget1.bundles.initial).toBe(budget2.bundles.initial);
      expect(budget1.loadTimes.fcp).toBe(budget2.loadTimes.fcp);
      expect(budget1.runtime.fps).toBe(budget2.runtime.fps);
      expect(budget1.runtime.memory).toBe(budget2.runtime.memory);
    });

    it('should return valid PerformanceBudgetConfig structure', () => {
      const budget = getPerformanceBudget();

      expect(budget.bundles).toBeDefined();
      expect(budget.loadTimes).toBeDefined();
      expect(budget.runtime).toBeDefined();
      expect(budget.bundles.initial).toBeGreaterThan(0);
      expect(budget.loadTimes.fcp).toBeGreaterThan(0);
      expect(budget.runtime.fps).toBeGreaterThan(0);
    });
  });
});
