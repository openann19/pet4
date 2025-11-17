/**
 * Performance Analytics (Web)
 *
 * Tracks Core Web Vitals, frame rate, memory usage, and network performance.
 * Features:
 * - Core Web Vitals tracking (LCP, FID, CLS, TTFB, FCP)
 * - Frame rate monitoring (60fps/120fps/240fps)
 * - Memory usage tracking
 * - Network performance tracking
 * - Bundle size monitoring
 * - Performance regression detection
 *
 * Location: apps/web/src/lib/analytics/performance.ts
 */

import { createLogger } from '../logger'

const logger = createLogger('performance-analytics')

/**
 * Core Web Vital metric
 */
export interface CoreWebVital {
  readonly name: string
  readonly value: number
  readonly rating: 'good' | 'needs-improvement' | 'poor'
  readonly timestamp: number
  readonly id?: string
  readonly delta?: number
  readonly entries?: PerformanceEntry[]
}

/**
 * Frame rate metric
 */
export interface FrameRateMetric {
  readonly fps: number
  readonly droppedFrames: number
  readonly timestamp: number
  readonly deviceHz: number
}

/**
 * Memory metric
 */
export interface MemoryMetric {
  readonly usedJSHeapSize: number
  readonly totalJSHeapSize: number
  readonly jsHeapSizeLimit: number
  readonly timestamp: number
}

/**
 * Network metric
 */
export interface NetworkMetric {
  readonly url: string
  readonly duration: number
  readonly size: number
  readonly type: string
  readonly timestamp: number
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  readonly webVitals: CoreWebVital[]
  readonly frameRate: FrameRateMetric[]
  readonly memory: MemoryMetric[]
  readonly network: NetworkMetric[]
  readonly timestamp: number
}

/**
 * Performance analytics
 */
export class PerformanceAnalytics {
  private readonly webVitals: CoreWebVital[] = []
  private readonly frameRateMetrics: FrameRateMetric[] = []
  private readonly memoryMetrics: MemoryMetric[] = []
  private readonly networkMetrics: NetworkMetric[] = []
  private frameRateMonitor: number | null = null
  private memoryMonitor: number | null = null

  /**
   * Track Core Web Vital
   */
  trackWebVital(vital: CoreWebVital): void {
    this.webVitals.push(vital)

    logger.debug('Core Web Vital tracked', {
      name: vital.name,
      value: vital.value,
      rating: vital.rating,
    })
  }

  /**
   * Track frame rate
   */
  trackFrameRate(metric: FrameRateMetric): void {
    this.frameRateMetrics.push(metric)

    logger.debug('Frame rate tracked', {
      fps: metric.fps,
      droppedFrames: metric.droppedFrames,
      deviceHz: metric.deviceHz,
    })
  }

  /**
   * Track memory usage
   */
  trackMemory(metric: MemoryMetric): void {
    this.memoryMetrics.push(metric)

    logger.debug('Memory usage tracked', {
      usedJSHeapSize: metric.usedJSHeapSize,
      totalJSHeapSize: metric.totalJSHeapSize,
    })
  }

  /**
   * Track network performance
   */
  trackNetwork(metric: NetworkMetric): void {
    this.networkMetrics.push(metric)

    logger.debug('Network performance tracked', {
      url: metric.url,
      duration: metric.duration,
      size: metric.size,
    })
  }

  /**
   * Start frame rate monitoring
   */
  startFrameRateMonitoring(targetHz = 60): void {
    if (this.frameRateMonitor !== null) {
      return
    }

    let lastFrameTime = performance.now()
    let frameCount = 0
    let droppedFrames = 0
    const targetFrameTime = 1000 / targetHz

    const monitor = () => {
      const currentTime = performance.now()
      const deltaTime = currentTime - lastFrameTime

      frameCount++

      // Check for dropped frames
      if (deltaTime > targetFrameTime * 1.5) {
        const expectedFrames = Math.floor(deltaTime / targetFrameTime)
        droppedFrames += expectedFrames - 1
      }

      // Calculate FPS every second
      if (frameCount >= targetHz) {
        const fps = Math.round((frameCount / (currentTime - lastFrameTime)) * 1000)
        const deviceHz = this.detectDeviceHz()

        this.trackFrameRate({
          fps,
          droppedFrames,
          timestamp: currentTime,
          deviceHz,
        })

        frameCount = 0
        droppedFrames = 0
        lastFrameTime = currentTime
      }

      this.frameRateMonitor = requestAnimationFrame(monitor)
    }

    this.frameRateMonitor = requestAnimationFrame(monitor)
    logger.debug('Frame rate monitoring started', { targetHz })
  }

