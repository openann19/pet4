/**
 * Telemetry and analytics utilities
 * Structured event tracking with no PII
 * Location: src/utils/telemetry.ts
 */

import { useEffect } from 'react'
import { createLogger } from './logger'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('telemetry')

export interface TelemetryEvent {
  name: string
  ts: number
  screen?: string | undefined
  userAnonId?: string | undefined
  payload?: Record<string, unknown> | undefined
  buildId?: string | undefined
}

export interface PerformanceTrace {
  name: string
  duration: number
  screen?: string
  metadata?: Record<string, unknown>
}

class TelemetryService {
  private events: TelemetryEvent[] = []
  private traces: PerformanceTrace[] = []
  private userAnonId: string | undefined
  private buildId: string | undefined
  private enabled: boolean = true

  constructor() {
    // Generate anonymous user ID (persisted across sessions)
    this.getOrCreateAnonId().then((id) => {
      this.userAnonId = id
    }).catch(() => {
      // Fallback on error
      this.userAnonId = `anon_${String(Date.now() ?? '')}_${String(Math.random().toString(36).substring(2, 11) ?? '')}`
    })
    this.buildId = this.getBuildId()
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Track a structured event
   */
  track(event: Omit<TelemetryEvent, 'ts' | 'userAnonId' | 'buildId'>): void {
    if (!this.enabled) {
      return
    }

    const telemetryEvent: TelemetryEvent = {
      ...event,
      ts: Date.now(),
      ...(this.userAnonId ? { userAnonId: this.userAnonId } : {}),
      ...(this.buildId ? { buildId: this.buildId } : {}),
    }

    this.events.push(telemetryEvent)

    // Send to analytics service in production
    if (isTruthy(__DEV__)) {
      logger.debug('Telemetry event', telemetryEvent)
    } else {
      // In production, send to analytics service
      this.sendToAnalytics(telemetryEvent).catch((err) => {
        logger.error('Failed to send telemetry event', err instanceof Error ? err : new Error(String(err)))
      })
    }

    // Prevent memory leak - limit events array size
    if (this.events.length > 1000) {
      this.events.shift()
    }
  }

  private async sendToAnalytics(event: TelemetryEvent): Promise<void> {
    try {
      // Send to analytics service endpoint
      const analyticsEndpoint = (typeof process !== 'undefined' && process.env?.['EXPO_PUBLIC_ANALYTICS_ENDPOINT']) || '/api/analytics/events'
      await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })
    } catch {
      // Silently fail - analytics should not break the app
      logger.debug('Analytics endpoint not available')
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(trace: PerformanceTrace): void {
    this.trace(trace)
    // Also track as event for analytics
    this.track({
      name: 'performance',
      screen: trace.screen,
      payload: {
        duration: trace.duration,
        ...trace.metadata,
      },
    })
  }

  /**
   * Track performance trace
   */
  trace(trace: PerformanceTrace): void {
    if (!this.enabled) {
      return
    }

    this.traces.push(trace)

    if (isTruthy(__DEV__)) {
      logger.debug('Performance trace', trace)
    }

    // Limit traces array size
    if (this.traces.length > 500) {
      this.traces.shift()
    }
  }

  /**
   * Track error with context
   */
  trackError(
    error: Error,
    context?: {
      screen?: string | undefined
      action?: string | undefined
      payload?: Record<string, unknown> | undefined
    }
  ): void {
    const eventPayload: Record<string, unknown> = {
      message: error.message,
      ...(error.stack !== undefined ? { stack: error.stack } : {}),
      ...(context?.action !== undefined ? { action: context.action } : {}),
      ...(context?.payload !== undefined ? { ...context.payload } : {}),
    }
    this.track({
      name: 'error',
      ...(context?.screen !== undefined ? { screen: context.screen } : {}),
      ...(Object.keys(eventPayload).length > 0 ? { payload: eventPayload } : {}),
    })

    logger.error('Telemetry error tracked', error, context)
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName: string, params?: Record<string, unknown>): void {
    this.track({
      name: 'screen_view',
      screen: screenName,
      ...(params !== undefined ? { payload: params } : {}),
    })
  }

  /**
   * Track user action
   */
  trackAction(
    actionName: string,
    screen?: string,
    params?: Record<string, unknown>
  ): void {
    const payload: Record<string, unknown> = {
      action: actionName,
      ...(params !== undefined ? { ...params } : {}),
    }
    this.track({
      name: 'user_action',
      ...(screen !== undefined ? { screen } : {}),
      ...(Object.keys(payload).length > 0 ? { payload } : {}),
    })
  }

  /**
   * Get all events (for testing/debugging)
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events]
  }

  /**
   * Get all traces
   */
  getTraces(): PerformanceTrace[] {
    return [...this.traces]
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = []
    this.traces = []
  }

  private async getOrCreateAnonId(): Promise<string> {
    try {
      // Use secure storage for anonymous user ID
      // Dynamic import to avoid circular dependency
      const { secureStorage } = await import('./secure-storage')
      const stored = await secureStorage.getItem('anonUserId')
      if (isTruthy(stored)) {
        return stored
      }

      const newId = `anon_${String(Date.now() ?? '')}_${String(Math.random().toString(36).substring(2, 11) ?? '')}`
      await secureStorage.setItem('anonUserId', newId)
      return newId
    } catch {
      // Fallback if secure storage fails
      const newId = `anon_${String(Date.now() ?? '')}_${String(Math.random().toString(36).substring(2, 11) ?? '')}`
      return newId
    }
  }

  private getBuildId(): string {
    // In production, get from build config
    return process.env['EXPO_PUBLIC_BUILD_ID'] ?? 'dev'
  }
}

export const telemetry = new TelemetryService()

/**
 * Hook to track screen views
 */
export function useScreenTracking(screenName: string): void {
  // Track on mount
  useEffect(() => {
    telemetry.trackScreenView(screenName)
  }, [screenName])
}

