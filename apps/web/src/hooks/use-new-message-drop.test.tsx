import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNewMessageDrop } from './use-new-message-drop';

describe('useNewMessageDrop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values when not new', () => {
    const { result } = renderHook(() => useNewMessageDrop({ isNew: false }));

    expect(result.current.translateY.value).toBe(0);
    expect(result.current.scale.value).toBe(1);
    expect(result.current.opacity.value).toBe(1);
  });

  it('should initialize with drop values when new', () => {
    const { result } = renderHook(() => useNewMessageDrop({ isNew: true }));

    expect(result.current.translateY.value).toBeLessThan(0);
    expect(result.current.scale.value).toBeLessThan(1);
    expect(result.current.opacity.value).toBeLessThan(1);
  });

  it('should trigger drop animation', () => {
    const { result } = renderHook(() => useNewMessageDrop({ isNew: true }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.translateY.value).toBeGreaterThanOrEqual(-50);
    expect(result.current.glowOpacity.value).toBeGreaterThan(0);
  });

  it('should respect custom drop height', () => {
    const { result } = renderHook(() => useNewMessageDrop({ isNew: true, dropHeight: -100 }));

    expect(result.current.translateY.value).toBe(-100);
  });

  it('should respect custom bounce intensity', () => {
    const { result } = renderHook(() => useNewMessageDrop({ isNew: true, bounceIntensity: 30 }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.translateY.value).toBeGreaterThanOrEqual(-100);
  });

  it('should provide animated styles', () => {
    const { result } = renderHook(() => useNewMessageDrop({ isNew: false }));

    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.glowStyle).toBeDefined();
  });

  it('should animate on isNew prop change', () => {
    const { result, rerender } = renderHook(({ isNew }) => useNewMessageDrop({ isNew }), {
      initialProps: { isNew: false },
    });

    expect(result.current.translateY.value).toBe(0);

    rerender({ isNew: true });

    expect(result.current.translateY.value).toBeLessThan(0);
  });
});
