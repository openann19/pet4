/**
 * Script Logger - For utility scripts that need stdout/stderr output
 * Provides structured logging that writes to process.stdout/stderr
 */

/* eslint-env node */

import { LogLevel } from './logger';

class ScriptLogger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private log(level: LogLevel, message: string, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${LogLevel[level]}]`;

    if (level === LogLevel.ERROR) {
      process.stderr.write(`${prefix} ${message}\n`);
      if (error) {
        process.stderr.write(`${error.stack ?? error.message}\n`);
      }
    } else {
      process.stdout.write(`${prefix} ${message}\n`);
    }
  }

  info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }

  error(message: string, error?: Error): void {
    this.log(LogLevel.ERROR, message, error);
  }

  // Direct stdout/stderr for scripts that need raw output
  write(message: string): void {
    process.stdout.write(message);
  }

  writeLine(message: string): void {
    process.stdout.write(`${message}\n`);
  }

  writeError(message: string): void {
    process.stderr.write(message);
  }

  writeErrorLine(message: string): void {
    process.stderr.write(`${message}\n`);
  }
}

export const scriptLogger = new ScriptLogger();
