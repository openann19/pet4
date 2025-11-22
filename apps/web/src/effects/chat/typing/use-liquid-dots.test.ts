import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLiquidDots } from './use-liquid-dots';
import type { UseTypingIndicatorMotionReturn } from './use-typing-indicator-motion';

const stubReturn = {
  kind: 'presence',
  isVisible: true,
  animatedStyle: {},
  dots: [],
  displayMode: 'dots',
  label: 'Typing…',
} as unknown as UseTypingIndicatorMotionReturn;

const mockUseTypingIndicatorMotion = vi.fn((options?: unknown): UseTypingIndicatorMotionReturn => {
  return stubReturn;
});

vi.mock('./use-typing-indicator-motion', () => ({
  useTypingIndicatorMotion: (options: unknown) => mockUseTypingIndicatorMotion(options),
}));

describe('useLiquidDots (legacy alias)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards core options to useTypingIndicatorMotion', () => {
    renderHook(() => useLiquidDots({ enabled: false, dotCount: 5, label: 'Testing…' }));

    expect(mockUseTypingIndicatorMotion).toHaveBeenCalledWith(
      expect.objectContaining({
        isTyping: false,
        dotCount: 5,
        label: 'Testing…',
      })
    );
  });

  it('defaults to static dots reduced mode for compatibility', () => {
    renderHook(() => useLiquidDots());

    expect(mockUseTypingIndicatorMotion).toHaveBeenCalledWith(
      expect.objectContaining({ reducedMode: 'static-dots' })
    );
  });

  it('returns the value from useTypingIndicatorMotion', () => {
    const { result } = renderHook(() => useLiquidDots());
    expect(result.current).toBe(stubReturn);
  });
});
