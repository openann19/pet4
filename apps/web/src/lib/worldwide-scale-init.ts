/**
 * Worldwide Scale Initialization
 * 
 * Centralized initialization for all worldwide scale features
 */

import { registerServiceWorker } from './pwa/service-worker-registration'
import { errorTracking, trackWebVitals } from './error-tracking'
import { createLogger } from './logger'

const logger = createLogger('WorldwideScaleInit')

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
      if (userId) {
        errorTracking.setUserContext(userId, sessionId)
      }
      logger.debug('Error tracking initialized')
    }

    // Initialize performance monitoring
    if (enableWebVitals && typeof window !== 'undefined') {
      trackWebVitals()
      logger.debug('Web Vitals tracking initialized')
    }

    // Register service worker
    if (enableServiceWorker && typeof window !== 'undefined') {
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
    }

    logger.debug('Worldwide scale features initialized')
  } catch (error) {
    logger.error('Failed to initialize worldwide scale features', error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Track user action for error context
 */
export function trackUserAction(action: string): void {
  errorTracking.trackUserAction(action)
}

/**
 * Export compliance components for easy access
 */
export { ConsentManager } from '@/components/compliance'
export { AgeVerification, isAgeVerified } from '@/components/compliance'

