/**
 * Enhanced Error Tracking
 *
 * Global error tracking with user context, error grouping, and performance monitoring
 */

import { ENV } from '@/config/env'
import { createLogger } from './logger'
import type { Language } from './i18n/core/types'

const API_BASE_URL = ENV.VITE_API_URL
const ANALYTICS_PATH = '/api/analytics/performance'
const IS_DEV = import.meta.env.DEV === true

const logger = createLogger('ErrorTracking')

function getAnalyticsEndpoint(): string | null {
  if (typeof window === 'undefined') {
    return API_BASE_URL ? new URL(ANALYTICS_PATH, API_BASE_URL).toString() : ANALYTICS_PATH
  }

  if (!API_BASE_URL) {
    return ANALYTICS_PATH
  }

  try {
    const target = new URL(ANALYTICS_PATH, API_BASE_URL)

    if (window.location.protocol === 'https:' && target.protocol === 'http:') {
      logger.debug('Falling back to same-origin analytics endpoint due to protocol mismatch', {
        blockedEndpoint: target.toString(),
      })
      return ANALYTICS_PATH
    }

    return target.toString()
  } catch (_error) {
    logger.warn('Failed to resolve analytics endpoint; skipping metrics', { _error })
    return null
  }
}

export interface ErrorContext {
  userId?: string
  sessionId?: string
  language?: Language
  userAgent?: string
  url?: string
  timestamp?: string
  performance?: {
    memory?: number
    connection?: string
  }
  userActions?: string[]
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
    this.setupGlobalHandlers()
  }

  private initializeContext(): void {
    if (typeof window !== 'undefined') {
      const performance = this.getPerformanceMetrics()
      this.context = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        language: this.detectLanguage(),
        ...(performance ? { performance } : {}),
        timestamp: new Date().toISOString()
      }
    }
  }

  private detectLanguage(): Language {
    if (typeof window === 'undefined') return 'en'
    
    const browserLang = navigator.language.split('-')[0]
    const supportedLanguages: Language[] = [
      'en', 'bg'
    ]
    
    return (supportedLanguages.includes(browserLang as Language) 
      ? browserLang 
      : 'en') as Language
  }

  private getPerformanceMetrics(): ErrorContext['performance'] | undefined {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return undefined
    }

    const perf = window.performance as Performance & {
      memory?: { usedJSHeapSize: number }
    }

    const connection = (navigator as Navigator & {
      connection?: { effectiveType?: string }
    }).connection

    const memory = perf.memory?.usedJSHeapSize
    const connectionType = connection?.effectiveType

    if (memory === undefined && connectionType === undefined) {
      return undefined
    }

    return {
      ...(memory !== undefined ? { memory } : {}),
      ...(connectionType !== undefined ? { connection: connectionType } : {})
    }
  }

  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return

    // Unhandled errors
    window.addEventListener('error', (event) => {
      const error = event.error instanceof Error 
        ? event.error 
        : new Error(event.message ?? 'Unknown error')
      this.captureException(error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(
        event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason)),
        { unhandledRejection: true }
      )
    })
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
        timestamp: new Date().toISOString(),
        ...(typeof window !== 'undefined' ? { url: window.location.href } : {})
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
    // Generate fingerprint based on error message and stack trace
    const stackLines = error.stack?.split('\n').slice(0, 3) ?? []
    const fingerprint = `${error.message}:${stackLines.join(':')}`
    return btoa(fingerprint).substring(0, 32)
  }

  private generateErrorId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async sendToBackend(report: ErrorReport): Promise<void> {
    if (IS_DEV) {
      logger.debug('Skipping error backend send in dev environment', {
        message: report.message,
      })
      return
    }

    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      })

      if (!response.ok) {
        throw new Error(`Failed to send error report: ${response.statusText}`)
      }
    } catch (_error) {
      // Silently fail - _error tracking should not break the app
      logger.debug('Error tracking backend unavailable', { _error })
    }
  }

  private startFlushInterval(): void {
    if (typeof window === 'undefined') return

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
    } catch (_error) {
      // Re-add to queue if send fails
      this.errorQueue.unshift(...errorsToSend)
      logger.warn('Failed to flush _error queue', { _error })
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

/**
 * Track performance metrics
 */
export function trackPerformance(metricName: string, value: number): void {
  if (typeof window === 'undefined') return
  if (IS_DEV) {
    logger.debug('Skipping performance metric in dev', { metricName, value })
    return
  }

  const analyticsEndpoint = getAnalyticsEndpoint()
  if (!analyticsEndpoint) {
    logger.debug('Skipping performance metric (no analytics endpoint)', { metricName })
    return
  }

  const perfData = {
    name: metricName,
    value,
    timestamp: Date.now(),
    url: window.location.href
  }

  logger.debug('Performance metric', perfData)

  // Send to analytics
  void fetch(analyticsEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(perfData)
  }).catch(() => {
    logger.debug('Performance metric send failed', { metricName })
  })
}

/**
 * Track Core Web Vitals
 */
function trackLCP(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number
        loadTime?: number
      }
      
      const lcp = lastEntry.renderTime ?? lastEntry.loadTime ?? 0
      trackPerformance('LCP', lcp)
    })

    observer.observe({ entryTypes: ['largest-contentful-paint'] })
  } catch (_error) {
    logger.warn('Failed to track LCP', { _error })
  }
}

function trackFID(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        const fid = (entry as PerformanceEventTiming).processingStart - entry.startTime
        trackPerformance('FID', fid)
      })
    })

    observer.observe({ entryTypes: ['first-input'] })
  } catch (_error) {
    logger.warn('Failed to track FID', { _error })
  }
}

function trackCLS(): void {
  try {
    let clsValue = 0
    interface LayoutShiftEntry extends PerformanceEntry {
      value: number
      hadRecentInput: boolean
    }
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        const layoutShift = entry as LayoutShiftEntry
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value
        }
      })
      trackPerformance('CLS', clsValue)
    })

    observer.observe({ entryTypes: ['layout-shift'] })
  } catch (_error) {
    logger.warn('Failed to track CLS', { _error })
  }
}

export function trackWebVitals(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  trackLCP()
  trackFID()
  trackCLS()
}

// Auto-track Web Vitals on load
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    trackWebVitals()
  } else {
    window.addEventListener('load', trackWebVitals)
  }
}

