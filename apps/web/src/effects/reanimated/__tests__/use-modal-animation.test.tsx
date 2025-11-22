import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useModalAnimation } from '../use-modal-animation';
import { motionTheme } from '@/config/motionTheme';

vi.mock('../useMotionPreferences', () => ({
  useMotionPreferences: () => ({ level: 'full', isReduced: false, isOff: false }),
}));

describe('useModalAnimation', () => {
  it('returns presence motion shape with animatedStyle', () => {
    const { result } = renderHook(() =>
      useModalAnimation({
        isVisible: false,
      }),
    );

    expect(result.current.kind).toBe('presence');
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.opacity).toBeDefined();
    expect(result.current.scale).toBeDefined();
    expect(result.current.y).toBeDefined();
  });

  it('uses motionTheme tokens for hidden and visible variants', () => {
    const { result } = renderHook(() =>
      useModalAnimation({
        isVisible: false,
      }),
    );

    const hidden = result.current.variants.hidden as { opacity: number; scale: number; y: number };
    const visible = result.current.variants.visible as { opacity: number; scale: number; y: number };

    expect(hidden.opacity).toBe(0);
    expect(hidden.scale).toBeCloseTo(motionTheme.scale.modalInitial);
    expect(hidden.y).toBeCloseTo(motionTheme.distance.modalOffsetY);

    expect(visible.opacity).toBe(1);
    expect(visible.scale).toBe(1);
    expect(visible.y).toBe(0);
  });
});
