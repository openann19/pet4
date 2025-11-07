import { isTruthy, isDefined } from '@petspark/shared';

/**
 * Logger utility for structured logging throughout the application
 * Provides different log levels and integration with analytics/monitoring
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  data?: unknown
  timestamp: string
  error?: Error
}

type LogHandler = (entry: LogEntry) => void | Promise<void>

type ImportMetaWithEnv = ImportMeta & {
  env?: Record<string, string | undefined>
}

const parseLogLevel = (level?: string | null): LogLevel | undefined => {
  if (!level) return undefined
  const normalized = level.toString().trim().toUpperCase()
  if (!normalized) return undefined
  const value = (LogLevel as unknown as Record<string, LogLevel>)[normalized]
  return typeof value === 'number' ? value : undefined
}

const resolveDefaultLevel = (): LogLevel => {
  let envLevel: string | undefined

  if (typeof import.meta !== 'undefined') {
    const metaEnv = (import.meta as ImportMetaWithEnv).env
    envLevel = metaEnv?.VITE_LOG_LEVEL ?? metaEnv?.LOG_LEVEL
    const parsed = parseLogLevel(envLevel)
    if (isDefined(parsed)) {
      return parsed
    }

    const mode = metaEnv?.MODE
    if (mode && mode !== 'production') {
      return LogLevel.DEBUG
    }
    if (mode === 'production') {
      return LogLevel.INFO
    }
  }

  if (typeof process !== 'undefined' && isTruthy(process.env)) {
    envLevel = process.env.LOG_LEVEL ?? process.env.VITE_LOG_LEVEL ?? undefined
    const parsed = parseLogLevel(envLevel)
    if (isDefined(parsed)) {
      return parsed
    }
  }

  return LogLevel.INFO
}

const globalHandlers = new Set<LogHandler>()

const consoleHandler: LogHandler = (entry) => {
  const { level, message, context, data, error, timestamp } = entry
  const prefixParts = [timestamp]
  if (context) {
    prefixParts.push(context)
  }
  const prefix = prefixParts.length > 0 ? `[${prefixParts.join(' ')}]` : ''
  const extras: unknown[] = []
  if (data !== undefined) extras.push(data)
  if (error) extras.push(error)

  switch (level) {
    case LogLevel.DEBUG:
      console.debug(prefix, message, ...extras)
      break
    case LogLevel.INFO:
      console.info(prefix, message, ...extras)
      break
    case LogLevel.WARN:
      console.warn(prefix, message, ...extras)
      break
    case LogLevel.ERROR:
      console.error(prefix, message, ...extras)
      break
    default:
      console.log(prefix, message, ...extras)
  }
}

globalHandlers.add(consoleHandler)

export function registerGlobalLogHandler(handler: LogHandler): void {
  globalHandlers.add(handler)
}

class Logger {
  private level: LogLevel
  private handlers: Set<LogHandler> = new Set()
  private context: string = ''

  constructor(context?: string) {
    this.context = context || ''
    this.level = resolveDefaultLevel()

    if (typeof window !== 'undefined') {
      const runtimeLevel = (window as Window & { __LOG_LEVEL__?: string }).__LOG_LEVEL__
      const parsed = parseLogLevel(runtimeLevel ?? null)
      if (isDefined(parsed)) {
        this.level = parsed
      }
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }

  addHandler(handler: LogHandler): void {
    this.handlers.add(handler)
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level && this.level !== LogLevel.NONE
  }

  private async log(level: LogLevel, message: string, data?: unknown, error?: Error): Promise<void> {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      ...(this.context ? { context: this.context } : {}),
      ...(data !== undefined ? { data } : {}),
      timestamp: new Date().toISOString(),
      ...(error ? { error } : {}),
    }

    const handlers = new Set<LogHandler>([...globalHandlers, ...this.handlers])

    await Promise.all(
      Array.from(handlers).map(handler => {
        try {
          return handler(entry)
        } catch (handlerError) {
          const err = handlerError instanceof Error ? handlerError : new Error(String(handlerError))
          console.error('[logger] handler failure', err)
          return Promise.resolve()
        }
      })
    )
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data).catch(() => {})
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data).catch(() => {})
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data).catch(() => {})
  }

  error(message: string, error?: Error | unknown, data?: unknown): void {
    const err = error instanceof Error ? error : error ? new Error(String(error)) : undefined
    this.log(LogLevel.ERROR, message, data, err).catch(() => {})
  }
}

// Create default logger instance
export const logger = new Logger('app')

// Factory function to create contextual loggers
export function createLogger(context: string): Logger {
  return new Logger(context)
}

// Export convenience functions
export const log = {
  debug: (message: string, data?: unknown) => { logger.debug(message, data); },
  info: (message: string, data?: unknown) => { logger.info(message, data); },
  warn: (message: string, data?: unknown) => { logger.warn(message, data); },
  error: (message: string, error?: Error | unknown, data?: unknown) => { logger.error(message, error, data); },
}
