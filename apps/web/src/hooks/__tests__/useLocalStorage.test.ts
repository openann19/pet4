/**
 * Tests for useLocalStorage hook
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

vi.mock('../../lib/cache/local-storage', () => ({
  getStorageItem: vi.fn(),
  setStorageItem: vi.fn(),
  removeStorageItem: vi.fn(),
}));

vi.mock('../../lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('useLocalStorage', () => {
  let getStorageItem: ReturnType<typeof vi.fn>;
  let setStorageItem: ReturnType<typeof vi.fn>;
  let removeStorageItem: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const storageModule = await import('../../lib/cache/local-storage');
    getStorageItem = storageModule.getStorageItem as ReturnType<typeof vi.fn>;
    setStorageItem = storageModule.setStorageItem as ReturnType<typeof vi.fn>;
    removeStorageItem = storageModule.removeStorageItem as ReturnType<typeof vi.fn>;
    getStorageItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('initial-value');
  });

  it('should return stored value when localStorage has value', () => {
    (getStorageItem).mockReturnValue('stored-value');

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('stored-value');
  });

  it('should update value and localStorage', async () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    await waitFor(() => {
      expect(result.current[0]).toBe('updated');
    });

    expect(setStorageItem).toHaveBeenCalledWith('test-key', 'updated', {});
  });

  it('should handle function updater', async () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(1);
    });
  });

  it('should remove value from localStorage', async () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[2]();
    });

    await waitFor(() => {
      expect(result.current[0]).toBe('initial');
    });

    expect(removeStorageItem).toHaveBeenCalledWith('test-key');
  });

  it('should sync across tabs when syncAcrossTabs is true', async () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial', { syncAcrossTabs: true })
    );

    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify({ value: 'synced-value' }),
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe('synced-value');
    });
  });

  it('should not sync across tabs when syncAcrossTabs is false', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial', { syncAcrossTabs: false })
    );

    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify({ value: 'synced-value' }),
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    expect(result.current[0]).toBe('initial');
  });

  it('should handle TTL option', async () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial', { ttl: 3600 })
    );

    act(() => {
      result.current[1]('updated');
    });

    await waitFor(() => {
      expect(setStorageItem).toHaveBeenCalledWith('test-key', 'updated', { ttl: 3600 });
    });
  });

  it('should handle errors gracefully', async () => {
    (setStorageItem).mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    await waitFor(() => {
      expect(result.current[0]).toBe('updated');
    });
  });
});
