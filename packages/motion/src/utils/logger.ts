// Minimal internal logger to avoid cross-package imports and console usage
// No-ops by default to satisfy strict lint rules without side effects

export interface Logger {
  warn: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

const logger: Logger = {
  // Intentionally no-op to avoid console statements in production builds
  warn: () => {},
  info: () => {},
  error: () => {},
}

export default logger
