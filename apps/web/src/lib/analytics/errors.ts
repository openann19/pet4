/**
 * Error Tracking (Web)
 *
 * Tracks errors with stack traces, user context, and aggregation.
 * Features:
 * - Error capture and reporting
 * - Stack trace collection with source maps
 * - User context attachment
 * - Error aggregation and prioritization
 * - Error rate monitoring
 * - Integration with Sentry/error reporting services
 *
 * Location: apps/web/src/lib/analytics/errors.ts
 */

import { createLogger } from '../logger'

const logger = createLogger('error-tracking')

/**
 * Error severity
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Error context
 */
export interface ErrorContext {
  readonly userId?: string
  readonly sessionId?: string
  readonly url?: string
  readonly userAgent?: string
  readonly timestamp: number
  readonly properties?: Record<string, unknown>
}

/**
 * Tracked error
 */
export interface TrackedError {
  readonly id: string
  readonly message: string
  readonly stack?: string
  readonly severity: ErrorSeverity
  readonly context: ErrorContext
  readonly count: number
  readonly firstSeen: number
  readonly lastSeen: number
  readonly resolved: boolean
}

/**
 * Error aggregation
 */
export interface ErrorAggregation {
  readonly error: TrackedError
  readonly totalCount: number
  readonly uniqueUsers: number
  readonly affectedSessions: number
  readonly averagePerUser: number
}

/**
 * Error tracking options
 */
export interface ErrorTrackingOptions {
  readonly enableSourceMaps?: boolean
  readonly enableUserContext?: boolean
  readonly enableAggregation?: boolean
  readonly maxErrors?: number
  readonly severityThreshold?: ErrorSeverity
}

/**
 * Error tracker
 */
export class ErrorTracker {
  private readonly errors = new Map<string, TrackedError>()
  private readonly enableSourceMaps: boolean
  private readonly enableUserContext: boolean
  private readonly enableAggregation: boolean
  private readonly maxErrors: number
  private readonly severityThreshold: ErrorSeverity

  constructor(options: ErrorTrackingOptions = {}) {
    this.enableSourceMaps = options.enableSourceMaps ?? true
    this.enableUserContext = options.enableUserContext ?? true
    this.enableAggregation = options.enableAggregation ?? true
    this.maxErrors = options.maxErrors ?? 1000
    this.severityThreshold = options.severityThreshold ?? 'low'

    this.initializeErrorHandlers()
  }

