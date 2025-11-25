/**
 * Worldwide Scale Initialization
 *
 * Centralized initialization for all worldwide scale features
 *
 * Error Handling Strategy:
 * - Individual components (error tracking, web vitals, service worker) use graceful degradation
 * - Failures are logged but don't prevent other components from initializing
 * - Critical infrastructure failures (logger creation) will re-throw to prevent silent failures
 * - This ensures maximum feature availability while maintaining observability
 */

import { registerServiceWorker } from './pwa/service-worker-registration'
import { errorTracking } from './error-tracking'
import { initWebVitals } from './web-vitals'
import { createLogger } from './logger'

const logger: ReturnType<typeof createLogger> = createLogger('WorldwideScaleInit')

/**
 * Initialize all worldwide scale features
 */
export async function initializeWorldwideScale(options: {
  userId?: string
  sessionId?: string
  enableServiceWorker?: boolean
  enableErrorTracking?: boolean
  enableWebVitals?: boolean
} = {}): Promise<void> {
  const {
    userId,
    sessionId,
    enableServiceWorker = true,
    enableErrorTracking = true,
    enableWebVitals = true
  } = options

  try {
    // Initialize error tracking
    if (enableErrorTracking) {
      try {
        if (userId) {
          errorTracking.setUserContext(userId, sessionId)
        }
        logger.debug('Error tracking initialized')
      } catch (error) {
        logger.warn('Failed to initialize error tracking', error instanceof Error ? error : new Error(String(error)))
      }
    }

    // Initialize performance monitoring
    if (enableWebVitals && typeof window !== 'undefined') {
      try {
        initWebVitals()
        logger.debug('Web Vitals tracking initialized')
      } catch (error) {
        logger.warn('Failed to initialize Web Vitals tracking', error instanceof Error ? error : new Error(String(error)))
      }
    }

    // Register service worker
    if (enableServiceWorker && typeof window !== 'undefined') {
      try {
        await registerServiceWorker({
          onSuccess: (registration) => {
            logger.debug('Service worker registered', { scope: registration.scope })
          },
          onUpdate: (registration) => {
            logger.debug('Service worker update available', { scope: registration.scope })
            // Could show a notification to user about update
          },
          onError: (error) => {
            logger.warn('Service worker registration failed', error)
          }
        })
      } catch (error) {
        logger.warn('Service worker registration threw error', error instanceof Error ? error : new Error(String(error)))
      }
    }

    logger.debug('Worldwide scale features initialized')
  } catch (error) {
    logger.error('Failed to initialize worldwide scale features', error instanceof Error ? error : new Error(String(error)))
    throw error // Re-throw to allow caller to handle
  }
}

/**
 * Track user action for error context
 */
export function trackUserAction(action: string): void {
  try {
    errorTracking.trackUserAction(action)
  } catch (error) {
    logger.warn('Failed to track user action', error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Export compliance components for easy access
 */
export { ConsentManager } from '@/components/compliance'
export { AgeVerification, isAgeVerified } from '@/components/compliance'
