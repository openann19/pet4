import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGlassMorphZoom } from './use-glass-morph-zoom';
import { triggerHaptic } from '../core/haptic-manager';
import { logEffectStart, logEffectEnd, clearActiveEffects } from '../core/telemetry';
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate';

// Mock dependencies
vi.mock('../core/haptic-manager', () => ({
  triggerHaptic: vi.fn(),
}));

vi.mock('../core/telemetry', () => ({
  logEffectStart: vi.fn(() => 'test-effect-id'),
  logEffectEnd: vi.fn(),
  clearActiveEffects: vi.fn(),
}));

vi.mock('@/hooks/useDeviceRefreshRate', () => ({
  useDeviceRefreshRate: vi.fn(() => ({
    hz: 60,
    scaleDuration: (duration: number) => duration,
    scaleSpringStiffness: (stiffness: number) => stiffness,
    isHighRefreshRate: false,
    isUltraHighRefreshRate: false,
    deviceCapability: {
      isLowEnd: false,
      isMidRange: true,
      isHighEnd: false,
      maxParticles: 120,
      supportsAdvancedEffects: true,
    },
  })),
}));

vi.mock('../core/reduced-motion', () => ({
  getReducedMotionDuration: vi.fn((duration: number) => duration),
}));

vi.mock('../core/seeded-rng', () => ({
  randomRange: vi.fn((min: number, max: number) => (min + max) / 2),
}));

describe('useGlassMorphZoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearActiveEffects();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useGlassMorphZoom());

    expect(result.current.scale).toBeDefined();
    expect(result.current.opacity).toBeDefined();
    expect(result.current.blurOpacity).toBeDefined();
    expect(result.current.backdropBlur).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.open).toBeDefined();
    expect(result.current.close).toBeDefined();

    expect(result.current.scale.value).toBe(1);
    expect(result.current.opacity.value).toBe(0);
  });

  it('should open zoom animation', async () => {
    const { result } = renderHook(() => useGlassMorphZoom());

    act(() => {
      result.current.open();
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.scale.value).toBeGreaterThan(1);
    expect(result.current.opacity.value).toBeGreaterThan(0);
  });

  it('should trigger haptic feedback on open', () => {
    const { result } = renderHook(() => useGlassMorphZoom());

    act(() => {
      result.current.open();
    });

    expect(triggerHaptic).toHaveBeenCalledWith('selection');
  });

  it('should log telemetry on open', () => {
    const { result } = renderHook(() => useGlassMorphZoom());

    act(() => {
      result.current.open();
    });

    expect(logEffectStart).toHaveBeenCalledWith('glass-morph-zoom', {
      blurRadius: 12,
    });
  });

  it('should log telemetry end after open animation', async () => {
    const { result } = renderHook(() => useGlassMorphZoom());

    act(() => {
      result.current.open();
    });

    await act(async () => {
      vi.advanceTimersByTime(280);
    });

    await waitFor(() => {
      expect(logEffectEnd).toHaveBeenCalled();
    });
  });

  it('should call onComplete callback after open', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useGlassMorphZoom({ onComplete }));

    act(() => {
      result.current.open();
    });

    await act(async () => {
      vi.advanceTimersByTime(280);
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should close zoom animation', async () => {
    const { result } = renderHook(() => useGlassMorphZoom());

    act(() => {
      result.current.open();
    });

    await act(async () => {
      vi.advanceTimersByTime(280);
    });

    act(() => {
      result.current.close();
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.scale.value).toBeLessThanOrEqual(1.1);
    expect(result.current.opacity.value).toBeLessThan(1);
  });

  it('should animate backdrop blur', async () => {
    const { result } = renderHook(() => useGlassMorphZoom());

    act(() => {
      result.current.open();
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.backdropBlur.value).toBeGreaterThan(0);
  });

  it('should use custom blur radius', () => {
    const { result } = renderHook(() => useGlassMorphZoom({ blurRadius: 16 }));

    act(() => {
      result.current.open();
    });

    expect(logEffectStart).toHaveBeenCalledWith('glass-morph-zoom', {
      blurRadius: 16,
    });
  });

  it('should use device refresh rate for adaptive duration', () => {
    vi.mocked(useDeviceRefreshRate).mockReturnValue({
      hz: 120,
      scaleDuration: (duration: number) => duration / 2,
      scaleSpringStiffness: (stiffness: number) => stiffness * 2,
      isHighRefreshRate: true,
      isUltraHighRefreshRate: false,
      deviceCapability: {
        isLowEnd: false,
        isMidRange: false,
        isHighEnd: true,
        maxParticles: 200,
        supportsAdvancedEffects: true,
      },
    });

    const { result } = renderHook(() => useGlassMorphZoom());

    act(() => {
      result.current.open();
    });

    // Should use scaled duration
    expect(useDeviceRefreshRate).toHaveBeenCalled();
  });

  it('should not open when disabled', () => {
    const { result } = renderHook(() => useGlassMorphZoom({ enabled: false }));

    act(() => {
      result.current.open();
    });

    expect(result.current.scale.value).toBe(1);
    expect(triggerHaptic).not.toHaveBeenCalled();
  });

  it('should return animated style', () => {
    const { result } = renderHook(() => useGlassMorphZoom());

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.animatedStyle).toBe('object');
  });
});
