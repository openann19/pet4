import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHoverLift } from './use-hover-lift';

describe('useHoverLift', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useHoverLift());

    expect(result.current.scale).toBeDefined();
    expect(result.current.translateY).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.handleEnter).toBeDefined();
    expect(result.current.handleLeave).toBeDefined();
  });

  it('should handle enter event', () => {
    const { result } = renderHook(() => useHoverLift());

    act(() => {
      result.current.handleEnter();
    });

    expect(result.current.scale.value).toBeGreaterThan(1);
    expect(result.current.translateY.value).toBeLessThan(0);
  });

  it('should handle leave event', () => {
    const { result } = renderHook(() => useHoverLift());

    act(() => {
      result.current.handleEnter();
      result.current.handleLeave();
    });

    expect(result.current.scale.value).toBe(1);
    expect(result.current.translateY.value).toBe(0);
  });

  it('should use custom scale value', () => {
    const { result } = renderHook(() =>
      useHoverLift({
        scale: 1.1,
      })
    );

    act(() => {
      result.current.handleEnter();
    });

    expect(result.current.scale.value).toBeGreaterThan(1);
  });

  it('should use custom translateY value', () => {
    const { result } = renderHook(() =>
      useHoverLift({
        translateY: -10,
      })
    );

    act(() => {
      result.current.handleEnter();
    });

    expect(result.current.translateY.value).toBeLessThan(0);
  });
});
