import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

describe('useOnlineStatus', () => {
  let originalNavigator: Navigator;
  let mockNavigator: Navigator;

  beforeEach(() => {
    originalNavigator = global.navigator;
    mockNavigator = {
      ...originalNavigator,
    } as Navigator;
    Object.defineProperty(mockNavigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
    Object.defineProperty(global, 'navigator', {
      writable: true,
      configurable: true,
      value: mockNavigator,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: originalNavigator,
    });
  });

  it('returns true when navigator is online', () => {
    Object.defineProperty(mockNavigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);
  });

  it('returns false when navigator is offline', () => {
    Object.defineProperty(mockNavigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);
  });

  it('updates when online event is fired', async () => {
    Object.defineProperty(mockNavigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);

    await act(async () => {
      Object.defineProperty(mockNavigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      });
      const onlineEvent = new Event('online', { bubbles: true });
      window.dispatchEvent(onlineEvent);
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('updates when offline event is fired', async () => {
    Object.defineProperty(mockNavigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    await act(async () => {
      Object.defineProperty(mockNavigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });
      const offlineEvent = new Event('offline', { bubbles: true });
      window.dispatchEvent(offlineEvent);
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('handles multiple online/offline events', async () => {
    Object.defineProperty(mockNavigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    await act(async () => {
      Object.defineProperty(mockNavigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline', { bubbles: true }));
    });
    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    await act(async () => {
      Object.defineProperty(mockNavigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online', { bubbles: true }));
    });
    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    await act(async () => {
      Object.defineProperty(mockNavigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline', { bubbles: true }));
    });
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('handles navigator not being available', () => {
    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);
  });

  it('maintains correct state across re-renders', () => {
    Object.defineProperty(mockNavigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
    const { result, rerender } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    rerender();

    expect(result.current).toBe(true);
  });

  it('handles rapid online/offline transitions', async () => {
    Object.defineProperty(mockNavigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
