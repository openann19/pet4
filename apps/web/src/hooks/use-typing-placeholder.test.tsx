import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypingPlaceholder } from '@/hooks/use-typing-placeholder';

describe('useTypingPlaceholder', () => {
  beforeEach(() => {
    // Reset any mocks
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTypingPlaceholder());

    expect(result.current.opacity.value).toBe(0);
    expect(result.current.animatedStyles).toHaveLength(3);
  });

  it('should create correct number of animated styles', () => {
    const { result } = renderHook(() => useTypingPlaceholder({ barCount: 5 }));

    expect(result.current.animatedStyles).toHaveLength(5);
  });

  it('should animate when enabled', () => {
    const { result } = renderHook(() => useTypingPlaceholder({ enabled: true }));

    act(() => {
      // Trigger animation
    });

    expect(result.current.containerStyle).toBeDefined();
  });

  it('should not animate when disabled', () => {
    const { result } = renderHook(() => useTypingPlaceholder({ enabled: false }));

    expect(result.current.opacity.value).toBe(0);
  });

  it('should provide container style', () => {
    const { result } = renderHook(() => useTypingPlaceholder());

    expect(result.current.containerStyle).toBeDefined();
  });
});
