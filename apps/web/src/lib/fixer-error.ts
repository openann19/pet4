import { isTruthy, isDefined } from '@/core/guards';

/**
 * FixerError - Structured error class for application errors with context metadata
 * 
 * All errors must be caught, classified, and rethrown with clear context.
 * Never use bare throw new Error() or generic catch (err) {}.
 * Always attach metadata (file, node, action) to errors for post-mortem analysis.
 */

export interface ErrorContext {
  file?: string
  position?: number
  node?: string
  action?: string
  [key: string]: unknown
}

export class FixerError extends Error {
  public readonly context: ErrorContext
  public readonly code?: string
  public readonly timestamp: string

  constructor(message: string, context: ErrorContext = {}, code?: string) {
    super(message)
    this.name = 'FixerError'
    this.context = context
    if (code !== undefined) {
      this.code = code
    }
    this.timestamp = new Date().toISOString()

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (isTruthy(Error.captureStackTrace)) {
      Error.captureStackTrace(this, FixerError)
    }
  }

  /**
   * Create a formatted error message with context
   */
  getFormattedMessage(): string {
    const contextParts: string[] = []
    
    if (isTruthy(this.context.file)) {
      contextParts.push(`file: ${String(this.context.file ?? '')}`)
    }
    if (this.context.position !== undefined) {
      contextParts.push(`position: ${String(this.context.position ?? '')}`)
    }
    if (isTruthy(this.context.node)) {
      contextParts.push(`node: ${String(this.context.node ?? '')}`)
    }
    if (isTruthy(this.context.action)) {
      contextParts.push(`action: ${String(this.context.action ?? '')}`)
    }
    if (isTruthy(this.code)) {
      contextParts.push(`code: ${String(this.code ?? '')}`)
    }

    const contextStr = contextParts.length > 0 ? ` (${String(contextParts.join(', ') ?? '')})` : ''
    return `${String(this.message ?? '')}${String(contextStr ?? '')}`
  }

  /**
   * Convert error to JSON for logging/API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
}


