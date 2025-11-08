import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useApiCache } from '../useApiCache';
import { queryCache } from '@/lib/cache/query-cache';

vi.mock('@/lib/cache/query-cache', () => ({
  queryCache: {
    get: vi.fn(),
    set: vi.fn(),
  },
  generateCacheKey: vi.fn((key: string) => key),
}));

const mockQueryCache = vi.mocked(queryCache);

describe('useApiCache', () => {
  const mockFetcher = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockQueryCache.get.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null data initially when no cache', () => {
    mockFetcher.mockResolvedValue({ data: 'test' });
    mockQueryCache.get.mockReturnValue(null);

    const { result } = renderHook(() => useApiCache('test-key', mockFetcher));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('returns cached data when available', () => {
    const cachedData = { data: 'cached' };
    mockQueryCache.get.mockReturnValue(cachedData);

    const { result } = renderHook(() => useApiCache('test-key', mockFetcher));

    expect(result.current.data).toEqual(cachedData);
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches data when enabled', async () => {
    const mockData = { data: 'fetched' };
    mockFetcher.mockResolvedValue(mockData);

    const { result } = renderHook(() => useApiCache('test-key', mockFetcher, { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetcher).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockData);
  });

  it('does not fetch when disabled', () => {
    const { result } = renderHook(() => useApiCache('test-key', mockFetcher, { enabled: false }));

    expect(mockFetcher).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('calls onSuccess callback when data is fetched', async () => {
    const mockData = { data: 'success' };
    mockFetcher.mockResolvedValue(mockData);

    renderHook(() => useApiCache('test-key', mockFetcher, { onSuccess: mockOnSuccess }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockData);
    });
  });

  it('calls onError callback when fetch fails', async () => {
    const mockError = new Error('Fetch failed');
    mockFetcher.mockRejectedValue(mockError);

    renderHook(() => useApiCache('test-key', mockFetcher, { onError: mockOnError }));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });
  });

  it('sets error state when fetch fails', async () => {
    const mockError = new Error('Fetch failed');
    mockFetcher.mockRejectedValue(mockError);

    const { result } = renderHook(() => useApiCache('test-key', mockFetcher));

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('refetches data when refetch is called', async () => {
    const mockData = { data: 'fetched' };
    mockFetcher.mockResolvedValue(mockData);

    const { result } = renderHook(() => useApiCache('test-key', mockFetcher));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFetcher.mockClear();
    mockFetcher.mockResolvedValue({ data: 'refetched' });

    await result.current.refetch();

    expect(mockFetcher).toHaveBeenCalled();
  });

  it('mutates data and updates cache', () => {
    const newData = { data: 'mutated' };
    const { result } = renderHook(() => useApiCache('test-key', mockFetcher));

    act(() => {
      result.current.mutate(newData);
    });

    expect(result.current.data).toEqual(newData);
    expect(mockQueryCache.set).toHaveBeenCalledWith('test-key', newData, undefined);
  });

  it('mutates data with TTL', () => {
    const newData = { data: 'mutated' };
    const { result } = renderHook(() => useApiCache('test-key', mockFetcher, { ttl: 5000 }));

    act(() => {
      result.current.mutate(newData);
    });

    expect(mockQueryCache.set).toHaveBeenCalledWith('test-key', newData, 5000);
  });

  it('does not mutate when key is null', () => {
    const newData = { data: 'mutated' };
    const { result } = renderHook(() => useApiCache(null, mockFetcher));

    act(() => {
      result.current.mutate(newData);
    });

    expect(result.current.data).toBeNull();
    expect(mockQueryCache.set).not.toHaveBeenCalled();
  });

  it('refetches on mount when refetchOnMount is true', async () => {
    const cachedData = { data: 'cached' };
    mockQueryCache.get.mockReturnValue(cachedData);
    mockFetcher.mockResolvedValue({ data: 'fetched' });

    renderHook(() => useApiCache('test-key', mockFetcher, { refetchOnMount: true }));

    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalled();
    });
  });

  it('does not refetch on mount when refetchOnMount is false', () => {
    const cachedData = { data: 'cached' };
    mockQueryCache.get.mockReturnValue(cachedData);

    renderHook(() => useApiCache('test-key', mockFetcher, { refetchOnMount: false }));

    expect(mockFetcher).not.toHaveBeenCalled();
  });

  it('refetches at interval when refetchInterval is set', async () => {
    const mockData = { data: 'fetched' };
    mockFetcher.mockResolvedValue(mockData);

    renderHook(() => useApiCache('test-key', mockFetcher, { refetchInterval: 1000 }));

    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalled();
    });

    mockFetcher.mockClear();

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalled();
    });
  });

  it('does not refetch at interval when disabled', () => {
    mockFetcher.mockResolvedValue({ data: 'fetched' });

    renderHook(() =>
      useApiCache('test-key', mockFetcher, {
        enabled: false,
        refetchInterval: 1000,
      })
    );

    vi.advanceTimersByTime(1000);

    expect(mockFetcher).not.toHaveBeenCalled();
  });

  it('clears interval on unmount', () => {
    mockFetcher.mockResolvedValue({ data: 'fetched' });

    const { unmount } = renderHook(() =>
      useApiCache('test-key', mockFetcher, { refetchInterval: 1000 })
    );

    unmount();

    vi.advanceTimersByTime(1000);

    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  it('handles null key', () => {
    const { result } = renderHook(() => useApiCache(null, mockFetcher));

    expect(result.current.data).toBeNull();
    expect(mockFetcher).not.toHaveBeenCalled();
  });

  it('sets isRefetching during refetch', async () => {
    let resolveFetcher: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolveFetcher = resolve;
    });
    mockFetcher.mockReturnValue(promise);

    const { result } = renderHook(() => useApiCache('test-key', mockFetcher));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const refetchPromise = result.current.refetch();

    expect(result.current.isRefetching).toBe(true);

    resolveFetcher!({ data: 'refetched' });
    await refetchPromise;

    expect(result.current.isRefetching).toBe(false);
  });
});
