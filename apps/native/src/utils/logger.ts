/**
 * Logger utility for structured logging throughout the React Native application
 * Provides different log levels and integration with analytics/monitoring
 * Default mode is silent (no-op) to preserve deterministic builds per project rules
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
  error?: Error;
}

type LogHandler = (entry: LogEntry) => void | Promise<void>;

class Logger {
  private level: LogLevel = LogLevel.NONE;
  private handlers: LogHandler[] = [];
  private context: string = '';

  constructor(context?: string) {
    this.context = context || '';

    // Default mode is silent (no-op logger) to preserve deterministic builds
    // Log level can be configured at runtime via setLevel() method
    // Handlers can be added via addHandler() for routing to file, CI pipeline, etc.
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private async log(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      ...(this.context ? { context: this.context } : {}),
      ...(data !== undefined ? { data } : {}),
      timestamp: new Date().toISOString(),
      ...(error ? { error } : {}),
    };

    // Execute handlers in parallel
    await Promise.all(
      this.handlers.map((handler) => {
        try {
          return handler(entry);
        } catch {
          // Silently ignore handler failures to preserve deterministic builds
          // Handler implementations should handle their own errors internally
          return Promise.resolve();
        }
      })
    );
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data).catch(() => {});
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data).catch(() => {});
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data).catch(() => {});
  }

  error(message: string, error?: Error | unknown, data?: unknown): void {
    const err = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
    this.log(LogLevel.ERROR, message, data, err).catch(() => {});
  }
}

// Create default logger instance
export const logger = new Logger();

// Factory function to create contextual loggers
export function createLogger(context: string): Logger {
  return new Logger(context);
}

// Export convenience functions
export const log = {
  debug: (message: string, data?: unknown) => logger.debug(message, data),
  info: (message: string, data?: unknown) => logger.info(message, data),
  warn: (message: string, data?: unknown) => logger.warn(message, data),
  error: (message: string, error?: Error | unknown, data?: unknown) =>
    logger.error(message, error, data),
};
