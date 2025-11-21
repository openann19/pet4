import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMotionPreferences, type MotionPreferences } from '../useMotionPreferences';

vi.mock('@/utils/reduced-motion', () => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/contexts/UIContext', () => ({
  useUIContext: () => ({
    config: {
      animation: {
        enableReanimated: true,
      },
    },
  }),
}));

describe('useMotionPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns full motion by default when prefers-reduced is false', () => {
    const { result } = renderHook(() => useMotionPreferences());
    const prefs: MotionPreferences = result.current;

    expect(prefs.level).toBe('full');
    expect(prefs.isReduced).toBe(false);
    expect(prefs.isOff).toBe(false);
  });

  it('can be overridden to reduced', () => {
    const { result } = renderHook(() => useMotionPreferences({ level: 'reduced' }));
    const prefs = result.current;

    expect(prefs.level).toBe('reduced');
    expect(prefs.isReduced).toBe(true);
    expect(prefs.isOff).toBe(false);
  });

  it('can be overridden to off', () => {
    const { result } = renderHook(() => useMotionPreferences({ level: 'off' }));
    const prefs = result.current;

    expect(prefs.level).toBe('off');
    expect(prefs.isReduced).toBe(true);
    expect(prefs.isOff).toBe(true);
  });
});
