import { useStorage } from './useStorage';
import { useMemo, useCallback } from 'react';

export function useOptimizedKV<T>(key: string, defaultValue: T) {
  const [value, setValue, deleteValue] = useStorage<T>(key, defaultValue);

  const optimizedSetValue = useCallback(
    (newValue: T | ((current: T) => T)) => {
      setValue(newValue);
    },
    [setValue]
  );

  const optimizedDeleteValue = useCallback(() => {
    deleteValue();
  }, [deleteValue]);

  return [value, optimizedSetValue, optimizedDeleteValue] as const;
}

export function useDebouncedKV<T>(key: string, defaultValue: T, delay = 300) {
  const [value, setValue, deleteValue] = useStorage<T>(key, defaultValue);

  const debouncedSetValue = useCallback(
    (newValue: T | ((current: T) => T)) => {
      const timeoutId = setTimeout(() => {
        setValue(newValue);
      }, delay);

      return () => clearTimeout(timeoutId);
    },
    [setValue, delay]
  );

  return [value, debouncedSetValue, deleteValue] as const;
}

export function useCachedComputation<T, R>(
  data: T,
  computeFn: (data: T) => R,
  deps: unknown[] = []
): R {
  return useMemo(() => computeFn(data), [data, ...deps]);
}
