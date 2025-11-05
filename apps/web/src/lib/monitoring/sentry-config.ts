import { ENV } from '@/config/env'
import { createLogger } from '@/lib/logger'
import * as Sentry from '@sentry/browser'

const logger = createLogger('Sentry')

class SentryConfigImpl {
  private initialized = false

  init(): void {
    if (this.initialized || !ENV.VITE_SENTRY_DSN) return

    Sentry.init({
      dsn: ENV.VITE_SENTRY_DSN,
      environment: ENV.VITE_ENVIRONMENT,
      tracesSampleRate: ENV.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1,
      
      integrations: [
        Sentry.browserTracingIntegration()
      ],

            // Performance monitoring
      beforeSend: (event: Sentry.ErrorEvent, _hint?: Sentry.EventHint): Sentry.ErrorEvent | null => {
        // Filter out non-critical errors in development
        if (ENV.VITE_ENVIRONMENT === 'development') {
          if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
            return null // Don't report chunk load errors in dev
          }
        }

        // Scrub sensitive data
        if (event.request?.data) {
          event.request.data = this.scrubSensitiveData(event.request.data) as Record<string, unknown>                                                           
        }

        return event
      },

      // Set user context
      initialScope: {
        tags: {
          component: 'web-app'
        }
      }
    })

    this.initialized = true
    logger.info('Sentry initialized', { 
      environment: ENV.VITE_ENVIRONMENT,
      dsn: ENV.VITE_SENTRY_DSN?.substring(0, 20) + '...'
    })
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username
    })
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    Sentry.withScope((scope: Sentry.Scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setTag(key, String(value))
        })
      }
      Sentry.captureException(error)
    })
  }

  captureMessage(
    message: string, 
    level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
    context?: Record<string, unknown>
  ): void {
    Sentry.withScope((scope: Sentry.Scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value as Record<string, unknown>)
        })
      }
      Sentry.captureMessage(message, level as Sentry.SeverityLevel)
    })
  }

  addBreadcrumb(breadcrumb: {
    message: string
    category?: string
    level?: 'debug' | 'info' | 'warning' | 'error'
    data?: Record<string, any>
  }): void {
    Sentry.addBreadcrumb(breadcrumb)
  }

  startTransaction(name: string, op: string): { finish: () => void } {
    // Note: startTransaction is deprecated in newer Sentry versions
    // Return a stub that can be used consistently
    logger.debug('Transaction started', { name, op })
    return { finish: () => logger.debug('Transaction finished', { name, op }) }
  }

  private scrubSensitiveData(data: unknown): unknown {
    if (typeof data !== 'object' || !data) return data

    const scrubbed = { ...(data as Record<string, unknown>) }
    const sensitiveKeys = [
      'password', 'token', 'key', 'secret', 'auth',
      'credit_card', 'ssn', 'email', 'phone'
    ]

    Object.keys(scrubbed).forEach(key => {
      if (sensitiveKeys.some(sensitive => 
        key.toLowerCase().includes(sensitive))) {
        scrubbed[key] = '[Redacted]'
      }
    })

    return scrubbed
  }
}

export const sentryConfig = new SentryConfigImpl()

