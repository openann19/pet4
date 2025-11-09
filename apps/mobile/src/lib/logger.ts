/**
 * Logger utility for structured logging throughout the application
 * Provides different log levels and integration with analytics/monitoring
 *
 * Location: apps/mobile/src/lib/logger.ts
 */

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

class Logger {
  private level: LogLevel = LogLevel.NONE
  private handlers: LogHandler[] = []
  private context: string = ''

  constructor(context?: string) {
    this.context = context || ''

    // Set log level from environment
    // In development: DEBUG, In production: INFO
    if (__DEV__) {
      this.level = LogLevel.DEBUG
      // Add console handler for development
      this.addConsoleHandler()
    } else {
      // In production, default to INFO level
      this.level = LogLevel.INFO
      // Add remote logging handler for production
      this.addRemoteHandler()
    }
  }

  /**
   * Add console handler for development only
   */
  private addConsoleHandler(): void {
    this.addHandler(entry => {
      const prefix = entry.context ? `[${entry.context}]` : ''
      const message = `${prefix} ${entry.message}`

      switch (entry.level) {
        case LogLevel.DEBUG:
          // eslint-disable-next-line no-console
          console.debug(message, entry.data ?? '')
          break
        case LogLevel.INFO:
          // eslint-disable-next-line no-console
          console.info(message, entry.data ?? '')
          break
        case LogLevel.WARN:
           
          console.warn(message, entry.data ?? '')
          break
        case LogLevel.ERROR:
           
          console.error(message, entry.error ?? entry.data ?? '')
          break
        default:
          break
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
    this.handlers.push(handler)
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level
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
      ...(data !== undefined ? { data } : {}),
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
export const logger = new Logger()

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
