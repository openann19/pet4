/**
 * Local Storage utilities with TypeScript support and error handling
 * Provides safe access to localStorage with automatic serialization
 */

interface StorageOptions {
  ttl?: number; // Time to live in milliseconds
}

interface StorageEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

/**
 * Get item from localStorage with type safety and expiration check
 */
export function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item) as StorageEntry<T>;

    // Check expiration
    if (parsed.ttl) {
      const now = Date.now();
      const isExpired = now - parsed.timestamp > parsed.ttl;
      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }
    }

    return parsed.value;
  } catch (error) {
    console.error(`Error reading from localStorage (key: ${key}):`, error);
    return null;
  }
}

/**
 * Set item in localStorage with optional TTL
 */
export function setStorageItem<T>(
  key: string,
  value: T,
  options: StorageOptions = {}
): boolean {
  try {
    const entry: StorageEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: options.ttl,
    };
    localStorage.setItem(key, JSON.stringify(entry));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * Clear all expired items from localStorage
 */
export function clearExpiredStorage(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach((key) => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return;

        const parsed = JSON.parse(item) as StorageEntry<unknown>;
        if (parsed.ttl && now - parsed.timestamp > parsed.ttl) {
          localStorage.removeItem(key);
        }
      } catch {
        // Skip invalid items
      }
    });
  } catch (error) {
    console.error('Error clearing expired storage:', error);
  }
}

/**
 * Get storage size in bytes
 */
export function getStorageSize(): number {
  try {
    let size = 0;
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      const item = localStorage.getItem(key);
      if (item) {
        size += key.length + item.length;
      }
    });
    return size;
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return 0;
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
