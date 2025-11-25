/**
 * Simple logger utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private name: string;

  constructor(name = 'default') {
    this.name = name;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const formattedMessage = `[${this.name}] ${level.toUpperCase()}: ${message}`;

    switch (level) {
      case 'debug':
        console.warn(formattedMessage, data);
        break;
      case 'info':
        console.warn(formattedMessage, data);
        break;
      case 'warn':
        console.warn(formattedMessage, data);
        break;
      case 'error':
        console.error(formattedMessage, data);
        break;
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }
}

// Create default logger instance
const logger = new Logger('core');

export default logger;

// Export Logger class for creating named loggers
export { Logger };
export type { LogLevel, LogEntry };
