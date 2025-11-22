/**
 * Tests for gesture utilities
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateVelocity,
  calculateMagnitude,
  checkThreshold,
  checkVelocityThreshold,
  getPlatformGestureConfig,
  clamp,
  interpolateGesture,
  debounce,
} from '../gesture-utils';

describe('gesture-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateVelocity', () => {
    it('should calculate velocity correctly', () => {
      const result = calculateVelocity(100, 50, 1000);

      expect(result.velocityX).toBe(0.1);
      expect(result.velocityY).toBe(0.05);
    });

    it('should return zero velocity when timeDelta is zero', () => {
      const result = calculateVelocity(100, 50, 0);

      expect(result.velocityX).toBe(0);
      expect(result.velocityY).toBe(0);
    });

    it('should handle negative translations', () => {
      const result = calculateVelocity(-100, -50, 1000);

      expect(result.velocityX).toBe(-0.1);
      expect(result.velocityY).toBe(-0.05);
    });
  });

  describe('calculateMagnitude', () => {
    it('should calculate magnitude correctly', () => {
      expect(calculateMagnitude(3, 4)).toBe(5);
      expect(calculateMagnitude(0, 0)).toBe(0);
      expect(calculateMagnitude(-3, -4)).toBe(5);
    });
  });

  describe('checkThreshold', () => {
    it('should return true when value exceeds positive threshold', () => {
      expect(checkThreshold(10, 5, 'positive')).toBe(true);
      expect(checkThreshold(5, 5, 'positive')).toBe(true);
      expect(checkThreshold(4, 5, 'positive')).toBe(false);
    });

    it('should return true when value exceeds negative threshold', () => {
      expect(checkThreshold(-10, 5, 'negative')).toBe(true);
      expect(checkThreshold(-5, 5, 'negative')).toBe(true);
      expect(checkThreshold(-4, 5, 'negative')).toBe(false);
    });

    it('should return true when absolute value exceeds threshold (both)', () => {
      expect(checkThreshold(10, 5, 'both')).toBe(true);
      expect(checkThreshold(-10, 5, 'both')).toBe(true);
      expect(checkThreshold(4, 5, 'both')).toBe(false);
      expect(checkThreshold(-4, 5, 'both')).toBe(false);
    });
  });

  describe('checkVelocityThreshold', () => {
    it('should return true when velocity magnitude exceeds threshold', () => {
      expect(checkVelocityThreshold(3, 4, 5)).toBe(true);
      expect(checkVelocityThreshold(3, 4, 4)).toBe(true);
      expect(checkVelocityThreshold(3, 4, 6)).toBe(false);
    });
  });

  describe('getPlatformGestureConfig', () => {
    it('should return web config when window is available', () => {
      const config = getPlatformGestureConfig();

      expect(config.pan.enabled).toBe(true);
      expect(config.tap.enabled).toBe(true);
      expect(config.longPress.enabled).toBe(true);
      expect(config.tap.numberOfTaps).toBe(1);
      expect(config.longPress.minDurationMs).toBe(500);
    });
  });

  describe('clamp', () => {
    it('should clamp value to min', () => {
      expect(clamp(5, 10, 20)).toBe(10);
    });

    it('should clamp value to max', () => {
      expect(clamp(25, 10, 20)).toBe(20);
    });

    it('should return value when within range', () => {
      expect(clamp(15, 10, 20)).toBe(15);
    });
  });

  describe('interpolateGesture', () => {
    it('should interpolate value correctly', () => {
      expect(interpolateGesture(5, [0, 10], [0, 100], 'clamp')).toBe(50);
      expect(interpolateGesture(0, [0, 10], [0, 100], 'clamp')).toBe(0);
      expect(interpolateGesture(10, [0, 10], [0, 100], 'clamp')).toBe(100);
    });

    it('should clamp when extrapolate is clamp', () => {
      expect(interpolateGesture(15, [0, 10], [0, 100], 'clamp')).toBe(100);
      expect(interpolateGesture(-5, [0, 10], [0, 100], 'clamp')).toBe(0);
    });

    it('should extend when extrapolate is extend', () => {
      expect(interpolateGesture(15, [0, 10], [0, 100], 'extend')).toBe(150);
      expect(interpolateGesture(-5, [0, 10], [0, 100], 'extend')).toBe(-50);
    });

    it('should handle equal input range', () => {
      expect(interpolateGesture(5, [10, 10], [0, 100], 'clamp')).toBe(0);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc('arg1');
      debouncedFunc('arg2');
      debouncedFunc('arg3');

      expect(func).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(300);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('arg3');
    });

    it('should cancel previous calls on rapid invocations', async () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc('first');
      await vi.advanceTimersByTimeAsync(100);

      debouncedFunc('second');
      await vi.advanceTimersByTimeAsync(100);

      debouncedFunc('final');
      await vi.advanceTimersByTimeAsync(300);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('final');
    });
  });
});
