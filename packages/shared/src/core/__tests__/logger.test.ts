import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLogger, getDefaultLogger, setDefaultLogger, type Logger } from '../logger.js'

describe('Logger', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true })
    global.fetch = fetchMock
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

  it('should log info messages', async () => {
    const logger = createLogger('test', 'info')
    logger.info('test message', { key: 'value' })

    // Wait for async log to complete
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/logs',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('test message'),
      })
    )

    const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)
    expect(callBody).toMatchObject({
      level: 'info',
      name: 'test',
      message: 'test message',
      context: { key: 'value' },
    })
  })

  it('should log error messages with error objects', async () => {
    const logger = createLogger('test', 'error')
    const error = new Error('test error')
    logger.error('error occurred', error, { context: 'test' })

    // Wait for async log to complete
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchMock).toHaveBeenCalled()

    const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)
    expect(callBody).toMatchObject({
      level: 'error',
      name: 'test',
      message: 'error occurred',
      context: { context: 'test' },
      error: {
        message: 'test error',
        name: 'Error',
      },
    })
  })

  it('should respect log level', async () => {
    const logger = createLogger('test', 'error')
    logger.debug('debug message')
    logger.info('info message')

    // Wait for async logs to complete
    await new Promise((resolve) => setTimeout(resolve, 0))

    // debug and info should not be sent when level is 'error'
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should set and get default logger', () => {
    const customLogger: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }

    setDefaultLogger(customLogger)
    const retrieved = getDefaultLogger()
    expect(retrieved).toBe(customLogger)
  })
})
