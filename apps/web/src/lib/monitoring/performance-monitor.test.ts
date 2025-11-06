import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { performanceMonitor } from './performance-monitor'

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    performanceMonitor.cleanup()
  })

  afterEach(() => {
    performanceMonitor.cleanup()
  })

  describe('initialization', () => {
    it('should initialize without errors', () => {
      expect(() => {
        performanceMonitor.init()
      }).not.toThrow()
    })

    it('should cleanup observers on cleanup', () => {
      performanceMonitor.init()
      expect(() => {
        performanceMonitor.cleanup()
      }).not.toThrow()
    })
  })

  describe('metric tracking', () => {
    it('should track API call', () => {
      expect(() => {
        performanceMonitor.trackAPICall('GET', '/api/test', 200, 100)
      }).not.toThrow()
    })

    it('should track route change', () => {
      expect(() => {
        performanceMonitor.trackRouteChange('/test', 200)
      }).not.toThrow()
    })

    it('should track feature usage', () => {
      expect(() => {
        performanceMonitor.trackFeatureUsage('test-feature', 150)
      }).not.toThrow()
    })

    it('should track user interaction', () => {
      expect(() => {
        performanceMonitor.trackUserInteraction('click', 50)
      }).not.toThrow()
    })
  })

  describe('summary', () => {
    it('should return summary', () => {
      performanceMonitor.trackAPICall('GET', '/api/test', 200, 100)
      performanceMonitor.trackRouteChange('/test', 200)

      const summary = performanceMonitor.getSummary()
      expect(summary).toBeDefined()
      expect(summary.totalMetrics).toBeGreaterThan(0)
      expect(typeof summary.averageValues).toBe('object')
    })
  })

  describe('performance marks', () => {
    it('should create a performance mark', () => {
      expect(() => {
        performanceMonitor.mark('test-mark')
      }).not.toThrow()
    })

    it('should measure between two marks', () => {
      performanceMonitor.mark('start')
      
      // Simulate some work
      setTimeout(() => {
        performanceMonitor.mark('end')
        expect(() => {
          performanceMonitor.measure('test-measure', 'start', 'end')
        }).not.toThrow()
      }, 10)
    })
  })

  describe('error handling', () => {
    it('should handle missing PerformanceObserver gracefully', () => {
      const originalObserver = window.PerformanceObserver
      // @ts-expect-error - Testing error handling
      delete window.PerformanceObserver

      expect(() => {
        performanceMonitor.init()
        performanceMonitor.cleanup()
      }).not.toThrow()

      // Restore
      window.PerformanceObserver = originalObserver
    })
  })
})

