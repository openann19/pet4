import { describe, it, expect } from 'vitest';
import { isError, normalizeError, getErrorMessage } from '../error-utils';

describe('error-utils', () => {
  describe('isError', () => {
    it('should return true for Error instances', () => {
      const error = new Error('test error');
      expect(isError(error)).toBe(true);
    });

    it('should return true for custom Error subclasses', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const customError = new CustomError('custom error');
      expect(isError(customError)).toBe(true);
    });

    it('should return false for non-Error values', () => {
      expect(isError('string error')).toBe(false);
      expect(isError(123)).toBe(false);
      expect(isError(true)).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
      expect(isError({})).toBe(false);
      expect(isError([])).toBe(false);
    });
  });

  describe('normalizeError', () => {
    it('should return Error instances unchanged', () => {
      const originalError = new Error('original error');
      const normalized = normalizeError(originalError);

      expect(normalized).toBe(originalError);
      expect(normalized.message).toBe('original error');
    });

    it('should convert string errors to Error instances', () => {
      const stringError = 'string error message';
      const normalized = normalizeError(stringError);

      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('string error message');
    });

    it('should handle null and undefined errors', () => {
      const nullError = normalizeError(null);
      const undefinedError = normalizeError(undefined);

      expect(nullError).toBeInstanceOf(Error);
      expect(nullError.message).toBe('Unknown error');

      expect(undefinedError).toBeInstanceOf(Error);
      expect(undefinedError.message).toBe('Unknown error');
    });

    it('should convert object errors to Error instances', () => {
      const objectError = { code: 'ERROR_CODE', message: 'Object error' };
      const normalized = normalizeError(objectError);

      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe(JSON.stringify(objectError));
    });

    it('should convert number errors to Error instances', () => {
      const numberError = 500;
      const normalized = normalizeError(numberError);

      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('500');
    });

    it('should convert boolean errors to Error instances', () => {
      const booleanError = true;
      const normalized = normalizeError(booleanError);

      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('true');
    });

    it('should handle circular object references gracefully', () => {
      const circularError: any = { message: 'circular' };
      circularError.self = circularError;

      const normalized = normalizeError(circularError);

      expect(normalized).toBeInstanceOf(Error);
      // Should not throw and should have some message
      expect(typeof normalized.message).toBe('string');
    });

    it('should handle objects that cannot be stringified', () => {
      const problematicObject = {};
      Object.defineProperty(problematicObject, 'problematic', {
        get() {
          throw new Error('Cannot access this property');
        },
        enumerable: true,
      });

      const normalized = normalizeError(problematicObject);

      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('Failed to convert error to string');
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error instances', () => {
      const error = new Error('error message');
      const message = getErrorMessage(error);

      expect(message).toBe('error message');
    });

    it('should return string errors unchanged', () => {
      const stringError = 'string error message';
      const message = getErrorMessage(stringError);

      expect(message).toBe('string error message');
    });

    it('should handle null and undefined errors', () => {
      const nullMessage = getErrorMessage(null);
      const undefinedMessage = getErrorMessage(undefined);

      expect(nullMessage).toBe('Unknown error');
      expect(undefinedMessage).toBe('Unknown error');
    });

    it('should convert object errors to JSON strings', () => {
      const objectError = { code: 'ERROR_CODE', message: 'Object error' };
      const message = getErrorMessage(objectError);

      expect(message).toBe(JSON.stringify(objectError));
    });

    it('should convert number errors to strings', () => {
      const numberError = 500;
      const message = getErrorMessage(numberError);

      expect(message).toBe('500');
    });

    it('should convert boolean errors to strings', () => {
      const booleanError = true;
      const message = getErrorMessage(booleanError);

      expect(message).toBe('true');
    });

    it('should handle circular object references gracefully', () => {
      const circularError: any = { message: 'circular' };
      circularError.self = circularError;

      const message = getErrorMessage(circularError);

      // Should not throw and should return some string
      expect(typeof message).toBe('string');
    });

    it('should handle objects that cannot be stringified', () => {
      const problematicObject = {};
      Object.defineProperty(problematicObject, 'problematic', {
        get() {
          throw new Error('Cannot access this property');
        },
        enumerable: true,
      });

      const message = getErrorMessage(problematicObject);

      expect(message).toBe('Failed to convert error to string');
    });

    it('should handle symbol errors', () => {
      const symbolError = Symbol('test');
      const message = getErrorMessage(symbolError);

      expect(message).toBe('Unknown error type');
    });

    it('should handle function errors', () => {
      const functionError = function test() {
        return 'function';
      };
      const message = getErrorMessage(functionError);

      expect(message).toBe('Unknown error type');
    });
  });

  describe('integration tests', () => {
    it('should work together consistently', () => {
      const testCases = [
        new Error('standard error'),
        'string error',
        { code: 'TEST', message: 'object error' },
        404,
        true,
        null,
        undefined,
      ];

      testCases.forEach((testCase, index) => {
        const normalized = normalizeError(testCase);
        const message = getErrorMessage(testCase);

        expect(normalized).toBeInstanceOf(Error);
        expect(typeof message).toBe('string');

        // The normalized error's message should match getErrorMessage for the same input
        expect(normalized.message).toBe(message);
      });
    });
  });
});
