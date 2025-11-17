import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReactionAnimation } from '@/hooks/use-reaction-animation';

describe('useReactionAnimation', () => {
  beforeEach(() => {
    // Reset any mocks
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useReactionAnimation());

    expect(result.current.scale.value).toBe(1);
    expect(result.current.translateY.value).toBe(0);
    expect(result.current.opacity.value).toBe(0);
  });

  it('should animate reaction', () => {
    const { result } = renderHook(() => useReactionAnimation());

    act(() => {
      result.current.animate('❤️');
    });

    expect(result.current.scale.value).toBeGreaterThan(0);
    expect(result.current.opacity.value).toBeGreaterThan(0);
  });

  it('should reset animation', () => {
    const { result } = renderHook(() => useReactionAnimation());

    act(() => {
      result.current.animate('❤️');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.scale.value).toBe(1);
    expect(result.current.opacity.value).toBe(0);
  });

  it('should provide animated style', () => {
    const { result } = renderHook(() => useReactionAnimation());

    expect(result.current.animatedStyle).toBeDefined();
  });
});
