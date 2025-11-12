import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createLogger, LogLevel } from '../logger';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;

beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
  console.info = vi.fn();
  console.debug = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
  console.debug = originalConsoleDebug;
});

describe('Logger', () => {
  describe('createLogger', () => {
    it('should create a logger instance', () => {
      const logger = createLogger('test');
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should log debug messages', () => {
      const logger = createLogger('test', LogLevel.DEBUG);
      logger.debug('Debug message');
      expect(console.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      const logger = createLogger('test', LogLevel.INFO);
      logger.info('Info message');
      expect(console.info).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      const logger = createLogger('test', LogLevel.WARN);
      logger.warn('Warning message');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const logger = createLogger('test', LogLevel.ERROR);
      logger.error('Error message');
      expect(console.error).toHaveBeenCalled();
    });

    it('should respect log level', () => {
      const logger = createLogger('test', LogLevel.WARN);
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should set log level', () => {
      const logger = createLogger('test', LogLevel.ERROR);
      logger.setLevel(LogLevel.DEBUG);
      logger.debug('Debug message');
      expect(console.debug).toHaveBeenCalled();
    });

    it('should include context in logs', () => {
      const logger = createLogger('test-context', LogLevel.DEBUG);
      logger.debug('Debug message');
      const call = vi.mocked(console.debug).mock.calls[0];
      expect(call[0]).toContain('test-context');
    });

    it('should handle error objects', () => {
      const logger = createLogger('test', LogLevel.ERROR);
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
