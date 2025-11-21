/**
 * Logger utility for structured logging throughout the application
 * Provides different log levels and integration with analytics/monitoring
 */

export enum LogLevel {
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
  NONE = 100,
}

interface LogRecord {
  level: LogLevel;
  message: string;
  args: unknown[];
  ts: number;
  context?: string;
  data?: unknown;
  error?: Error;
  timestamp: string;
}

type LogHandler = (record: LogRecord) => void | Promise<void>;

interface SentryInstance {
  init: (config: { dsn: string; tracesSampleRate: number }) => void;
  withScope: (
    callback: (scope: {
      setLevel: (level: string) => void;
      setTag: (key: string, value: string) => void;
    }) => void
  ) => void;
  captureException: (error: Error) => void;
  captureMessage: (message: string) => void;
}

let sentryInitPromise: Promise<SentryInstance | null> | null = null;

function resolveSentry(): Promise<SentryInstance | null> {
  if (sentryInitPromise) return sentryInitPromise;

  if (typeof window === 'undefined') {
    sentryInitPromise = Promise.resolve(null);
    return sentryInitPromise;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    sentryInitPromise = Promise.resolve(null);
    return sentryInitPromise;
  }

  const sentryImport = import('@sentry/browser') as Promise<unknown>;

  sentryInitPromise = sentryImport
    .then((module) => {
      // Type guard for Sentry module
      function isSentryInstance(m: unknown): m is SentryInstance {
        return (
          typeof m === 'object' &&
          m !== null &&
          'init' in m &&
          typeof (m as { init?: unknown }).init === 'function'
        );
      }

      if (isSentryInstance(module)) {
        if (typeof module.init === 'function') {
          module.init({ dsn, tracesSampleRate: 0.1 });
        }
        return module;
      }
      return null;
    })
    .catch(() => null);

  return sentryInitPromise;
}

interface LoggerOptions {
  readonly enableSentry?: boolean;
}

const globalHandlers = new Set<LogHandler>();

const consoleHandler: LogHandler = (entry) => {
  const { level, message, context, data, error, timestamp } = entry;
  const prefixParts = [timestamp];
  if (context) {
    prefixParts.push(context);
  }
  const prefix = prefixParts.length > 0 ? `[${prefixParts.join(' ')}]` : '';
  const extras: unknown[] = [];
  if (data !== undefined) extras.push(data);
  if (error) extras.push(error);

  switch (level) {
    case LogLevel.DEBUG:
      console.debug(prefix, message, ...extras);
      break;
    case LogLevel.INFO:
      console.info(prefix, message, ...extras);
      break;
    case LogLevel.WARN:
      console.warn(prefix, message, ...extras);
      break;
    case LogLevel.ERROR:
      console.error(prefix, message, ...extras);
      break;
    default:
      console.log(prefix, message, ...extras);
  }
};

globalHandlers.add(consoleHandler);

export function registerGlobalLogHandler(handler: LogHandler): void {
  globalHandlers.add(handler);
}

class Logger {
  private level: LogLevel;
  private readonly handlers: LogHandler[] = [];
  private readonly context: string | undefined;
  private readonly enableSentry: boolean;

  constructor(context?: string, level?: LogLevel, options?: LoggerOptions) {
    this.context = context;
    this.level = level ?? (import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG);
    this.enableSentry = options?.enableSentry ?? false;

    this.addConsoleHandler();
    if (this.enableSentry) {
      this.addSentryHandler();
    }
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

  private addConsoleHandler(): void {
    // Console handler removed per mandatory rules: NO console.* in production
    // Logging is handled by Sentry and other external handlers only
    // This method is kept for API compatibility but does nothing
  }

  private addSentryHandler(): void {
    void resolveSentry().then((Sentry) => {
      if (!Sentry) return;

      this.addHandler((record) => {
        if (record.level >= LogLevel.ERROR) {
          const err = record.args[0] instanceof Error ? record.args[0] : undefined;
          Sentry.withScope((scope) => {
            scope.setLevel('error');
            if (this.context) scope.setTag('logger', this.context);
            if (err) {
              Sentry.captureException(err);
            } else {
              Sentry.captureMessage(record.message);
            }
          });
        } else if (record.level >= LogLevel.WARN) {
          Sentry.withScope((scope) => {
            scope.setLevel('warning');
            if (this.context) scope.setTag('logger', this.context);
            Sentry.captureMessage(record.message);
          });
        }
      });
    });
  }

  private emit(level: LogLevel, message: string, args: unknown[]): void {
    if (!this.shouldLog(level)) return;

    const record: LogRecord = {
      level,
      message,
      args,
      ts: Date.now(),
      timestamp: new Date().toISOString(),
      ...(this.context ? { context: this.context } : {}),
    };

    for (const handler of this.handlers) {
      try {
        const result = handler(record);
        if (result && typeof result.then === 'function') {
          result.catch(() => undefined);
        }
      } catch {
        // Ignore handler failures; handlers must be defensive on their own.
      }
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.emit(LogLevel.DEBUG, message, args);
  }

  info(message: string, ...args: unknown[]): void {
    this.emit(LogLevel.INFO, message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.emit(LogLevel.WARN, message, args);
  }

  error(message: string, ...args: unknown[]): void {
    this.emit(LogLevel.ERROR, message, args);
  }
}

export function createLogger(context: string, level?: LogLevel, options?: LoggerOptions): Logger {
  return new Logger(context, level, options);
}

export const logger = new Logger('root', undefined, { enableSentry: true });

export const log = {
  debug: (message: string, ...args: unknown[]) => logger.debug(message, ...args),
  info: (message: string, ...args: unknown[]) => logger.info(message, ...args),
  warn: (message: string, ...args: unknown[]) => logger.warn(message, ...args),
  error: (message: string, ...args: unknown[]) => logger.error(message, ...args),
};

export default logger;
