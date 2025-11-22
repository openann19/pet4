import { useStorage } from './use-storage';
import { useMemo, useCallback, useRef, useEffect } from 'react';

export function useOptimizedKV<T>(key: string, defaultValue: T) {
  const [value, setValue, deleteValue] = useStorage<T>(key, defaultValue);

  const optimizedSetValue = useCallback(
    (newValue: T | ((current: T) => T)) => {
      void setValue(newValue);
    },
    [setValue]
  );

  const optimizedDeleteValue = useCallback(() => {
    void deleteValue();
  }, [deleteValue]);

  return [value, optimizedSetValue, optimizedDeleteValue] as const;
}

export function useDebouncedKV<T>(key: string, defaultValue: T, delay = 300) {
  const [value, setValue, deleteValue] = useStorage<T>(key, defaultValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSetValue = useCallback(
    (newValue: T | ((current: T) => T)) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        void setValue(newValue);
        timeoutRef.current = null;
      }, delay);
    },
    [setValue, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return [value, debouncedSetValue, deleteValue] as const;
}

export function useCachedComputation<T, R>(
  data: T,
  computeFn: (data: T) => R,
  deps: unknown[] = []
): R {
  return useMemo(() => computeFn(data), [data, ...deps]);
}
