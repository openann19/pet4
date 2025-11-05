/**
 * useLocalStorage - React hook for localStorage with auto sync
 * Provides type-safe localStorage access with React state management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from '../lib/cache/local-storage';

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
    return item !== null ? item : initialValue;
  });

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        setStorageItem(key, valueToStore, { ttl });
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
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
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync across tabs
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setStoredValue(parsed.value);
        } catch (error) {
          console.error(`Error parsing storage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, syncAcrossTabs]);

  return [storedValue, setValue, removeValue];
}