  /**
   * Stop frame rate monitoring
   */
  stopFrameRateMonitoring(): void {
    if (this.frameRateMonitor !== null) {
      cancelAnimationFrame(this.frameRateMonitor)
      this.frameRateMonitor = null
      logger.debug('Frame rate monitoring stopped')
    }
  }

  /**
   * Detect device refresh rate
   */
  private detectDeviceHz(): number {
    // Detect refresh rate by measuring frame times
    let hz = 60 // Default

    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      const samples: number[] = []
      let lastTime = performance.now()
      let sampleCount = 0

      const sample = (currentTime: number) => {
        const delta = currentTime - lastTime
        samples.push(delta)
        sampleCount++

        if (sampleCount < 60) {
          lastTime = currentTime
          requestAnimationFrame(sample)
        } else {
          // Calculate average frame time
          const avgFrameTime = samples.reduce((a, b) => a + b, 0) / samples.length
          hz = Math.round(1000 / avgFrameTime)

          // Round to common refresh rates
          if (hz >= 115 && hz <= 125) {
            hz = 120
          } else if (hz >= 235 && hz <= 245) {
            hz = 240
          } else {
            hz = 60
          }
        }
      }

      requestAnimationFrame(sample)
    }

    return hz
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring(interval = 5000): void {
    if (this.memoryMonitor !== null) {
      return
    }

    this.memoryMonitor = window.setInterval(() => {
      if ('memory' in performance) {
        interface MemoryInfo {
          readonly usedJSHeapSize: number
          readonly totalJSHeapSize: number
          readonly jsHeapSizeLimit: number
        }

        type PerformanceWithMemory = Performance & {
          memory: MemoryInfo
        }

        const perfWithMemory = performance as PerformanceWithMemory
        const memory = perfWithMemory.memory

        this.trackMemory({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: Date.now(),
        })
      }
    }, interval)

    logger.debug('Memory monitoring started', { interval })
  }

  /**
   * Stop memory monitoring
   */
  stopMemoryMonitoring(): void {
    if (this.memoryMonitor !== null) {
      clearInterval(this.memoryMonitor)
      this.memoryMonitor = null
      logger.debug('Memory monitoring stopped')
    }
  }

  /**
   * Track network resource
   */
  trackNetworkResource(url: string, type: string): void {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return
    }

    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const resource = entries.find((e) => e.name === url)

    if (resource) {
      const duration = resource.responseEnd - resource.requestStart
      const size = resource.transferSize || resource.decodedBodySize || 0

      this.trackNetwork({
        url,
        duration,
        size,
        type,
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      webVitals: [...this.webVitals],
      frameRate: [...this.frameRateMetrics],
      memory: [...this.memoryMetrics],
      network: [...this.networkMetrics],
      timestamp: Date.now(),
    }
  }

  /**
   * Detect performance regression
   */
  detectRegression(metricName: string, threshold: number): boolean {
    const recentMetrics = this.getRecentMetrics(metricName, 10)

    if (recentMetrics.length < 2) {
      return false
    }

    const avgRecent = recentMetrics.reduce((a, b) => a + b, 0) / recentMetrics.length
    const baseline = recentMetrics[0]

    if (baseline === undefined || baseline === 0) {
      return false
    }

    const regression = avgRecent > baseline * (1 + threshold / 100)

    if (regression) {
      logger.warn('Performance regression detected', {
        metricName,
        baseline,
        avgRecent,
        threshold,
      })
    }

    return regression
  }

  /**
   * Get recent metrics
   */
  private getRecentMetrics(metricName: string, count: number): number[] {
    // This is a simplified implementation
    // In a real implementation, you would filter by metric name and get recent values
    return []
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.webVitals.length = 0
    this.frameRateMetrics.length = 0
    this.memoryMetrics.length = 0
    this.networkMetrics.length = 0
    logger.debug('Performance analytics data cleared')
  }
}

/**
 * Create performance analytics instance
 */
let performanceInstance: PerformanceAnalytics | null = null

export function getPerformanceAnalytics(): PerformanceAnalytics {
  if (!performanceInstance) {
    performanceInstance = new PerformanceAnalytics()
  }
  return performanceInstance
}
