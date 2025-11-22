import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  generateCorrelationId,
  generateULID,
  isTruthy,
  getErrorMessage,
  toErrorLike,
  isBrowser,
  isDev,
} from '../utils';

// Mock process.env for development tests
const originalNodeEnv = process.env.NODE_ENV;

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500');
      expect(result).toBe('px-4 py-2 bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const condition = true;
      const condition2 = false;
      const result = cn(
        'base-class',
        condition && 'conditional-class',
        condition2 && 'hidden-class'
      );
      expect(result).toBe('base-class conditional-class');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'another-class');
      expect(result).toBe('base-class another-class');
    });

    it('should handle empty strings', () => {
      const result = cn('base-class', '', 'another-class');
      expect(result).toBe('base-class another-class');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['flex', 'items-center'], ['justify-center']);
      expect(result).toBe('flex items-center justify-center');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        flex: true,
        'items-center': true,
        hidden: false,
        absolute: undefined,
      });
      expect(result).toBe('flex items-center');
    });

    it('should handle Tailwind class conflicts', () => {
      const result = cn('px-4', 'px-8');
      expect(result).toBe('px-8'); // Later class should win
    });
  });

  describe('generateCorrelationId', () => {
    it('should generate correlation ID with timestamp and random string', () => {
      const id = generateCorrelationId();

      expect(typeof id).toBe('string');
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      expect(id1).not.toBe(id2);
    });

    it('should have reasonable length', () => {
      const id = generateCorrelationId();

      expect(id.length).toBeGreaterThan(10);
      expect(id.length).toBeLessThan(30);
    });

    it('should contain timestamp prefix', () => {
      const id = generateCorrelationId();
      const parts = id.split('-');

      expect(parts.length).toBe(2);
      expect(/^\d+$/.test(parts[0])).toBe(true); // First part should be numeric timestamp
    });
  });

  describe('generateULID', () => {
    it('should generate ULID with correct format', () => {
      const ulid = generateULID();

      expect(typeof ulid).toBe('string');
      expect(ulid).toMatch(/^[A-Z0-9]+$/);
      expect(ulid.length).toBe(26); // Standard ULID length
    });

    it('should generate unique ULIDs', () => {
      const ulid1 = generateULID();
      const ulid2 = generateULID();

      expect(ulid1).not.toBe(ulid2);
    });

    it('should start with timestamp part', () => {
      const ulid = generateULID();
      const timestampPart = ulid.slice(0, 6); // First 6 characters are timestamp

      expect(timestampPart).toMatch(/^[0-9A-Z]+$/);
    });

    it('should have random part after timestamp', () => {
      const ulid = generateULID();
      const randomPart = ulid.slice(6);

      expect(randomPart.length).toBe(20); // 16 bytes = 32 hex chars = 16 base32 chars
      expect(randomPart).toMatch(/^[A-Z0-9]+$/);
    });
  });

  describe('isTruthy', () => {
    it('should return true for truthy values', () => {
      expect(isTruthy('hello')).toBe(true);
      expect(isTruthy(123)).toBe(true);
      expect(isTruthy(true)).toBe(true);
      expect(isTruthy({})).toBe(true);
      expect(isTruthy([])).toBe(true);
      expect(isTruthy(() => {})).toBe(true);
    });

    it('should return false for falsy values', () => {
      expect(isTruthy(null)).toBe(false);
      expect(isTruthy(undefined)).toBe(false);
      expect(isTruthy(false)).toBe(false);
      expect(isTruthy(0)).toBe(false);
      expect(isTruthy('')).toBe(false);
    });

    it('should preserve type information', () => {
      const value: string | null = 'test';
      if (isTruthy(value)) {
        // TypeScript should know value is string here
        expect(value.toUpperCase()).toBe('TEST');
      }
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should return string as-is', () => {
      const error = 'String error message';
      expect(getErrorMessage(error)).toBe('String error message');
    });

    it('should handle unknown error types', () => {
      const error = { code: 500, message: 'Object error' };
      expect(getErrorMessage(error)).toBe('An unknown error occurred');
    });

    it('should handle null and undefined', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
    });

    it('should handle numbers', () => {
      expect(getErrorMessage(404)).toBe('An unknown error occurred');
    });

    it('should handle boolean values', () => {
      expect(getErrorMessage(false)).toBe('An unknown error occurred');
    });
  });

  describe('toErrorLike', () => {
    it('should convert Error instance to error-like object', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      const result = toErrorLike(error);

      expect(result).toEqual({
        message: 'Test error',
        stack: 'Error stack trace',
      });
    });

    it('should handle Error without stack', () => {
      const error = new Error('Test error');
      delete error.stack;

      const result = toErrorLike(error);

      expect(result).toEqual({
        message: 'Test error',
      });
      expect(result.stack).toBeUndefined();
    });

    it('should convert string to error-like object', () => {
      const error = 'String error message';

      const result = toErrorLike(error);

      expect(result).toEqual({
        message: 'String error message',
      });
      expect(result.stack).toBeUndefined();
    });

    it('should convert object to error-like object', () => {
      const error = { code: 500, details: 'Server error' };

      const result = toErrorLike(error);

      expect(result).toEqual({
        message: '{"code":500,"details":"Server error"}',
      });
      expect(result.stack).toBeUndefined();
    });

    it('should handle null and undefined', () => {
      expect(toErrorLike(null)).toEqual({
        message: 'null',
      });

      expect(toErrorLike(undefined)).toEqual({
        message: 'undefined',
      });
    });

    it('should handle circular objects gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      const result = toErrorLike(circular);

      expect(typeof result.message).toBe('string');
      expect(result.message).toContain('circular');
    });

    it('should handle numbers and booleans', () => {
      expect(toErrorLike(404)).toEqual({
        message: '404',
      });

      expect(toErrorLike(true)).toEqual({
        message: 'true',
      });
    });
  });

  describe('isBrowser', () => {
    it('should return true in browser environment', () => {
      // Mock window object
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });

      expect(isBrowser).toBe(true);
    });

    it('should return false in non-browser environment', () => {
      // Mock window as undefined
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });

      expect(isBrowser).toBe(false);
    });
  });

  describe('isDev', () => {
    afterEach(() => {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should return true in development environment', () => {
      process.env.NODE_ENV = 'development';

      // Re-import to get updated value
      delete require.cache[require.resolve('../utils')];
      const { isDev: devMode } = require('../utils');

      expect(devMode).toBe(true);
    });

    it('should return false in production environment', () => {
      process.env.NODE_ENV = 'production';

      // Re-import to get updated value
      delete require.cache[require.resolve('../utils')];
      const { isDev: devMode } = require('../utils');

      expect(devMode).toBe(false);
    });

    it('should return false when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;

      // Re-import to get updated value
      delete require.cache[require.resolve('../utils')];
      const { isDev: devMode } = require('../utils');

      expect(devMode).toBe(false);
    });

    it('should return false in test environment', () => {
      process.env.NODE_ENV = 'test';

      // Re-import to get updated value
      delete require.cache[require.resolve('../utils')];
      const { isDev: devMode } = require('../utils');

      expect(devMode).toBe(false);
    });
  });

  describe('integration tests', () => {
    it('should work together in error handling scenario', () => {
      const error = new Error('Integration test error');

      const message = getErrorMessage(error);
      const errorLike = toErrorLike(error);
      const correlationId = generateCorrelationId();

      expect(message).toBe('Integration test error');
      expect(errorLike.message).toBe('Integration test error');
      expect(typeof correlationId).toBe('string');
      expect(correlationId).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should handle array filtering with isTruthy', () => {
      const items = [1, null, 'hello', undefined, false, 0, '', true, {}];

      const filtered = items.filter(isTruthy);

      expect(filtered).toEqual([1, 'hello', true, {}]);
    });

    it('should generate unique identifiers', () => {
      const correlationIds = Array.from({ length: 10 }, () => generateCorrelationId());
      const ulids = Array.from({ length: 10 }, () => generateULID());

      // All correlation IDs should be unique
      expect(new Set(correlationIds).size).toBe(10);

      // All ULIDs should be unique
      expect(new Set(ulids).size).toBe(10);

      // ULIDs should be longer than correlation IDs
      expect(ulids[0].length).toBeGreaterThan(correlationIds[0].length);
    });
  });

  describe('edge cases', () => {
    it('should handle empty class name inputs', () => {
      expect(cn()).toBe('');
      expect(cn(null, undefined, false, 0, '')).toBe('');
    });

    it('should handle very long correlation IDs generation', () => {
      // Generate many IDs to ensure no collisions
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateCorrelationId());
      }
      expect(ids.size).toBe(1000);
    });

    it('should handle very long ULID generation', () => {
      // Generate many ULIDs to ensure no collisions
      const ulids = new Set();
      for (let i = 0; i < 1000; i++) {
        ulids.add(generateULID());
      }
      expect(ulids.size).toBe(1000);
    });

    it('should handle complex class merging scenarios', () => {
      const result = cn(
        'base-class',
        { 'conditional-class': true, 'hidden-class': false },
        ['array-class-1', 'array-class-2'],
        'truthy-class',
        null,
        undefined,
        'final-class'
      );

      expect(result).toBe(
        'base-class conditional-class array-class-1 array-class-2 truthy-class final-class'
      );
    });
  });
});
