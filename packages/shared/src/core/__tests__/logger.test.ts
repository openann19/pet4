import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLogger, getDefaultLogger, setDefaultLogger, type Logger } from '../logger.js'

describe('Logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create a logger instance', () => {
    const logger = createLogger('test')
    expect(logger).toBeDefined()
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })

  it('should log info messages', () => {
    const logger = createLogger('test', 'info')
    logger.info('test message', { key: 'value' })
    expect(console.info).toHaveBeenCalledWith('[test] test message', { key: 'value' })
  })

  it('should log error messages with error objects', () => {
    const logger = createLogger('test', 'error')
    const error = new Error('test error')
    logger.error('error occurred', error, { context: 'test' })
    expect(console.error).toHaveBeenCalledWith('[test] error occurred', error, { context: 'test' })
  })

  it('should respect log level', () => {
    const logger = createLogger('test', 'error')
    logger.debug('debug message')
    logger.info('info message')
    expect(console.debug).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
  })

  it('should set and get default logger', () => {
    const customLogger: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }

    setDefaultLogger(customLogger)
    const retrieved = getDefaultLogger()
    expect(retrieved).toBe(customLogger)
  })
})

