import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRipple } from '../hooks/use-ripple';
import { useCountUp } from '../hooks/use-count-up';
import { useShimmerOnHover } from '../hooks/use-shimmer';

describe('Effect Hooks', () => {
  describe('useRipple', () => {
    it('should return a callback function', () => {
      const { result } = renderHook(() => useRipple());

      expect(result.current).toBeInstanceOf(Function);
    });

    it('should return same callback on re-render', () => {
      const { result, rerender } = renderHook(() => useRipple());
      const firstCallback = result.current;

      rerender();
      expect(result.current).toBe(firstCallback);
    });
  });

  describe('useCountUp', () => {
    it('should return a ref', () => {
      const { result } = renderHook(() => useCountUp(100));

      expect(result.current).toHaveProperty('current');
    });
  });

  describe('useShimmerOnHover', () => {
    it('should return a ref', () => {
      const { result } = renderHook(() => useShimmerOnHover());

      expect(result.current).toHaveProperty('current');
    });
  });
});
