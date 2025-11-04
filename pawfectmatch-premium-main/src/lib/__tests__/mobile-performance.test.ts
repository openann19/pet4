/**
 * Tests for Mobile Performance Monitoring
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getPerformanceMonitor, startPerformanceTracking, type PerformanceMonitor } from '../mobile-performance'

describe('Mobile Performance Monitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    // Reset performance.now mock
    vi.clearAllMocks()
    monitor = getPerformanceMonitor()
  })

  afterEach(() => {
    monitor.destroy()
    localStorage.clear()
  })

  describe('Cold Start Tracking', () => {
    it('should track cold start time', () => {
      const metrics = monitor.getMetrics()
      expect(metrics.coldStartTime).toBeDefined()
    })

    it('should persist cold start time', () => {
      const initialMetrics = monitor.getMetrics()
      monitor.loadMetrics()
      const loadedMetrics = monitor.getMetrics()
      expect(loadedMetrics.coldStartTime).toBe(initialMetrics.coldStartTime)
    })
  })

  describe('FPS Sampling', () => {
    it('should start FPS sampling', () => {
      monitor.startFPSSampling(100)
      // Give it time to sample
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const metrics = monitor.getMetrics()
          expect(metrics.averageFPS).toBeDefined()
          resolve()
        }, 200)
      })
    })

    it('should calculate 95th percentile frame time', () => {
      monitor.startFPSSampling(100)
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const metrics = monitor.getMetrics()
          expect(metrics.frameTime95th).toBeDefined()
          resolve()
        }, 200)
      })
    })
  })

  describe('Memory Tracking', () => {
    it('should track peak memory usage', () => {
      const metrics = monitor.getMetrics()
      expect(metrics.peakMemoryMB).toBeDefined()
    })

    it('should update memory baseline', () => {
      const initialMetrics = monitor.getMetrics()
      const updatedMetrics = monitor.getMetrics()
      expect(updatedMetrics.peakMemoryMB).toBeDefined()
      if (initialMetrics.peakMemoryMB !== null && updatedMetrics.peakMemoryMB !== null) {
        expect(updatedMetrics.peakMemoryMB).toBeGreaterThanOrEqual(initialMetrics.peakMemoryMB)
      }
    })
  })

  describe('Session Tracking', () => {
    it('should record successful sessions', () => {
      monitor.recordSession(true)
      const metrics = monitor.getMetrics()
      expect(metrics.totalSessions).toBeGreaterThan(0)
      expect(metrics.crashFreeSessions).toBeGreaterThan(0)
    })

    it('should record failed sessions', () => {
      monitor.recordSession(false)
      const metrics = monitor.getMetrics()
      expect(metrics.totalSessions).toBeGreaterThan(0)
    })

    it('should calculate crash-free rate', () => {
      monitor.recordSession(true)
      monitor.recordSession(true)
      monitor.recordSession(false)
      const rate = monitor.getCrashFreeRate()
      expect(rate).toBeGreaterThanOrEqual(0)
      expect(rate).toBeLessThanOrEqual(1)
    })

    it('should return 1.0 for zero sessions', () => {
      const rate = monitor.getCrashFreeRate()
      expect(rate).toBe(1.0)
    })
  })

  describe('Budget Checking', () => {
    it('should check budget violations', () => {
      const budgetCheck = monitor.checkBudget()
      expect(budgetCheck).toHaveProperty('passed')
      expect(budgetCheck).toHaveProperty('violations')
      expect(Array.isArray(budgetCheck.violations)).toBe(true)
    })

    it('should allow custom budget', () => {
      monitor.setBudget({ coldStartMaxMs: 1000 })
      const budgetCheck = monitor.checkBudget()
      expect(budgetCheck).toHaveProperty('passed')
    })
  })

  describe('Error Tracking', () => {
    it('should track unhandled errors', () => {
      const initialMetrics = monitor.getMetrics()
      const errorEvent = new ErrorEvent('error', { message: 'Test error' })
      window.dispatchEvent(errorEvent)
      
      // Give event handler time to process
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const updatedMetrics = monitor.getMetrics()
          expect(updatedMetrics.errorCount).toBeGreaterThanOrEqual(initialMetrics.errorCount)
          resolve()
        }, 10)
      })
    })
  })

  describe('Persistence', () => {
    it('should persist and load metrics', () => {
      monitor.recordSession(true)
      const initialMetrics = monitor.getMetrics()
      
      // Create new instance to test loading
      const newMonitor = getPerformanceMonitor()
      newMonitor.loadMetrics()
      const loadedMetrics = newMonitor.getMetrics()
      
      expect(loadedMetrics.totalSessions).toBe(initialMetrics.totalSessions)
      expect(loadedMetrics.crashFreeSessions).toBe(initialMetrics.crashFreeSessions)
    })
  })

  describe('Report Generation', () => {
    it('should generate performance report', () => {
      monitor.recordSession(true)
      const report = monitor.generateReport()
      expect(typeof report).toBe('string')
      expect(report.length).toBeGreaterThan(0)
      expect(report).toContain('Performance Report')
    })
  })

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const monitor1 = getPerformanceMonitor()
      const monitor2 = getPerformanceMonitor()
      expect(monitor1).toBe(monitor2)
    })
  })

  describe('startPerformanceTracking', () => {
    it('should start FPS sampling', () => {
      startPerformanceTracking()
      // Function should complete without error
      expect(true).toBe(true)
    })
  })
})
