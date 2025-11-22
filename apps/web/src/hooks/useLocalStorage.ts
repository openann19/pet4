/**
 * useLocalStorage - React hook for localStorage with auto sync
 * Provides type-safe localStorage access with React state management
 */

import { useCallback, useEffect, useState } from 'react';
import { getStorageItem, removeStorageItem, setStorageItem } from '../lib/cache/local-storage';
import { createLogger } from '../lib/logger';

const logger = createLogger('useLocalStorage');

interface UseLocalStorageOptions {
  ttl?: number;
  syncAcrossTabs?: boolean;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { ttl, syncAcrossTabs = true } = options;

  // Initialize state with localStorage value or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = getStorageItem<T>(key);
    return item ?? initialValue;
  });

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        setStorageItem(key, valueToStore, ttl !== undefined ? { ttl } : {});
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`Error setting localStorage key`, err, { key });
      }
    },
    [key, storedValue, ttl]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      removeStorageItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Error removing localStorage key`, err, { key });
    }
  }, [key, initialValue]);

  // Sync across tabs
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as { value: T };
          setStoredValue(parsed.value);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Error parsing storage change', err, { key });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, syncAcrossTabs]);

  return [storedValue, setValue, removeValue];
}
