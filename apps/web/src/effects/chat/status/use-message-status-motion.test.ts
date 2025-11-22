import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { MessageStatus } from '../../../lib/chat-types';
import { useMessageStatusMotion } from './use-message-status-motion';
import { triggerHaptic } from '../core/haptic-manager';

const mockUseMotionPreferences = vi.fn(() => ({
  level: 'full',
  isReduced: false,
  isOff: false,
}));

vi.mock('../core/haptic-manager', () => ({
  triggerHaptic: vi.fn(),
}));

vi.mock('@/effects/reanimated/useMotionPreferences', () => ({
  useMotionPreferences: () => mockUseMotionPreferences(),
}));

describe('useMessageStatusMotion', () => {
  let originalRAF: typeof globalThis.requestAnimationFrame;
  let originalCancelRAF: typeof globalThis.cancelAnimationFrame;
  let originalWindowRAF: typeof window.requestAnimationFrame;
  let originalWindowCancelRAF: typeof window.cancelAnimationFrame;
  let performanceSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMotionPreferences.mockReturnValue({
      level: 'full',
      isReduced: false,
      isOff: false,
    });

    let frameTime = 0;
    performanceSpy = vi.spyOn(performance, 'now').mockImplementation(() => {
      frameTime += 120;
      return frameTime;
    });

    originalRAF = globalThis.requestAnimationFrame;
    originalCancelRAF = globalThis.cancelAnimationFrame;
    originalWindowRAF = window.requestAnimationFrame;
    originalWindowCancelRAF = window.cancelAnimationFrame;

    const rafStub = ((callback: FrameRequestCallback) => {
      callback(performance.now());
      return 0;
    }) as typeof requestAnimationFrame;

    const cancelStub = (() => undefined) as typeof cancelAnimationFrame;

    globalThis.requestAnimationFrame = rafStub;
    globalThis.cancelAnimationFrame = cancelStub;
    (window as Window & typeof globalThis).requestAnimationFrame = rafStub;
    (window as Window & typeof globalThis).cancelAnimationFrame = cancelStub;
  });

  afterEach(() => {
    performanceSpy.mockRestore();
    globalThis.requestAnimationFrame = originalRAF;
    globalThis.cancelAnimationFrame = originalCancelRAF;
    (window as Window & typeof globalThis).requestAnimationFrame = originalWindowRAF;
    (window as Window & typeof globalThis).cancelAnimationFrame = originalWindowCancelRAF;
  });

  it('initializes motion values for sent status', () => {
    const { result } = renderHook(() => useMessageStatusMotion({ status: 'sent' }));

    const motionReturn = result.current as unknown as {
      kind: string;
      status: MessageStatus;
      color: string;
      animatedStyle: {
        opacity: { value: number };
        scale: { value: number };
      };
    };

    expect(motionReturn.kind).toBe('status');
    expect(motionReturn.status).toBe('sent');
    expect(motionReturn.color).toBe('#A8B2C8');
    expect(motionReturn.animatedStyle.opacity.value).toBe(1);
    expect(motionReturn.animatedStyle.scale.value).toBe(1);
  });

  it('uses lower opacity baseline for sending status', () => {
    const { result } = renderHook(() => useMessageStatusMotion({ status: 'sending' }));

    const style = (
      result.current as unknown as {
        animatedStyle: { opacity: { value: number } };
      }
    ).animatedStyle;
    expect(style.opacity.value).toBeCloseTo(0.85, 2);
  });

  it('updates color when status changes', () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: MessageStatus }) => useMessageStatusMotion({ status }),
      { initialProps: { status: 'sent' as MessageStatus } }
    );

    expect(result.current.color).toBe('#A8B2C8');

    act(() => {
      rerender({ status: 'read' as MessageStatus });
    });

    expect(result.current.color).toBe('#3B82F6');
  });

  it('triggers haptic when delivered transitions to read for own message', () => {
    renderHook(() =>
      useMessageStatusMotion({
        status: 'read',
        previousStatus: 'delivered',
        isOwnMessage: true,
      })
    );

    expect(triggerHaptic).toHaveBeenCalledWith('selection');
  });

  it('disables pulse when motion preferences are off', () => {
    mockUseMotionPreferences.mockReturnValueOnce({
      level: 'off',
      isReduced: true,
      isOff: true,
    });

    const { result } = renderHook(() => useMessageStatusMotion({ status: 'delivered' }));

    const style = (
      result.current as unknown as {
        animatedStyle: {
          opacity: { value: number };
          scale: { value: number };
        };
      }
    ).animatedStyle;

    expect(style.opacity.value).toBe(1);
    expect(style.scale.value).toBe(1);
    expect(triggerHaptic).not.toHaveBeenCalled();
  });
});
