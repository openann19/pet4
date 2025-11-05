import * as Sentry from '@sentry/browser'
import { Integrations } from '@sentry/tracing'
import { ENV } from '@/config/env'
import { createLogger } from '@/lib/logger'

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
        new Integrations.BrowserTracing(),
        new Sentry.Replay({
          // Capture replays for errors
          sessionSampleRate: 0.1,
          errorSampleRate: 1.0
        })
      ],

      // Performance monitoring
      beforeSend(event) {
        // Filter out non-critical errors in development
        if (ENV.VITE_ENVIRONMENT === 'development') {
          if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
            return null // Don't report chunk load errors in dev
          }
        }

        // Scrub sensitive data
        if (event.request?.data) {
          event.request.data = this.scrubSensitiveData(event.request.data)
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

  captureException(error: Error, context?: Record<string, any>): void {
    Sentry.withScope(scope => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setTag(key, value)
        })
      }
      Sentry.captureException(error)
    })
  }

  captureMessage(
    message: string, 
    level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
    context?: Record<string, any>
  ): void {
    Sentry.withScope(scope => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value)
        })
      }
      Sentry.captureMessage(message, level)
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

  startTransaction(name: string, op: string) {
    return Sentry.startTransaction({ name, op })
  }

  private scrubSensitiveData(data: any): any {
    if (typeof data !== 'object' || !data) return data

    const scrubbed = { ...data }
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

