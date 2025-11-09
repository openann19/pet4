export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  [key: string]: unknown
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: Error | unknown, context?: LogContext): void
}

class SilentLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

class RemoteLogger implements Logger {
  constructor(
    private readonly name: string,
    private readonly level: LogLevel = 'info',
    private readonly endpoint: string = '/api/logs'
  ) {}

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }

  private async sendLog(
    level: LogLevel,
    message: string,
    error?: Error | unknown,
    context?: LogContext
  ): Promise<void> {
    if (!this.shouldLog(level)) return

    try {
      const logEntry = {
        level,
        name: this.name,
        message,
        timestamp: new Date().toISOString(),
        ...(error
          ? {
              error:
                error instanceof Error
                  ? { message: error.message, stack: error.stack, name: error.name }
                  : { error: String(error) },
            }
          : {}),
        ...(context ? { context } : {}),
      }

      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      }).catch(() => {
        // Silently fail - logging should not break the app
      })
    } catch {
      // Silently fail - logging should not break the app
    }
  }

  debug(message: string, context?: LogContext): void {
    void this.sendLog('debug', message, undefined, context)
  }

  info(message: string, context?: LogContext): void {
    void this.sendLog('info', message, undefined, context)
  }

  warn(message: string, context?: LogContext): void {
    void this.sendLog('warn', message, undefined, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    void this.sendLog('error', message, error, context)
  }
}

let defaultLogger: Logger = new SilentLogger()

export function createLogger(name: string, level: LogLevel = 'info'): Logger {
  const endpoint = (typeof process !== 'undefined' && process.env?.['LOG_ENDPOINT']) || '/api/logs'
  return new RemoteLogger(name, level, endpoint)
}

export function setDefaultLogger(logger: Logger): void {
  defaultLogger = logger
}

export function getDefaultLogger(): Logger {
  return defaultLogger
}
