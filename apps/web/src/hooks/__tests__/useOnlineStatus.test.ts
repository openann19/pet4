import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOnlineStatus } from '../useOnlineStatus';

describe('useOnlineStatus', () => {
  let originalNavigator: Navigator;
  let mockNavigator: Navigator;

  beforeEach(() => {
    originalNavigator = global.navigator;
    mockNavigator = {
      ...originalNavigator,
      onLine: true,
    } as Navigator;
    Object.defineProperty(global, 'navigator', {
      writable: true,
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
    mockNavigator.onLine = true;
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);
  });

  it('returns false when navigator is offline', () => {
    mockNavigator.onLine = false;
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);
  });

  it('updates when online event is fired', () => {
    mockNavigator.onLine = false;
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);

    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);

    expect(result.current).toBe(true);
  });

  it('updates when offline event is fired', () => {
    mockNavigator.onLine = true;
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    const offlineEvent = new Event('offline');
    window.dispatchEvent(offlineEvent);

    expect(result.current).toBe(false);
  });

  it('handles multiple online/offline events', () => {
    mockNavigator.onLine = true;
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    window.dispatchEvent(new Event('offline'));
    expect(result.current).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(result.current).toBe(true);

    window.dispatchEvent(new Event('offline'));
    expect(result.current).toBe(false);
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
    mockNavigator.onLine = true;
    const { result, rerender } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    rerender();

    expect(result.current).toBe(true);
  });

  it('handles rapid online/offline transitions', () => {
    mockNavigator.onLine = true;
    const { result } = renderHook(() => useOnlineStatus());

    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));

    expect(result.current).toBe(true);
  });
});
