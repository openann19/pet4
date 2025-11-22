/**
 * Tests for useReducedMotion hook
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../useReducedMotion';

describe('useReducedMotion', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockMatchMedia = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return false when reduced motion is not preferred', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it('should return true when reduced motion is preferred', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it('should update when preference changes (addEventListener)', () => {
    const listeners: ((event: MediaQueryListEvent) => void)[] = [];
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      listeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(true);
  });

  it('should update when preference changes (addListener fallback)', () => {
    const listeners: ((event: MediaQueryListEvent) => void)[] = [];
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: undefined,
      removeEventListener: undefined,
      addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
        listeners.push(listener);
      }),
      removeListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      listeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(true);
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListener = vi.fn();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    });

    const { unmount } = renderHook(() => useReducedMotion());

    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });

  it('should cleanup listeners on unmount (fallback)', () => {
    const removeListener = vi.fn();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: undefined,
      removeEventListener: undefined,
      addListener: vi.fn(),
      removeListener,
    });

    const { unmount } = renderHook(() => useReducedMotion());

    unmount();

    expect(removeListener).toHaveBeenCalled();
  });
});
