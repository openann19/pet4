import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useStorage<T>(key: string, initialValue: T): [T, (value: T) => Promise<void>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const loadStoredValue = useCallback(async () => {
    try {
      const item = await AsyncStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch {
      // Error loading data - silently fail
    }
  }, [key]);

  useEffect(() => {
    void loadStoredValue();
  }, [loadStoredValue]);

  const setValue = useCallback(
    async (value: T) => {
      try {
        setStoredValue(value);
        await AsyncStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Error saving data - silently fail
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
