/**
 * Tests for type guard utilities
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect } from 'vitest';
import {
  isObject,
  hasProperty,
  isString,
  isNumber,
  isBoolean,
  isArray,
  isValidAPIResponse,
  isValidUser,
  isValidPet,
  isNotNullOrUndefined,
  isErrorWithStatus,
  type APIResponse,
  type User,
  type Pet,
  type ErrorWithStatus,
} from '../type-guards';

describe('type-guards', () => {
  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject(undefined)).toBe(false);
    });
  });

  describe('hasProperty', () => {
    it('should return true when object has property', () => {
      expect(hasProperty({ key: 'value' }, 'key')).toBe(true);
    });

    it('should return false when object does not have property', () => {
      expect(hasProperty({ key: 'value' }, 'other')).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(hasProperty(null, 'key')).toBe(false);
      expect(hasProperty('string', 'key')).toBe(false);
    });
  });

  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('')).toBe(true);
      expect(isString('test')).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for numbers', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-123)).toBe(true);
      expect(isNumber(1.5)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('should return true for booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it('should return false for non-booleans', () => {
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('true')).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('string')).toBe(false);
    });
  });

  describe('isValidAPIResponse', () => {
    it('should return true for valid API response', () => {
      const response: APIResponse = {
        data: { id: '1' },
        status: 200,
      };
      expect(isValidAPIResponse(response)).toBe(true);
    });

    it('should return true with headers', () => {
      const response: APIResponse = {
        data: {},
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      };
      expect(isValidAPIResponse(response)).toBe(true);
    });

    it('should return false for missing data', () => {
      expect(isValidAPIResponse({ status: 200 })).toBe(false);
    });

    it('should return false for missing status', () => {
      expect(isValidAPIResponse({ data: {} })).toBe(false);
    });

    it('should return false for invalid status type', () => {
      expect(isValidAPIResponse({ data: {}, status: '200' })).toBe(false);
    });
  });

  describe('isValidUser', () => {
    it('should return true for valid user', () => {
      const user: User = { id: '1', email: 'test@example.com', name: 'Test' };
      expect(isValidUser(user)).toBe(true);
    });

    it('should return true for user with only id', () => {
      const user: User = { id: '1' };
      expect(isValidUser(user)).toBe(true);
    });

    it('should return false for missing id', () => {
      expect(isValidUser({ email: 'test@example.com' })).toBe(false);
    });

    it('should return false for non-string id', () => {
      expect(isValidUser({ id: 123 })).toBe(false);
    });
  });

  describe('isValidPet', () => {
    it('should return true for valid pet', () => {
      const pet: Pet = { id: '1', name: 'Fluffy' };
      expect(isValidPet(pet)).toBe(true);
    });

    it('should return true for pet with only id', () => {
      const pet: Pet = { id: '1' };
      expect(isValidPet(pet)).toBe(true);
    });

    it('should return false for missing id', () => {
      expect(isValidPet({ name: 'Fluffy' })).toBe(false);
    });

    it('should return false for non-string id', () => {
      expect(isValidPet({ id: 123 })).toBe(false);
    });
  });

  describe('isNotNullOrUndefined', () => {
    it('should return true for defined values', () => {
      expect(isNotNullOrUndefined('string')).toBe(true);
      expect(isNotNullOrUndefined(0)).toBe(true);
      expect(isNotNullOrUndefined(false)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isNotNullOrUndefined(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isNotNullOrUndefined(undefined)).toBe(false);
    });
  });

  describe('isErrorWithStatus', () => {
    it('should return true for error with status', () => {
      const error = new Error('Test error') as ErrorWithStatus;
      error.status = 404;
      expect(isErrorWithStatus(error)).toBe(true);
    });

    it('should return true for error with code', () => {
      const error = new Error('Test error') as ErrorWithStatus;
      error.code = 'NOT_FOUND';
      expect(isErrorWithStatus(error)).toBe(true);
    });

    it('should return true for error with both status and code', () => {
      const error = new Error('Test error') as ErrorWithStatus;
      error.status = 404;
      error.code = 'NOT_FOUND';
      expect(isErrorWithStatus(error)).toBe(true);
    });

    it('should return false for plain error', () => {
      expect(isErrorWithStatus(new Error('Test'))).toBe(false);
    });

    it('should return false for non-error', () => {
      expect(isErrorWithStatus('error')).toBe(false);
      expect(isErrorWithStatus({ message: 'error' })).toBe(false);
    });
  });
});
