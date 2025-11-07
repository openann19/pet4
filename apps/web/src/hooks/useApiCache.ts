/**
 * useApiCache - React hook for cached API calls
 * Provides automatic caching with SWR-like behavior
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { queryCache, generateCacheKey } from '../lib/cache/query-cache';
import { isTruthy, isDefined } from '@/core/guards';

interface UseApiCacheOptions<T> {
  enabled?: boolean;
  ttl?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  refetchOnMount?: boolean;
  refetchInterval?: number;
}

interface UseApiCacheResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

export function useApiCache<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseApiCacheOptions<T> = {}
): UseApiCacheResult<T> {
  const {
    enabled = true,
    ttl,
    onSuccess,
    onError,
    refetchOnMount = true,
    refetchInterval,
  } = options;

  const [data, setData] = useState<T | null>(() => {
    if (!key) return null;
    return queryCache.get<T>(key);
  });
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!data && enabled);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(
    async (isInitial = false) => {
      if (!key || !enabled) return;

      if (isTruthy(isInitial)) {
        setIsLoading(true);
      } else {
        setIsRefetching(true);
      }
      setError(null);

      try {
        const result = await fetcherRef.current();
        setData(result);
        queryCache.set(key, result, ttl);
        onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
        setIsRefetching(false);
      }
    },
    [key, enabled, ttl, onSuccess, onError]
  );

  // Initial fetch or when key changes
  useEffect(() => {
    if (!key || !enabled) return;

    const cachedData = queryCache.get<T>(key);
    if (isTruthy(cachedData)) {
      setData(cachedData);
      if (isTruthy(refetchOnMount)) {
        fetchData(false);
      }
    } else {
      fetchData(true);
    }
  }, [key, enabled, refetchOnMount, fetchData]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled || !key) return;

    const interval = setInterval(() => {
      fetchData(false);
    }, refetchInterval);

    return () => { clearInterval(interval); };
  }, [refetchInterval, enabled, key, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  const mutate = useCallback(
    (newData: T) => {
      if (!key) return;
      setData(newData);
      queryCache.set(key, newData, ttl);
    },
    [key, ttl]
  );

  return {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
    mutate,
  };
}

// Helper hook for generating cache keys
export function useCacheKey(
  endpoint: string,
  params?: Record<string, unknown>
): string {
  return generateCacheKey(endpoint, params);
}
