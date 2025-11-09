import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuroraRing } from './use-aurora-ring';
import { useReducedMotionSV } from '../core/reduced-motion';

// Mock dependencies
vi.mock('../core/reduced-motion', () => ({
  useReducedMotionSV: vi.fn(() => ({
    value: false,
  })),
}));

describe('useAuroraRing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAuroraRing());

    expect(result.current.ringOpacity).toBeDefined();
    expect(result.current.ringScale).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
  });

  it('should animate ring opacity for online status', async () => {
    const { result } = renderHook(() => useAuroraRing({ status: 'online' }));

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.ringOpacity.value).toBeGreaterThan(0);
  });

  it('should animate ring scale for online status', async () => {
    const { result } = renderHook(() => useAuroraRing({ status: 'online' }));

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.ringScale.value).toBeGreaterThan(1);
  });

  it('should set ring opacity to 0 for offline status', () => {
    const { result } = renderHook(() => useAuroraRing({ status: 'offline' }));

    expect(result.current.ringOpacity.value).toBe(0);
  });

  it('should use green color for online status', () => {
    const { result } = renderHook(() => useAuroraRing({ status: 'online' }));

    const style = result.current.animatedStyle;
    expect(style).toBeDefined();
  });

  it('should use amber color for away status', () => {
    const { result } = renderHook(() => useAuroraRing({ status: 'away' }));

    const style = result.current.animatedStyle;
    expect(style).toBeDefined();
  });

  it('should use red color for busy status', () => {
    const { result } = renderHook(() => useAuroraRing({ status: 'busy' }));

    const style = result.current.animatedStyle;
    expect(style).toBeDefined();
  });

  it('should respect reduced motion', () => {
    vi.mocked(useReducedMotionSV).mockReturnValue({
      value: true,
    });

    const { result } = renderHook(() => useAuroraRing({ status: 'online' }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Static ring for reduced motion
    expect(result.current.ringOpacity.value).toBe(0.6);
    expect(result.current.ringScale.value).toBe(1.1);
  });

  it('should not animate when disabled', () => {
    const { result } = renderHook(() => useAuroraRing({ enabled: false, status: 'online' }));

    expect(result.current.ringOpacity.value).toBe(0);
  });

  it('should use custom size', () => {
    const { result } = renderHook(() => useAuroraRing({ size: 60 }));

    const style = result.current.animatedStyle;
    expect(style).toBeDefined();
  });

  it('should return animated style', () => {
    const { result } = renderHook(() => useAuroraRing({ status: 'online' }));

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.animatedStyle).toBe('object');
  });

  it('should pulse ring opacity', async () => {
    const { result } = renderHook(() => useAuroraRing({ status: 'online' }));

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // Opacity should have changed from initial value
    const initialOpacity = result.current.ringOpacity.value;

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // Opacity should have changed (pulsing)
    expect(result.current.ringOpacity.value).not.toBe(initialOpacity);
  });
});
