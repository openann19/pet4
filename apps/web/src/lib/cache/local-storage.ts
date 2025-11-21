/**
 * Local Storage utilities with TypeScript support and error handling
 * Provides safe access to localStorage with automatic serialization
 */

import { createLogger } from '../logger';
import { isTruthy } from '@petspark/shared';

const logger = createLogger('LocalStorage');

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
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item) as StorageEntry<T>;

    // Check expiration
    if (isTruthy(parsed.ttl)) {
      const now = Date.now();
      const isExpired = now - parsed.timestamp > parsed.ttl;
      if (isExpired) {
        try {
          localStorage.removeItem(key);
        } catch (removeError) {
          const err = removeError instanceof Error ? removeError : new Error(String(removeError));
          logger.error(`Error removing expired item from localStorage`, err, { key });
        }
        return null;
      }
    }

    return parsed.value;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(`Error reading from localStorage`, err, { key });
    return null;
  }
}

/**
 * Set item in localStorage with optional TTL
 */
export function setStorageItem<T>(key: string, value: T, options: StorageOptions = {}): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  try {
    const entry: StorageEntry<T> = {
      value,
      timestamp: Date.now(),
      ...(options.ttl !== undefined ? { ttl: options.ttl } : {}),
    };
    localStorage.setItem(key, JSON.stringify(entry));
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(`Error writing to localStorage`, err, { key });
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(`Error removing from localStorage`, err, { key });
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
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error clearing expired storage', err);
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
      if (isTruthy(item)) {
        size += key.length + item.length;
      }
    });
    return size;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error calculating storage size', err);
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
