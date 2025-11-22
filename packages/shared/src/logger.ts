// Lightweight, structured logger used to replace console.* (tree-shakeable in prod).
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
const envLogLevel = typeof process !== 'undefined' && process.env?.LOG_LEVEL;
let level: LogLevel = validLevels.includes(envLogLevel as LogLevel) ? (envLogLevel as LogLevel) : 'info';

const order: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
function shouldLog(l: LogLevel): boolean {
  return order[l] >= order[level];
}

// Centralized sink (replace with pino/winston later without touching call sites)
function emit(l: LogLevel, args: readonly unknown[]): void {
  const sink = globalThis.console;
  const write = l === 'error' ? sink.error : l === 'warn' ? sink.warn : l === 'debug' ? sink.debug : sink.info;
  write.call(
    sink,
    `[${new Date().toISOString()}] ${l.toUpperCase()}:`,
    ...args
  );
}

export default {
  setLevel: (l: LogLevel) => {
    level = l;
  },
  debug: (...a: readonly unknown[]) => {
    if (shouldLog('debug')) emit('debug', a);
  },
  info: (...a: readonly unknown[]) => {
    if (shouldLog('info')) emit('info', a);
  },
  warn: (...a: readonly unknown[]) => {
    if (shouldLog('warn')) emit('warn', a);
  },
  error: (...a: readonly unknown[]) => {
    if (shouldLog('error')) emit('error', a);
  }
};
