import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearExpiredStorage,
  getStorageSize,
  isStorageAvailable,
} from '../local-storage';
import { createLogger } from '@/lib/logger';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn().mockImplementation(() => {}),
  removeItem: vi.fn().mockImplementation(() => {}),
  clear: vi.fn().mockImplementation(() => {}),
  key: vi.fn(),
  length: 0,
  [Symbol.iterator]: vi.fn(),
};

const mockWindow = {
  localStorage: mockLocalStorage,
};

// Get the global logger mock from the setup file - access the instance created during module initialization
const mockLogger = vi.mocked(createLogger).mock.results[0]?.value || vi.mocked(createLogger)('LocalStorage');

vi.mock('@petspark/shared', () => ({
  isTruthy: vi.fn((value) => Boolean(value)),
}));

describe('localStorage utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock implementations to clean state
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
    mockLocalStorage.clear.mockImplementation(() => {});
    mockLocalStorage.key.mockReturnValue(null);
    mockLocalStorage.length = 0;

    // Mock both window.localStorage and global localStorage using Object.defineProperty
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStorageItem', () => {
    it('should return null when window is undefined', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const result = getStorageItem('test-key');
      expect(result).toBeNull();
    });

    it('should return null when localStorage is undefined', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const result = getStorageItem('test-key');
      expect(result).toBeNull();
    });

    it('should return null when item does not exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getStorageItem('test-key');
      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should return valid item without TTL', () => {
      const testData = { name: 'John', age: 30 };
      const storageEntry = {
        value: testData,
        timestamp: Date.now(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storageEntry));

      const result = getStorageItem('test-key');
      expect(result).toEqual(testData);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should return valid item with unexpired TTL', () => {
      const testData = { name: 'John', age: 30 };
      const storageEntry = {
        value: testData,
        timestamp: Date.now() - 1000, // 1 second ago
        ttl: 5000, // 5 seconds TTL
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storageEntry));

      const result = getStorageItem('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null and remove expired item', () => {
      const testData = { name: 'John', age: 30 };
      const storageEntry = {
        value: testData,
        timestamp: Date.now() - 10000, // 10 seconds ago
        ttl: 5000, // 5 seconds TTL (expired)
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storageEntry));

      const result = getStorageItem('test-key');
      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle JSON parse errors gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const result = getStorageItem('test-key');
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error reading from localStorage',
        expect.any(Error),
        { key: 'test-key' }
      );
    });

    it('should handle localStorage getItem errors gracefully', () => {
      const error = new Error('Storage error');
      mockLocalStorage.getItem.mockImplementation(() => {
        throw error;
      });

      const result = getStorageItem('test-key');
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error reading from localStorage', error, {
        key: 'test-key',
      });
    });

    it('should handle removal errors for expired items', () => {
      const testData = { name: 'John' };
      const storageEntry = {
        value: testData,
        timestamp: Date.now() - 10000,
        ttl: 5000,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storageEntry));

      const removeError = new Error('Remove error');
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw removeError;
      });

      const result = getStorageItem('test-key');
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error removing expired item from localStorage',
        removeError,
        { key: 'test-key' }
      );
    });
  });

  describe('setStorageItem', () => {
    it('should return false when window is undefined', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const result = setStorageItem('test-key', 'test-value');
      expect(result).toBe(false);
    });

    it('should return false when localStorage is undefined', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const result = setStorageItem('test-key', 'test-value');
      expect(result).toBe(false);
    });

    it('should set item without TTL', () => {
      const testData = { name: 'John', age: 30 };

      const result = setStorageItem('test-key', testData);
      expect(result).toBe(true);

      // Check that setItem was called with the right key and valid JSON structure
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', expect.any(String));

      const storedValue = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedValue = JSON.parse(storedValue);
      expect(parsedValue).toEqual({
        value: testData,
        timestamp: expect.any(Number),
      });
    });

    it('should set item with TTL', () => {
      const testData = { name: 'John', age: 30 };
      const options = { ttl: 5000 };

      const result = setStorageItem('test-key', testData, options);
      expect(result).toBe(true);

      // Check that setItem was called with the right key and valid JSON structure
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', expect.any(String));

      const storedValue = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedValue = JSON.parse(storedValue);
      expect(parsedValue).toEqual({
        value: testData,
        timestamp: expect.any(Number),
        ttl: 5000,
      });
    });

    it('should handle localStorage setItem errors gracefully', () => {
      const error = new Error('Storage error');
      mockLocalStorage.setItem.mockImplementation(() => {
        throw error;
      });

      const result = setStorageItem('test-key', 'test-value');
      expect(result).toBe(false);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error writing to localStorage',
        error,
        {
          key: 'test-key',
        }
      );
    });
  });

  describe('removeStorageItem', () => {
    it('should return false when window is undefined', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const result = removeStorageItem('test-key');
      expect(result).toBe(false);
    });

    it('should return false when localStorage is undefined', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const result = removeStorageItem('test-key');
      expect(result).toBe(false);
    });

    it('should remove item successfully', () => {
      const result = removeStorageItem('test-key');
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle localStorage removeItem errors gracefully', () => {
      const error = new Error('Storage error');
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw error;
      });

      const result = removeStorageItem('test-key');
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error removing from localStorage', error, {
        key: 'test-key',
      });
    });
  });

  describe('clearExpiredStorage', () => {
    it('should clear expired items', () => {
      const now = Date.now();
      const expiredEntry = {
        value: 'expired',
        timestamp: now - 10000,
        ttl: 5000,
      };
      const validEntry = {
        value: 'valid',
        timestamp: now - 1000,
        ttl: 5000,
      };
      const entryWithoutTtl = {
        value: 'no-ttl',
        timestamp: now - 10000,
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'expired') return JSON.stringify(expiredEntry);
        if (key === 'valid') return JSON.stringify(validEntry);
        if (key === 'no-ttl') return JSON.stringify(entryWithoutTtl);
        return null;
      });

      // Mock Object.keys to return our test keys
      const mockKeys = ['expired', 'valid', 'no-ttl', 'invalid-json'];
      vi.spyOn(Object, 'keys').mockReturnValue(mockKeys);

      clearExpiredStorage();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('expired');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('valid');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('no-ttl');
    });

    it('should handle invalid JSON items gracefully', () => {
      const mockKeys = ['invalid-json'];
      vi.spyOn(Object, 'keys').mockReturnValue(mockKeys);
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      // Should not throw
      expect(() => clearExpiredStorage()).not.toThrow();
    });

    it('should handle errors gracefully', () => {
      const error = new Error('Storage error');
      const keysSpy = vi.spyOn(Object, 'keys').mockImplementation(() => {
        throw error;
      });

      try {
        // Should not throw
        expect(() => clearExpiredStorage()).not.toThrow();
        expect(mockLogger.error).toHaveBeenCalledWith('Error clearing expired storage', error);
      } finally {
        keysSpy.mockRestore();
      }
    });
  });

  describe('getStorageSize', () => {
    it('should calculate storage size correctly', () => {
      const mockKeys = ['key1', 'key2'];
      vi.spyOn(Object, 'keys').mockReturnValue(mockKeys);
      mockLocalStorage.getItem.mockImplementation((key) => {
        return `value-for-${key}`; // 14 characters
      });

      const result = getStorageSize();
      // key1 (4) + value (14) + key2 (4) + value (14) = 36
      expect(result).toBe(36);
    });

    it('should handle null items', () => {
      const mockKeys = ['key1', 'key2'];
      vi.spyOn(Object, 'keys').mockReturnValue(mockKeys);
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getStorageSize();
      expect(result).toBe(0);
    });

    it('should handle errors gracefully', () => {
      const error = new Error('Storage error');
      const keysSpy = vi.spyOn(Object, 'keys').mockImplementation(() => {
        throw error;
      });

      try {
        const result = getStorageSize();
        expect(result).toBe(0);
        expect(mockLogger.error).toHaveBeenCalledWith('Error calculating storage size', error);
      } finally {
        keysSpy.mockRestore();
      }
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      const result = isStorageAvailable();
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('__storage_test__', 'test');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('__storage_test__');
    });

    it('should return false when localStorage throws errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      const result = isStorageAvailable();
      expect(result).toBe(false);
    });

    it('should return false when removeItem throws errors', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      const result = isStorageAvailable();
      expect(result).toBe(false);
    });
  });

  describe('integration tests', () => {
    it('should work with complete storage lifecycle', () => {
      const testData = { name: 'John', age: 30 };
      const options = { ttl: 1000 };

      // Set item
      expect(setStorageItem('user', testData, options)).toBe(true);

      // Get item (should exist)
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          value: testData,
          timestamp: Date.now(),
          ttl: 1000,
        })
      );
      expect(getStorageItem('user')).toEqual(testData);

      // Remove item
      expect(removeStorageItem('user')).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('should handle complex data types', () => {
      const complexData = {
        users: [
          { name: 'John', roles: ['admin', 'user'] },
          { name: 'Jane', roles: ['user'] },
        ],
        metadata: {
          version: '1.0.0',
          created: new Date('2023-01-01T00:00:00.000Z'),
          active: true,
        },
      };

      expect(setStorageItem('complex', complexData)).toBe(true);

      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          value: complexData,
          timestamp: Date.now(),
        })
      );

      const result = getStorageItem('complex');
      expect(result).toEqual(complexData);
    });
  });
});
