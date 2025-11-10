import { appendFile, ensureDir } from 'fs-extra'
import { dirname } from 'path'

/**
 * Log level
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

/**
 * Log entry
 */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: Record<string, unknown>
  error?: {
    message: string
    stack?: string
  }
}

/**
 * Spec logger interface
 */
export interface SpecLogger {
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, data?: Record<string, unknown>): void
  debug(message: string, data?: Record<string, unknown>): void
}

/**
 * File-based spec logger
 */
export class FileSpecLogger implements SpecLogger {
  private readonly logFile: string

  constructor(logFile: string = 'spec.log') {
    this.logFile = logFile
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    try {
      await ensureDir(dirname(this.logFile))
      const line = JSON.stringify(entry) + '\n'
      await appendFile(this.logFile, line, 'utf-8')
    } catch {
      // Silently fail if logging fails
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      data,
    }
    void this.writeLog(entry)
  }

  warn(message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      data,
    }
    void this.writeLog(entry)
  }

  error(message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      data,
      error: data?.error as { message: string; stack?: string } | undefined,
    }
    void this.writeLog(entry)
  }

  debug(message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      data,
    }
    void this.writeLog(entry)
  }
}

/**
 * No-op logger for testing
 */
export class NoOpLogger implements SpecLogger {
  info(): void {
    // No-op
  }

  warn(): void {
    // No-op
  }

  error(): void {
    // No-op
  }

  debug(): void {
    // No-op
  }
}

/**
 * Create a logger instance
 */
export function createLogger(logFile?: string): SpecLogger {
  if (process.env.NODE_ENV === 'test') {
    return new NoOpLogger()
  }
  return new FileSpecLogger(logFile)
}
