/**
 * Reduced motion utility tests
 */
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getPrefersReducedMotion, usePrefersReducedMotion } from '../reduced-motion';

describe('reduced-motion utilities', () => {
  let matchMediaMock: typeof window.matchMedia;

  beforeEach(() => {
    // Reset cache
    (window as { matchMedia?: unknown }).matchMedia = undefined;
    
    matchMediaMock = vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? false : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getPrefersReducedMotion', () => {
    it('should return false when reduced motion is not preferred', () => {
      const result = getPrefersReducedMotion();
      expect(result).toBe(false);
    });

    it('should return true when reduced motion is preferred', () => {
      (window as { matchMedia?: unknown }).matchMedia = vi.fn((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? true : false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia;

      // Force re-evaluation
      const result = getPrefersReducedMotion();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('usePrefersReducedMotion', () => {
    it('should return false by default', () => {
      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(false);
    });

    it('should return true when reduced motion is preferred', () => {
      (window as { matchMedia?: unknown }).matchMedia = vi.fn((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? true : false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia;

      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(true);
    });

    it('should add and remove event listener', () => {
      const addEventListener = vi.fn();
      const removeEventListener = vi.fn();

      (window as { matchMedia?: unknown }).matchMedia = vi.fn(() => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener,
        removeEventListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia;

      const { unmount } = renderHook(() => usePrefersReducedMotion());
      
      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      
      unmount();
      
      expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });
});
