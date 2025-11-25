/**
 * Tests for Worldwide Scale Initialization
 *
 * Tests service worker registration, error tracking setup, and web vitals initialization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { initializeWorldwideScale, trackUserAction } from '../worldwide-scale-init'
import { registerServiceWorker } from '../pwa/service-worker-registration'
import { errorTracking } from '../error-tracking'
import { initWebVitals } from '../web-vitals'
import { createLogger } from '../logger'

// Define mock logger using hoisted to ensure it's available at module load time
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))

// Mock all dependencies
vi.mock('../pwa/service-worker-registration')
vi.mock('../error-tracking')
vi.mock('../web-vitals')
vi.mock('../logger', () => ({
  createLogger: vi.fn(() => mockLogger),
}))

describe('worldwide-scale-init', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(registerServiceWorker).mockResolvedValue(null)
    vi.mocked(errorTracking.setUserContext).mockImplementation(() => {})
    vi.mocked(errorTracking.trackUserAction).mockImplementation(() => {})
    vi.mocked(initWebVitals).mockImplementation(() => {})

    // Mock window object if it doesn't exist
    if (typeof window === 'undefined') {
      Object.defineProperty(globalThis, 'window', {
        value: {
          location: {
            href: 'http://localhost:3000',
          },
        },
        writable: true,
      })
    } else {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000',
        },
        writable: true,
      })
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initializeWorldwideScale', () => {
    it('should initialize all features successfully with default options', async () => {
      await initializeWorldwideScale()

      expect(errorTracking.setUserContext).not.toHaveBeenCalled()
      expect(initWebVitals).toHaveBeenCalled()
      expect(registerServiceWorker).toHaveBeenCalledWith(
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onUpdate: expect.any(Function),
          onError: expect.any(Function),
        })
      )
      expect(mockLogger.debug).toHaveBeenCalledWith('Worldwide scale features initialized')
    })

    it('should initialize error tracking with user context when userId provided', async () => {
      const userId = 'user-123'
      const sessionId = 'session-456'

      await initializeWorldwideScale({ userId, sessionId })

      expect(errorTracking.setUserContext).toHaveBeenCalledWith(userId, sessionId)
      expect(mockLogger.debug).toHaveBeenCalledWith('Error tracking initialized')
    })

    it('should skip error tracking when disabled', async () => {
      await initializeWorldwideScale({ enableErrorTracking: false })

      expect(errorTracking.setUserContext).not.toHaveBeenCalled()
      expect(mockLogger.debug).not.toHaveBeenCalledWith('Error tracking initialized')
    })

    it('should skip web vitals when disabled', async () => {
      await initializeWorldwideScale({ enableWebVitals: false })

      expect(initWebVitals).not.toHaveBeenCalled()
      expect(mockLogger.debug).not.toHaveBeenCalledWith('Web Vitals tracking initialized')
    })

    it('should skip service worker when disabled', async () => {
      await initializeWorldwideScale({ enableServiceWorker: false })

      expect(registerServiceWorker).not.toHaveBeenCalled()
    })

    it('should handle error tracking initialization failure gracefully', async () => {
      const error = new Error('Error tracking failed')
      vi.mocked(errorTracking.setUserContext).mockImplementation(() => {
        throw error
      })

      await initializeWorldwideScale({ userId: 'test-user' })

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to initialize error tracking',
        error
      )
      // Should continue with other initializations
      expect(initWebVitals).toHaveBeenCalled()
      expect(registerServiceWorker).toHaveBeenCalled()
    })

    it('should handle web vitals initialization failure gracefully', async () => {
      const error = new Error('Web vitals failed')
      vi.mocked(initWebVitals).mockImplementation(() => {
        throw error
      })

      await initializeWorldwideScale()

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to initialize Web Vitals tracking',
        error
      )
      // Should continue with other initializations
      expect(registerServiceWorker).toHaveBeenCalled()
    })

    it('should handle service worker registration failure gracefully', async () => {
      const error = new Error('Service worker failed')
      vi.mocked(registerServiceWorker).mockRejectedValue(error)

      await initializeWorldwideScale()

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Service worker registration threw error',
        error
      )
    })

    it('should handle service worker onError callback', async () => {
      const swError = new Error('SW registration error')
      let onErrorCallback: ((error: Error) => void) | undefined

      vi.mocked(registerServiceWorker).mockImplementation(async (config) => {
        onErrorCallback = config.onError
        return null
      })

      await initializeWorldwideScale()

      expect(onErrorCallback).toBeDefined()
      onErrorCallback?.(swError)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Service worker registration failed',
        swError
      )
    })

    it('should handle service worker onSuccess callback', async () => {
      const mockRegistration = {
        scope: '/scope',
      } as ServiceWorkerRegistration
      let onSuccessCallback: ((registration: ServiceWorkerRegistration) => void) | undefined

      vi.mocked(registerServiceWorker).mockImplementation(async (config) => {
        onSuccessCallback = config.onSuccess
        return null
      })

      await initializeWorldwideScale()

      expect(onSuccessCallback).toBeDefined()
      onSuccessCallback?.(mockRegistration)
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Service worker registered',
        { scope: '/scope' }
      )
    })

    it('should handle service worker onUpdate callback', async () => {
      const mockRegistration = {
        scope: '/scope',
      } as ServiceWorkerRegistration
      let onUpdateCallback: ((registration: ServiceWorkerRegistration) => void) | undefined

      vi.mocked(registerServiceWorker).mockImplementation(async (config) => {
        onUpdateCallback = config.onUpdate
        return null
      })

      await initializeWorldwideScale()

      expect(onUpdateCallback).toBeDefined()
      onUpdateCallback?.(mockRegistration)
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Service worker update available',
        { scope: '/scope' }
      )
    })

    it('should skip browser-dependent features when window is undefined', async () => {
      const originalWindow = global.window
      delete (global as any).window

      await initializeWorldwideScale()

      expect(initWebVitals).not.toHaveBeenCalled()
      expect(registerServiceWorker).not.toHaveBeenCalled()
      expect(mockLogger.debug).toHaveBeenCalledWith('Error tracking initialized')

      // Restore window
      global.window = originalWindow
    })

    it('should handle service worker registration error gracefully', async () => {
      const criticalError = new Error('Service worker critical failure')

      // Mock registerServiceWorker to throw error
      vi.mocked(registerServiceWorker).mockRejectedValue(criticalError)

      // Should not throw, should handle error gracefully
      await expect(initializeWorldwideScale()).resolves.toBeUndefined()

      // Should log the error
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Service worker registration threw error',
        criticalError
      )
    })

    it('should work with partial options', async () => {
      await initializeWorldwideScale({
        userId: 'user-123',
        enableServiceWorker: false,
      })

      expect(errorTracking.setUserContext).toHaveBeenCalledWith('user-123', undefined)
      expect(initWebVitals).toHaveBeenCalled()
      expect(registerServiceWorker).not.toHaveBeenCalled()
    })
  })

  describe('trackUserAction', () => {
    it('should track user action successfully', () => {
      const action = 'button_click'

      trackUserAction(action)

      expect(errorTracking.trackUserAction).toHaveBeenCalledWith(action)
    })

    it('should handle tracking failure gracefully', () => {
      const error = new Error('Tracking failed')
      vi.mocked(errorTracking.trackUserAction).mockImplementation(() => {
        throw error
      })

      trackUserAction('test_action')

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to track user action',
        error
      )
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete initialization with all features enabled', async () => {
      const options = {
        userId: 'integration-user',
        sessionId: 'integration-session',
        enableServiceWorker: true,
        enableErrorTracking: true,
        enableWebVitals: true,
      }

      await initializeWorldwideScale(options)

      expect(errorTracking.setUserContext).toHaveBeenCalledWith(
        options.userId,
        options.sessionId
      )
      expect(initWebVitals).toHaveBeenCalled()
      expect(registerServiceWorker).toHaveBeenCalledWith(
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onUpdate: expect.any(Function),
          onError: expect.any(Function),
        })
      )
    })

    it('should handle initialization with all features disabled', async () => {
      const options = {
        enableServiceWorker: false,
        enableErrorTracking: false,
        enableWebVitals: false,
      }

      await initializeWorldwideScale(options)

      expect(errorTracking.setUserContext).not.toHaveBeenCalled()
      expect(initWebVitals).not.toHaveBeenCalled()
      expect(registerServiceWorker).not.toHaveBeenCalled()
    })
  })
})
