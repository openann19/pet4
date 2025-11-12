import { describe, it, expect, beforeEach, vi } from 'vitest';
import { platformHaptics, createPlatformHaptics } from '@/lib/platform-haptics';

describe('PlatformHaptics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPlatformHaptics', () => {
    it('should create a PlatformHaptics instance', () => {
      const haptics = createPlatformHaptics();
      expect(haptics).toBeDefined();
      expect(typeof haptics.selection).toBe('function');
      expect(typeof haptics.impact).toBe('function');
      expect(typeof haptics.success).toBe('function');
    });
  });

  describe('selection', () => {
    it('should trigger selection haptic', () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);
      platformHaptics.selection();
      expect(vibrateSpy).toHaveBeenCalledWith(5);
      vibrateSpy.mockRestore();
    });
  });

  describe('impact', () => {
    it('should trigger light impact', () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);
      platformHaptics.impact('light');
      expect(vibrateSpy).toHaveBeenCalledWith(10);
      vibrateSpy.mockRestore();
    });

    it('should trigger medium impact', () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);
      platformHaptics.impact('medium');
      expect(vibrateSpy).toHaveBeenCalledWith(20);
      vibrateSpy.mockRestore();
    });

    it('should trigger heavy impact', () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);
      platformHaptics.impact('heavy');
      expect(vibrateSpy).toHaveBeenCalledWith(40);
      vibrateSpy.mockRestore();
    });
  });

  describe('success', () => {
    it('should trigger success haptic', () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);
      platformHaptics.success();
      expect(vibrateSpy).toHaveBeenCalledWith([10, 50, 10]);
      vibrateSpy.mockRestore();
    });
  });

  describe('warning', () => {
    it('should trigger warning haptic', () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);
      platformHaptics.warning();
      expect(vibrateSpy).toHaveBeenCalledWith([20, 100, 20]);
      vibrateSpy.mockRestore();
    });
  });

  describe('error', () => {
    it('should trigger error haptic', () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);
      platformHaptics.error();
      expect(vibrateSpy).toHaveBeenCalledWith([30, 100, 30, 100, 30]);
      vibrateSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle vibrate errors gracefully', () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate').mockImplementation(() => {
        throw new Error('Vibration failed');
      });
      expect(() => platformHaptics.selection()).not.toThrow();
      vibrateSpy.mockRestore();
    });
  });
});
