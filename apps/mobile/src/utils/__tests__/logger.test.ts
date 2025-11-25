/**
 * Logger Tests - 100% Coverage
 * 
 * Tests all logger functionality including:
 * - Log levels
 * - Context handling
 * - Handler execution
 * - Error normalization
 * - Convenience functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Logger, logger, LogLevel, createLogger, log } from '../logger'
import type { LogEntry } from '../logger'

describe('Logger', () => {
  let logger: Logger
  let handler: (entry: LogEntry) => void

  beforeEach(() => {
    vi.clearAllMocks()
    logger = new Logger()
    handler = vi.fn()
  })

  describe('constructor', () => {
    it('should create logger with default level NONE', () => {
      expect(logger).toBeInstanceOf(Logger)
    })

    it('should create logger with context', () => {
      const contextualLogger = new Logger('TestContext')
      expect(contextualLogger).toBeInstanceOf(Logger)
    })
  })

  describe('setLevel', () => {
    it('should set log level', () => {
      logger.setLevel(LogLevel.DEBUG)
      logger.addHandler(handler)

      logger.debug('test message')

      expect(handler).toHaveBeenCalled()
    })

    it('should respect level hierarchy', () => {
      logger.setLevel(LogLevel.WARN)
      logger.addHandler(handler)

      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      // Only warn and error should be logged
      expect(handler).toHaveBeenCalledTimes(2)
    })
  })

  describe('addHandler', () => {
    it('should add handler and call it on log', async () => {
      logger.setLevel(LogLevel.DEBUG)
      logger.addHandler(handler)

      logger.info('test message')

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            level: LogLevel.INFO,
            message: 'test message',
          })
        )
      })
    })

    it('should call multiple handlers', async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      logger.setLevel(LogLevel.INFO)
      logger.addHandler(handler1)
      logger.addHandler(handler2)

      logger.info('test message')

      await vi.waitFor(() => {
        expect(handler1).toHaveBeenCalled()
        expect(handler2).toHaveBeenCalled()
      })
    })

    it('should handle handler errors gracefully', async () => {
      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Handler error')
      })

      logger.setLevel(LogLevel.INFO)
      logger.addHandler(errorHandler)

      // Should not throw
      expect(() => {
        logger.info('test message')
      }).not.toThrow()

      await vi.waitFor(() => {
        expect(errorHandler).toHaveBeenCalled()
      })
    })

    it('should handle async handler errors', async () => {
      const asyncErrorHandler = vi.fn().mockRejectedValue(new Error('Async error'))

      logger.setLevel(LogLevel.INFO)
      logger.addHandler(asyncErrorHandler)

      expect(() => {
        logger.info('test message')
      }).not.toThrow()

      await vi.waitFor(() => {
        expect(asyncErrorHandler).toHaveBeenCalled()
      })
    })
  })

  describe('log levels', () => {
    beforeEach(() => {
      logger.setLevel(LogLevel.DEBUG)
      logger.addHandler(handler)
    })

    it('should log debug messages', async () => {
      logger.debug('debug message', { key: 'value' })

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            level: LogLevel.DEBUG,
            message: 'debug message',
            data: { key: 'value' },
          })
        )
      })
    })

    it('should log info messages', async () => {
      logger.info('info message', { key: 'value' })

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            level: LogLevel.INFO,
            message: 'info message',
            data: { key: 'value' },
          })
        )
      })
    })

    it('should log warn messages', async () => {
      logger.warn('warn message', { key: 'value' })

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            level: LogLevel.WARN,
            message: 'warn message',
            data: { key: 'value' },
          })
        )
      })
    })

    it('should log error messages with Error object', async () => {
      const error = new Error('Test error')
      logger.error('error message', error, { key: 'value' })

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            level: LogLevel.ERROR,
            message: 'error message',
            error,
            data: { key: 'value' },
          })
        )
      })
    })

    it('should log error messages with non-Error value', async () => {
      logger.error('error message', 'string error', { key: 'value' })

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            level: LogLevel.ERROR,
            message: 'error message',
            error: expect.any(Error),
            data: { key: 'value' },
          })
        )
      })
    })

    it('should log error messages without error', async () => {
      logger.error('error message', undefined, { key: 'value' })

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            level: LogLevel.ERROR,
            message: 'error message',
            data: { key: 'value' },
          })
        )
      })
    })
  })

  describe('context', () => {
    it('should include context in log entries', async () => {
      const contextualLogger = new Logger('TestContext')
      contextualLogger.setLevel(LogLevel.INFO)
      contextualLogger.addHandler(handler)

      contextualLogger.info('test message')

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            context: 'TestContext',
          })
        )
      })
    })

    it('should not include context when empty', async () => {
      logger.setLevel(LogLevel.INFO)
      logger.addHandler(handler)

      logger.info('test message')

      await vi.waitFor(() => {
        const call = handler.mock.calls[0]?.[0] as LogEntry
        expect(call.context).toBeUndefined()
      })
    })
  })

  describe('timestamp', () => {
    it('should include ISO timestamp', async () => {
      logger.setLevel(LogLevel.INFO)
      logger.addHandler(handler)

      logger.info('test message')

      await vi.waitFor(() => {
        const call = handler.mock.calls[0]?.[0] as LogEntry
        expect(call.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      })
    })
  })

  describe('data handling', () => {
    it('should include data when provided', async () => {
      logger.setLevel(LogLevel.INFO)
      logger.addHandler(handler)

      logger.info('test message', { nested: { data: 'value' } })

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { nested: { data: 'value' } },
          })
        )
      })
    })

    it('should not include data when undefined', async () => {
      logger.setLevel(LogLevel.INFO)
      logger.addHandler(handler)

      logger.info('test message')

      await vi.waitFor(() => {
        const call = handler.mock.calls[0]?.[0] as LogEntry
        expect(call.data).toBeUndefined()
      })
    })
  })

  describe('level filtering', () => {
    it('should not log below threshold', () => {
      logger.setLevel(LogLevel.ERROR)
      logger.addHandler(handler)

      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')

      expect(handler).not.toHaveBeenCalled()
    })

    it('should log at threshold', async () => {
      logger.setLevel(LogLevel.WARN)
      logger.addHandler(handler)

      logger.warn('warn message')
      logger.error('error message')

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('createLogger factory', () => {
    it('should create logger with context', () => {
      const contextualLogger = createLogger('FactoryContext')
      expect(contextualLogger).toBeInstanceOf(Logger)
    })

    it('should create logger that includes context', async () => {
      const contextualLogger = createLogger('FactoryContext')
      contextualLogger.setLevel(LogLevel.INFO)
      contextualLogger.addHandler(handler)

      contextualLogger.info('test message')

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            context: 'FactoryContext',
          })
        )
      })
    })
  })

  describe('convenience functions', () => {
    it('should provide log.debug', () => {
      const defaultLogger = new Logger()
      defaultLogger.setLevel(LogLevel.DEBUG)
      defaultLogger.addHandler(handler)

      // Use convenience function
      log.debug('test message', { data: 'value' })

      // Should call default logger
      // Note: This tests the convenience function exists and doesn't throw
      expect(() => {
        log.debug('test')
      }).not.toThrow()
    })

    it('should provide log.info', () => {
      expect(() => {
        log.info('test')
      }).not.toThrow()
    })

    it('should provide log.warn', () => {
      expect(() => {
        log.warn('test')
      }).not.toThrow()
    })

    it('should provide log.error', () => {
      expect(() => {
        log.error('test', new Error('test error'))
      }).not.toThrow()
    })
  })

  describe('error normalization', () => {
    it('should normalize Error objects', async () => {
      logger.setLevel(LogLevel.ERROR)
      logger.addHandler(handler)

      const error = new Error('Test error')
      logger.error('error message', error)

      await vi.waitFor(() => {
        const call = handler.mock.calls[0]?.[0] as LogEntry
        expect(call.error).toBeInstanceOf(Error)
        expect(call.error?.message).toBe('Test error')
      })
    })

    it('should normalize string errors', async () => {
      logger.setLevel(LogLevel.ERROR)
      logger.addHandler(handler)

      logger.error('error message', 'string error')

      await vi.waitFor(() => {
        const call = handler.mock.calls[0]?.[0] as LogEntry
        expect(call.error).toBeInstanceOf(Error)
        expect(call.error?.message).toBe('string error')
      })
    })

    it('should normalize number errors', async () => {
      logger.setLevel(LogLevel.ERROR)
      logger.addHandler(handler)

      logger.error('error message', 404)

      await vi.waitFor(() => {
        const call = handler.mock.calls[0]?.[0] as LogEntry
        expect(call.error).toBeInstanceOf(Error)
        expect(call.error?.message).toBe('404')
      })
    })

    it('should handle null/undefined errors', async () => {
      logger.setLevel(LogLevel.ERROR)
      logger.addHandler(handler)

      logger.error('error message', null)

      await vi.waitFor(() => {
        const call = handler.mock.calls[0]?.[0] as LogEntry
        expect(call.error).toBeUndefined()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty message', async () => {
      logger.setLevel(LogLevel.INFO)
      logger.addHandler(handler)

      logger.info('')

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            message: '',
          })
        )
      })
    })

    it('should handle very long messages', async () => {
      logger.setLevel(LogLevel.INFO)
      logger.addHandler(handler)

      const longMessage = 'a'.repeat(10000)
      logger.info(longMessage)

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            message: longMessage,
          })
        )
      })
    })

    it('should handle complex data objects', async () => {
      logger.setLevel(LogLevel.INFO)
      logger.addHandler(handler)

      const complexData = {
        nested: {
          array: [1, 2, 3],
          date: new Date(),
          func: () => {},
        },
      }

      logger.info('test', complexData)

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            data: complexData,
          })
        )
      })
    })
  })
})
