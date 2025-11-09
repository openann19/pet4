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

class ConsoleLogger implements Logger {
  constructor(
    private readonly name: string,
    private readonly level: LogLevel = 'info'
  ) {}

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.debug(`[${this.name}] ${message}`, context ?? '')
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(`[${this.name}] ${message}`, context ?? '')
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(`[${this.name}] ${message}`, context ?? '')
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorDetails = error instanceof Error ? error : { error }
      console.error(`[${this.name}] ${message}`, errorDetails, context ?? '')
    }
  }
}

let defaultLogger: Logger = new SilentLogger()

export function createLogger(name: string, level: LogLevel = 'info'): Logger {
  return new ConsoleLogger(name, level)
}

export function setDefaultLogger(logger: Logger): void {
  defaultLogger = logger
}

export function getDefaultLogger(): Logger {
  return defaultLogger
}
