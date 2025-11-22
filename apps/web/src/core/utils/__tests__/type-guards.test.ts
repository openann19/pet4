import { describe, it, expect } from 'vitest';
import {
  isRecord,
  isArray,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  hasKeys,
  isPostFilters,
  isLostAlertFilters,
  isFilters,
  isModerationAction,
  isErrorLike,
  isHttpResponse,
  type PostFilters,
  type LostAlertFilters,
  type ModerationAction,
} from '../type-guards';

describe('type-guards', () => {
  describe('isRecord', () => {
    it('should return true for plain objects', () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ a: 1 })).toBe(true);
      expect(isRecord({ a: 1, b: 'test' })).toBe(true);
    });

    it('should return false for arrays', () => {
      expect(isRecord([])).toBe(false);
      expect(isRecord([1, 2, 3])).toBe(false);
    });

    it('should return false for null', () => {
      expect(isRecord(null)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isRecord('string')).toBe(false);
      expect(isRecord(123)).toBe(false);
      expect(isRecord(true)).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it('should return false for objects', () => {
      expect(isArray({})).toBe(false);
    });
  });

  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('test')).toBe(true);
      expect(isString('')).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false);
    });
  });

  describe('isPostFilters', () => {
    it('should return true for valid PostFilters', () => {
      const filters: PostFilters = {
        status: ['active'],
        species: ['dog'],
        tags: ['cute'],
      };
      expect(isPostFilters(filters)).toBe(true);
    });

    it('should return true for empty PostFilters', () => {
      expect(isPostFilters({})).toBe(true);
    });

    it('should return false for invalid types', () => {
      expect(isPostFilters({ status: 'not-array' })).toBe(false);
      expect(isPostFilters(null)).toBe(false);
    });
  });

  describe('isLostAlertFilters', () => {
    it('should return true for valid LostAlertFilters', () => {
      const filters: LostAlertFilters = {
        status: ['active'],
        radius: 10,
      };
      expect(isLostAlertFilters(filters)).toBe(true);
    });

    it('should return false for invalid types', () => {
      expect(isLostAlertFilters({ radius: 'not-number' })).toBe(false);
    });
  });

  describe('isModerationAction', () => {
    it('should return true for valid actions', () => {
      expect(isModerationAction('approve')).toBe(true);
      expect(isModerationAction('reject')).toBe(true);
      expect(isModerationAction('flag')).toBe(true);
    });

    it('should return false for invalid actions', () => {
      expect(isModerationAction('invalid')).toBe(false);
      expect(isModerationAction(123)).toBe(false);
    });
  });

  describe('isErrorLike', () => {
    it('should return true for Error objects', () => {
      expect(isErrorLike(new Error('test'))).toBe(true);
      expect(isErrorLike({ message: 'test' })).toBe(true);
    });

    it('should return false for objects without message', () => {
      expect(isErrorLike({})).toBe(false);
    });
  });

  describe('isHttpResponse', () => {
    it('should return true for valid HTTP responses', () => {
      expect(isHttpResponse({ status: 200, data: {} })).toBe(true);
    });

    it('should return false for invalid responses', () => {
      expect(isHttpResponse({})).toBe(false);
      expect(isHttpResponse({ status: '200' })).toBe(false);
    });
  });
});
