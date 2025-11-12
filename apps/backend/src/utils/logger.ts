/**
 * Logger Utility
 *
 * Structured logging for backend services.
 * In production, this should route to a proper logging service (e.g., Winston, Pino).
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  [key: string]: unknown;
}

interface LoggerConfig {
  silent?: boolean;
  level?: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private context: string;
  private config: LoggerConfig;

  constructor(context: string, config: LoggerConfig = {}) {
    this.context = context;
    this.config = {
      silent: process.env.NODE_ENV === 'test' || config.silent === true,
      level: (process.env.LOG_LEVEL as LogLevel) ?? config.level ?? 'info',
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.config.silent === true) {
      return false;
    }
    const currentLevel = LOG_LEVELS[this.config.level ?? 'info'] ?? 1;
    const messageLevel = LOG_LEVELS[level] ?? 1;
    return messageLevel >= currentLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}${contextStr}`;
  }

  private write(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formatted = this.formatMessage(level, message, context);

    if (process.env.NODE_ENV === 'production') {
      // In production, route to structured logging service
      // For now, use process.stderr for errors, stdout for others
      if (level === 'error') {
        process.stderr.write(`${formatted}\n`);
      } else {
        process.stdout.write(`${formatted}\n`);
      }
    } else {
      // Development: use console methods for better formatting
      switch (level) {
        case 'error':
          process.stderr.write(`${formatted}\n`);
          break;
        case 'warn':
          process.stderr.write(`${formatted}\n`);
          break;
        default:
          process.stdout.write(`${formatted}\n`);
          break;
      }
    }
  }

  info(message: string, context?: LogContext): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : new Error(String(error));
    const errorContext: LogContext = {
      ...context,
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
    };
    this.write('error', message, errorContext);
  }

  debug(message: string, error?: Error | unknown, context?: LogContext): void {
    if (error !== undefined) {
      const errorContext: LogContext = {
        ...context,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : { message: String(error) },
      };
      this.write('debug', message, errorContext);
    } else {
      this.write('debug', message, context);
    }
  }
}

export function createLogger(context: string, config?: LoggerConfig): Logger {
  return new Logger(context, config);
}
