/**
 * Logger utility for structured logging throughout the mobile application
 * Provides different log levels and integration with analytics/monitoring
 * Location: apps/mobile/src/utils/logger.ts
 */

import { isDefined } from '@petspark/shared';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
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

type GlobalWithLogLevel = typeof globalThis & { __LOG_LEVEL__?: string }

type EnvWithLogLevel = NodeJS.ProcessEnv & { EXPO_PUBLIC_LOG_LEVEL?: string }

const parseLogLevel = (value?: string | null): LogLevel | undefined => {
  if (!value) return undefined
  const normalized = value.toString().trim().toUpperCase()
  if (!normalized) return undefined
  const resolved = (LogLevel as unknown as Record<string, LogLevel>)[normalized]
  return typeof resolved === 'number' ? resolved : undefined
}

const resolveDefaultLevel = (): LogLevel => {
  const env = (typeof process !== 'undefined' ? (process.env as EnvWithLogLevel) : undefined) ?? {}
  const envLevel = env.EXPO_PUBLIC_LOG_LEVEL ?? env.LOG_LEVEL ?? null
  const parsed = parseLogLevel(envLevel)
  if (isDefined(parsed)) {
    return parsed
  }

  const runtimeOverride = parseLogLevel((globalThis as GlobalWithLogLevel).__LOG_LEVEL__ ?? null)
  if (isDefined(runtimeOverride)) {
    return runtimeOverride
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return LogLevel.DEBUG
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
  if (isDefined(data)) extras.push(data)
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

    // Set log level from environment
    // In development: DEBUG, In production: INFO
    if (__DEV__) {
      this.level = LogLevel.DEBUG
      // Add dev handler for development (structured logging only, no console)
      this.addDevHandler()
    } else {
      // In production, default to INFO level
      this.level = LogLevel.INFO
    }
    // Add remote logging handler for both dev and production
    this.addRemoteHandler()
  }

  /**
   * Add dev handler for development mode
   * Uses structured logging without console calls
   * Logs are sent to remote endpoint for dev tools integration
   */
  private addDevHandler(): void {
    this.addHandler(async entry => {
      try {
        // Send all logs to dev endpoint in development
        const endpoint = process.env['EXPO_PUBLIC_DEV_LOG_ENDPOINT'] || '/api/logs/dev'

        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        }).catch(() => {
          // Silently fail - logging should not break the app
          // In dev mode, if endpoint is not available, logs are silently dropped
        })
      } catch {
        // Silently fail - logging should not break the app
      }
    })
  }

  /**
   * Add remote logging handler for production
   */
  private addRemoteHandler(): void {
    this.addHandler(async entry => {
      try {
        // Send to remote logging service in production
        const endpoint = process.env['EXPO_PUBLIC_ERROR_ENDPOINT'] || '/api/errors'

        // Only send errors and warnings in production to reduce noise
        if (entry.level >= LogLevel.WARN) {
          await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry),
          }).catch(() => {
            // Silently fail - logging should not break the app
          })
        }
      } catch {
        // Silently fail - logging should not break the app
      }
    })
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }

  addHandler(handler: LogHandler): void {
    this.handlers.add(handler)
  }

  private shouldLog(level: LogLevel): boolean {
    return this.level !== LogLevel.NONE && level >= this.level
  }

  private async log(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error
  ): Promise<void> {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      ...(this.context ? { context: this.context } : {}),
      ...(isDefined(data) ? { data } : {}),
      timestamp: new Date().toISOString(),
      ...(error ? { error } : {}),
    }

    // Execute handlers in parallel
    await Promise.all(
      this.handlers.map(handler => {
        try {
          return handler(entry)
        } catch {
          // Silently ignore handler failures to preserve deterministic builds
          // Handler implementations should handle their own errors internally
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
export const logger = new Logger('mobile-app')

// Factory function to create contextual loggers
export function createLogger(context: string): Logger {
  return new Logger(context)
}

// Export convenience functions
export const log = {
  debug: (message: string, data?: unknown) => logger.debug(message, data),
  info: (message: string, data?: unknown) => logger.info(message, data),
  warn: (message: string, data?: unknown) => logger.warn(message, data),
  error: (message: string, error?: Error | unknown, data?: unknown) =>
    logger.error(message, error, data),
}
