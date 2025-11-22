/**
 * Enhanced Error Tracking (Mobile)
 * 
 * Global error tracking with user context and performance monitoring
 */

import { createLogger } from './logger'

// Language type for mobile
type Language = 'en' | 'bg' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ar' | 'hi' | 'pt' | 'ru' | 'ko'

const logger = createLogger('ErrorTracking')

export interface ErrorContext {
  userId?: string
  sessionId?: string
  language?: Language
  userAgent?: string
  url?: string
  timestamp?: string
  platform?: string
  osVersion?: string
  appVersion?: string
  [key: string]: unknown
}

export interface ErrorReport {
  id: string
  message: string
  stack?: string
  context: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
  fingerprint: string
  count: number
  firstSeen: string
  lastSeen: string
}

class ErrorTrackingService {
  private errorQueue: ErrorReport[] = []
  private context: ErrorContext = {}
  private userActions: string[] = []
  private maxQueueSize = 50
  private flushInterval = 30000 // 30 seconds

  constructor() {
    this.initializeContext()
    this.startFlushInterval()
  }

  private initializeContext(): void {
    try {
      // Use dynamic imports instead of require
      import('react-native').then((RN) => {
        import('expo-constants').then((Constants) => {
          const appVersion = Constants.default?.expoConfig?.version
          this.context = {
            platform: RN.Platform.OS,
            osVersion: RN.Platform.Version?.toString(),
            ...(appVersion ? { appVersion } : {}),
            timestamp: new Date().toISOString()
          }
        }).catch(() => {
          // Fallback if expo-constants not available
          this.context = {
            platform: RN.Platform.OS,
            osVersion: RN.Platform.Version?.toString(),
            timestamp: new Date().toISOString()
          }
        })
      }).catch(() => {
        // Fallback if react-native not available
        this.context = {
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      logger.warn('Failed to initialize error tracking context', { error })
      this.context = {
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Set user context
   */
  setUserContext(userId: string, sessionId?: string): void {
    this.context.userId = userId
    this.context.sessionId = sessionId ?? this.generateSessionId()
  }

  /**
   * Track user action for context
   */
  trackUserAction(action: string): void {
    this.userActions.push(action)
    if (this.userActions.length > 10) {
      this.userActions.shift()
    }
  }

  /**
   * Capture exception with context
   */
  captureException(
    error: Error,
    additionalContext: Record<string, unknown> = {}
  ): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
      context: {
        ...this.context,
        ...additionalContext,
        userActions: [...this.userActions],
        timestamp: new Date().toISOString()
      },
      severity: this.determineSeverity(error),
      fingerprint: this.generateFingerprint(error),
      count: 1,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    }

    // Check if similar error exists
    const existingIndex = this.errorQueue.findIndex(
      (e) => e.fingerprint === errorReport.fingerprint
    )

    if (existingIndex >= 0) {
      const existing = this.errorQueue[existingIndex]
      if (existing) {
        existing.count++
        existing.lastSeen = errorReport.lastSeen
        existing.context = { ...existing.context, ...errorReport.context }
      }
    } else {
      this.errorQueue.push(errorReport)
      if (this.errorQueue.length > this.maxQueueSize) {
        this.errorQueue.shift()
      }
    }

    // Log locally
    logger.error('Exception captured', error, errorReport.context)

    // Send to backend (fire-and-forget)
    void this.sendToBackend(errorReport).catch((err) => {
      const error = err instanceof Error ? err : new Error(String(err))
      logger.warn('Failed to send error to backend', { error })
    })
  }

  private determineSeverity(error: Error): ErrorReport['severity'] {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium'
    }
    if (message.includes('chunk') || message.includes('loading')) {
      return 'low'
    }
    if (error.stack?.includes('ErrorBoundary')) {
      return 'high'
    }
    
    return 'medium'
  }

  private generateFingerprint(error: Error): string {
    const stackLines = error.stack?.split('\n').slice(0, 3) ?? []
    const fingerprint = `${error.message}:${stackLines.join(':')}`
    // Use btoa if available, otherwise create a simple hash
    try {
      if (typeof btoa !== 'undefined') {
        return btoa(fingerprint).substring(0, 32)
      }
      // Fallback: simple hash
      let hash = 0
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
      }
      return Math.abs(hash).toString(36).substring(0, 32)
    } catch {
      // Final fallback
      return fingerprint.substring(0, 32).replace(/[^a-zA-Z0-9]/g, '')
    }
  }

  private generateErrorId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async sendToBackend(report: ErrorReport): Promise<void> {
    try {
      const apiUrl = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      })

      if (!response.ok) {
        throw new Error(`Failed to send error report: ${response.statusText}`)
      }
    } catch (error) {
      logger.debug('Error tracking backend unavailable', { error })
    }
  }

  private startFlushInterval(): void {
    setInterval(() => {
      void this.flushQueue()
    }, this.flushInterval)
  }

  private async flushQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return

    const errorsToSend = [...this.errorQueue]
    this.errorQueue = []

    try {
      await Promise.all(
        errorsToSend.map((error) => this.sendToBackend(error))
      )
    } catch (error) {
      this.errorQueue.unshift(...errorsToSend)
      logger.warn('Failed to flush error queue', { error })
    }
  }

  /**
   * Get error reports (for debugging/admin)
   */
  getErrorReports(): ErrorReport[] {
    return [...this.errorQueue]
  }
}

// Singleton instance
export const errorTracking = new ErrorTrackingService()