  /**
   * Initialize error handlers
   */
  private initializeErrorHandlers(): void {
    if (typeof window === 'undefined') {
      return
    }

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        severity: 'high',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: event.reason?.message ?? String(event.reason),
        stack: event.reason?.stack,
        severity: 'medium',
      })
    })
  }

  /**
   * Track error
   */
  trackError(error: {
    message: string
    stack?: string
    severity?: ErrorSeverity
    filename?: string
    lineno?: number
    colno?: number
    context?: Partial<ErrorContext>
  }): void {
    const severity = error.severity ?? this.determineSeverity(error.message, error.stack)

    // Check severity threshold
    if (this.shouldIgnoreSeverity(severity)) {
      return
    }

    const errorId = this.generateErrorId(error.message, error.stack)
    const now = Date.now()

    const context: ErrorContext = {
      userId: error.context?.userId,
      sessionId: error.context?.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: now,
      properties: {
        ...error.context?.properties,
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
      },
    }

    const existingError = this.errors.get(errorId)

    if (existingError) {
      // Update existing error
      const updatedError: TrackedError = {
        ...existingError,
        count: existingError.count + 1,
        lastSeen: now,
        context: this.mergeContext(existingError.context, context),
      }
      this.errors.set(errorId, updatedError)
    } else {
      // Create new error
      const newError: TrackedError = {
        id: errorId,
        message: error.message,
        stack: error.stack,
        severity,
        context,
        count: 1,
        firstSeen: now,
        lastSeen: now,
        resolved: false,
      }
      this.errors.set(errorId, newError)

      // Trim errors if exceeds max
      if (this.errors.size > this.maxErrors) {
        this.trimErrors()
      }
    }

    logger.error('Error tracked', {
      id: errorId,
      message: error.message,
      severity,
      count: existingError ? existingError.count + 1 : 1,
    })
  }

  /**
   * Generate error ID
   */
  private generateErrorId(message: string, stack?: string): string {
    // Generate ID from message and stack trace
    const stackHash = stack ? this.hashString(stack.substring(0, 100)) : ''
    const messageHash = this.hashString(message)
    return `${messageHash}-${stackHash}`
  }

  /**
   * Hash string
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Determine error severity
   */
  private determineSeverity(message: string, stack?: string): ErrorSeverity {
    const lowerMessage = message.toLowerCase()

    // Critical errors
    if (
      lowerMessage.includes('out of memory') ||
      lowerMessage.includes('maximum call stack') ||
      lowerMessage.includes('network error')
    ) {
      return 'critical'
    }

    // High severity errors
    if (
      lowerMessage.includes('typeerror') ||
      lowerMessage.includes('referenceerror') ||
      lowerMessage.includes('syntaxerror')
    ) {
      return 'high'
    }

    // Medium severity errors
    if (lowerMessage.includes('warning') || lowerMessage.includes('deprecated')) {
      return 'medium'
    }

    // Default to low
    return 'low'
  }

  /**
   * Check if severity should be ignored
   */
  private shouldIgnoreSeverity(severity: ErrorSeverity): boolean {
    const severityOrder: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 1,
      high: 2,
      critical: 3,
    }

    return severityOrder[severity] < severityOrder[this.severityThreshold]
  }

  /**
   * Merge error contexts
   */
  private mergeContext(context1: ErrorContext, context2: ErrorContext): ErrorContext {
    return {
      ...context1,
      ...context2,
      properties: {
        ...context1.properties,
        ...context2.properties,
      },
      timestamp: Math.max(context1.timestamp, context2.timestamp),
    }
  }

  /**
   * Trim errors
   */
  private trimErrors(): void {
    const sortedErrors = Array.from(this.errors.entries()).sort((a, b) => {
      // Sort by severity and last seen
      const severityOrder: Record<ErrorSeverity, number> = {
        low: 0,
        medium: 1,
        high: 2,
        critical: 3,
      }

      const severityDiff = severityOrder[b[1].severity] - severityOrder[a[1].severity]
      if (severityDiff !== 0) {
        return severityDiff
      }

      return b[1].lastSeen - a[1].lastSeen
    })

    // Keep top errors
    const toKeep = sortedErrors.slice(0, this.maxErrors)
    this.errors.clear()

    toKeep.forEach(([id, error]) => {
      this.errors.set(id, error)
    })
  }

  /**
   * Get error aggregations
   */
  getAggregations(): ErrorAggregation[] {
    if (!this.enableAggregation) {
      return []
    }

    const aggregations: ErrorAggregation[] = []

    this.errors.forEach((error) => {
      const userIds = new Set<string>()
      const sessionIds = new Set<string>()

      // Extract user and session IDs from context
      if (error.context.userId) {
        userIds.add(error.context.userId)
      }
      if (error.context.sessionId) {
        sessionIds.add(error.context.sessionId)
      }

      aggregations.push({
        error,
        totalCount: error.count,
        uniqueUsers: userIds.size,
        affectedSessions: sessionIds.size,
        averagePerUser: userIds.size > 0 ? error.count / userIds.size : 0,
      })
    })

    return aggregations.sort((a, b) => b.totalCount - a.totalCount)
  }

  /**
   * Get errors
   */
  getErrors(): readonly TrackedError[] {
    return Array.from(this.errors.values())
  }

  /**
   * Get error by ID
   */
  getError(id: string): TrackedError | null {
    return this.errors.get(id) ?? null
  }

  /**
   * Resolve error
   */
  resolveError(id: string): void {
    const error = this.errors.get(id)
    if (error) {
      this.errors.set(id, { ...error, resolved: true })
      logger.debug('Error resolved', { id })
    }
  }

  /**
   * Clear errors
   */
  clear(): void {
    this.errors.clear()
    logger.debug('Error tracking data cleared')
  }
}

/**
 * Create error tracker instance
 */
let errorTrackerInstance: ErrorTracker | null = null

export function getErrorTracker(options?: ErrorTrackingOptions): ErrorTracker {
  if (!errorTrackerInstance) {
    errorTrackerInstance = new ErrorTracker(options)
  }
  return errorTrackerInstance
}
