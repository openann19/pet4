/**
 * Performance monitoring utilities
 * Location: src/utils/performance.ts
 */

import { createLogger } from './logger'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('performance')

export interface PerformanceEntry {
  name: string
  duration: number
  startTime: number
}

class PerformanceMonitor {
  private entries: PerformanceEntry[] = []
  private marks: Map<string, number> = new Map()

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    this.marks.set(name, Date.now())
  }

  /**
   * Measure the duration between a mark and now
   */
  measure(name: string, markName: string): void {
    const startTime = this.marks.get(markName)
    if (startTime === undefined) {
      logger.warn('Performance mark not found', { markName })
      return
    }

    const duration = Date.now() - startTime
    this.entries.push({
      name,
      duration,
      startTime,
    })

    // Log slow operations (> 100ms)
    if (duration > 100) {
      logger.warn('Slow operation detected', {
        name,
        duration,
        threshold: 100,
      })
    }
  }

  /**
   * Get all performance entries
   */
  getEntries(): PerformanceEntry[] {
    return [...this.entries]
  }

  /**
   * Get entries for a specific name
   */
  getEntriesByName(name: string): PerformanceEntry[] {
    return this.entries.filter((entry) => entry.name === name)
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = []
    this.marks.clear()
  }
}

export const performanceMonitor = new PerformanceMonitor()

/**
 * Hook to measure component render time
 */
export function usePerformanceMeasure(
  componentName: string,
  enabled: boolean = true
): {
  startMeasure: () => void
  endMeasure: () => void
} {
  const startMeasure = (): void => {
    if (isTruthy(enabled)) {
      performanceMonitor.mark(`${String(componentName ?? '')}-render-start`)
    }
  }

  const endMeasure = (): void => {
    if (isTruthy(enabled)) {
      performanceMonitor.measure(
        `${String(componentName ?? '')}-render`,
        `${String(componentName ?? '')}-render-start`
      )
    }
  }

  return {
    startMeasure,
    endMeasure,
  }
}

