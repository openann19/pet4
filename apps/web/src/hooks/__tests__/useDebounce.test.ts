/**
 * Tests for useDebounce hook
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));

    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 300 });
    expect(result.current).toBe('initial');

    await vi.advanceTimersByTimeAsync(300);
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should cancel previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    rerender({ value: 'first', delay: 300 });
    await vi.advanceTimersByTimeAsync(100);

    rerender({ value: 'second', delay: 300 });
    await vi.advanceTimersByTimeAsync(100);

    rerender({ value: 'final', delay: 300 });
    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(result.current).toBe('final');
    });
  });

  it('should use custom delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    rerender({ value: 'updated', delay: 500 });
    await vi.advanceTimersByTimeAsync(300);
    expect(result.current).toBe('initial');

    await vi.advanceTimersByTimeAsync(200);
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should handle number values', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 300 },
      }
    );

    rerender({ value: 42, delay: 300 });
    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(result.current).toBe(42);
    });
  });

  it('should handle object values', async () => {
    const initial = { count: 0 };
    const updated = { count: 1 };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initial, delay: 300 },
      }
    );

    rerender({ value: updated, delay: 300 });
    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(result.current).toEqual(updated);
    });
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce callback execution', async () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current('arg1', 'arg2');
    expect(callback).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(300);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should cancel previous callback on rapid calls', async () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current('first');
    await vi.advanceTimersByTimeAsync(100);

    result.current('second');
    await vi.advanceTimersByTimeAsync(100);

    result.current('final');
    await vi.advanceTimersByTimeAsync(300);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('final');
  });

  it('should use custom delay', async () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    result.current('test');
    await vi.advanceTimersByTimeAsync(300);
    expect(callback).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple arguments', async () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current('arg1', 42, { key: 'value' });
    await vi.advanceTimersByTimeAsync(300);

    expect(callback).toHaveBeenCalledWith('arg1', 42, { key: 'value' });
  });

  it('should handle function with no arguments', async () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current();
    await vi.advanceTimersByTimeAsync(300);

    expect(callback).toHaveBeenCalledWith();
  });
});
