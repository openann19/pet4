/**
 * Performance budget enforcement
 * Monitors bundle size, render times, and memory usage
 * Location: src/utils/performance-budget.ts
 */

import { createLogger } from './logger'
import { telemetry } from './telemetry'
import { isTruthy, isDefined } from '@petspark/shared';

const logger = createLogger('performance-budget')

export interface PerformanceBudget {
  coldStartMs: number
  ttiMs: number
  bundleSizeMB: number
  installSizeMB: number
  frameTimeMs: number
  memoryMB: number
}

export const DEFAULT_BUDGET: PerformanceBudget = {
  coldStartMs: 1800, // 1.8s
  ttiMs: 2200, // 2.2s
  bundleSizeMB: 12, // 12 MB JS
  installSizeMB: 60, // 60 MB
  frameTimeMs: 16.67, // 60 FPS = 16.67ms per frame
  memoryMB: 200, // 200 MB max
}

class PerformanceBudgetChecker {
  private budget: PerformanceBudget
  private violations: Array<{
    metric: string
    value: number
    limit: number
    timestamp: number
  }> = []

  constructor(budget: PerformanceBudget = DEFAULT_BUDGET) {
    this.budget = budget
  }

  /**
   * Check cold start time
   */
  checkColdStart(durationMs: number): boolean {
    if (durationMs > this.budget.coldStartMs) {
      this.recordViolation('coldStart', durationMs, this.budget.coldStartMs)
      return false
    }
    return true
  }

  /**
   * Check Time to Interactive
   */
  checkTTI(durationMs: number): boolean {
    if (durationMs > this.budget.ttiMs) {
      this.recordViolation('tti', durationMs, this.budget.ttiMs)
      return false
    }
    return true
  }

  /**
   * Check frame time (60 FPS = 16.67ms)
   */
  checkFrameTime(frameTimeMs: number): boolean {
    if (frameTimeMs > this.budget.frameTimeMs) {
      this.recordViolation('frameTime', frameTimeMs, this.budget.frameTimeMs)

      // Log jank detection
      telemetry.trace({
        name: 'jank_detected',
        duration: frameTimeMs,
        metadata: {
          expected: this.budget.frameTimeMs,
          jankPercentage: ((frameTimeMs - this.budget.frameTimeMs) / this.budget.frameTimeMs) * 100,
        },
      })

      return false
    }
    return true
  }

  /**
   * Check render time for a component
   */
  checkRenderTime(componentName: string, durationMs: number): boolean {
    // Target: < 16ms for 60 FPS
    const maxRenderTime = 16

    if (durationMs > maxRenderTime) {
      logger.warn('Slow render detected', {
        component: componentName,
        duration: durationMs,
        threshold: maxRenderTime,
      })

      telemetry.trace({
        name: 'slow_render',
        duration: durationMs,
        metadata: {
          component: componentName,
          threshold: maxRenderTime,
        },
      })

      return false
    }
    return true
  }

  /**
   * Check memory usage
   */
  checkMemoryUsage(usageMB: number): boolean {
    if (usageMB > this.budget.memoryMB) {
      this.recordViolation('memory', usageMB, this.budget.memoryMB)
      return false
    }
    return true
  }

  /**
   * Get all violations
   */
  getViolations(): Array<{
    metric: string
    value: number
    limit: number
    timestamp: number
  }> {
    return [...this.violations]
  }

  /**
   * Clear violations
   */
  clearViolations(): void {
    this.violations = []
  }

  private recordViolation(metric: string, value: number, limit: number): void {
    const violation = {
      metric,
      value,
      limit,
      timestamp: Date.now(),
    }

    this.violations.push(violation)

    logger.error('Performance budget violation', undefined, violation)

    telemetry.track({
      name: 'performance_budget_violation',
      payload: violation,
    })
  }
}

export const performanceBudget = new PerformanceBudgetChecker()

/**
 * Monitor frame rate and detect jank
 */
export function createFrameRateMonitor(onJankDetected?: (frameTimeMs: number) => void): {
  start: () => void
  stop: () => void
  getFPS: () => number
} {
  // Frame count is tracked but not currently used in calculations
  let lastTime = Date.now()
  let frameTimes: number[] = []
  let isRunning = false
  let animationFrameId: number | null = null

  const measureFrame = (): void => {
    if (!isRunning) {
      return
    }

    const now = Date.now()
    const frameTime = now - lastTime
    lastTime = now

    // Frame count tracked but not used in calculations (reserved for future use)
    frameTimes.push(frameTime)

    // Keep only last 60 frames
    if (frameTimes.length > 60) {
      frameTimes.shift()
    }

    // Check for jank
    if (frameTime > 16.67) {
      const jankPercentage = ((frameTime - 16.67) / 16.67) * 100
      performanceBudget.checkFrameTime(frameTime)

      if (onJankDetected && jankPercentage > 5) {
        onJankDetected(frameTime)
      }
    }

    // Use requestAnimationFrame equivalent for React Native
    // In React Native, we'd use InteractionManager or a native module
    animationFrameId = requestAnimationFrame(measureFrame)
  }

  return {
    start: (): void => {
      if (isTruthy(isRunning)) {
        return
      }
      isRunning = true
      lastTime = Date.now()
      frameTimes = []
      measureFrame()
    },
    stop: (): void => {
      isRunning = false
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    },
    getFPS: (): number => {
      if (frameTimes.length === 0) {
        return 0
      }
      const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length
      return 1000 / avgFrameTime
    },
  }
}

// Polyfill for requestAnimationFrame in React Native
function requestAnimationFrame(callback: () => void): number {
  // Use InteractionManager or native timing
  // In React Native environment, setTimeout returns a number
  // The return value is compatible with cancelAnimationFrame which expects a number
  const timeoutId = setTimeout(callback, 16)
  // TypeScript types may show NodeJS.Timeout, but in RN it's actually a number
  // We know this is safe in the React Native environment
  return Number(timeoutId)
}

function cancelAnimationFrame(id: number): void {
  clearTimeout(id)
}
