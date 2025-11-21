import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHoverLift } from './use-hover-lift';

vi.mock('./useMotionPreferences', () => ({
  useMotionPreferences: () => ({ level: 'full', isReduced: false, isOff: false }),
}));

describe('useHoverLift defaults', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useHoverLift());

    expect(result.current.scale).toBeDefined();
    expect(result.current.translateY).toBeDefined();
    expect(result.current.variants).toBeDefined();
    expect(result.current.handleEnter).toBeDefined();
    expect(result.current.handleLeave).toBeDefined();
  });
});

describe('useHoverLift interactions', () => {
  it('exposes hover variants with lifted transform', () => {
    const { result } = renderHook(() => useHoverLift());

    const hover = result.current.variants.hover as { scale: number; y: number };
    expect(hover.scale).toBeGreaterThan(1);
    expect(hover.y).toBeLessThan(0);
  });

  it('keeps rest variant at neutral transform', () => {
    const { result } = renderHook(() => useHoverLift());

    const rest = result.current.variants.rest as { scale: number; y: number };
    expect(rest.scale).toBe(1);
    expect(rest.y).toBe(0);
  });
});

describe('useHoverLift custom options', () => {
  it('respects custom scale override', () => {
    const { result } = renderHook(() =>
      useHoverLift({
        scale: 1.1,
      })
    );

    const hover = result.current.variants.hover as { scale: number };
    expect(hover.scale).toBeCloseTo(1.1);
  });

  it('respects custom translateY override', () => {
    const { result } = renderHook(() =>
      useHoverLift({
        translateY: -10,
      })
    );

    const hover = result.current.variants.hover as { y: number };
    expect(hover.y).toBeLessThan(0);
  });

  it('disables lift when preferences level is off', () => {
    const { result } = renderHook(() =>
      useHoverLift({
        preferences: { level: 'off', isReduced: true, isOff: true },
      })
    );

    const hover = result.current.variants.hover as { scale: number; y: number };
    const rest = result.current.variants.rest as { scale: number; y: number };

    expect(hover.scale).toBe(rest.scale);
    expect(hover.y).toBe(rest.y);
  });
});
