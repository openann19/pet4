/**
 * Real-Time Monitoring (Web)
 *
 * Provides real-time performance monitoring with alerts and regression detection.
 * Features:
 * - Real-time metrics dashboard
 * - Alert system for anomalies
 * - Performance regression detection
 * - Metrics aggregation and reporting
 *
 * Location: apps/web/src/lib/monitoring/real-time.ts
 */

import { createLogger } from '../logger'
import { getPerformanceAnalytics, type PerformanceMetrics } from '../analytics/performance'

const logger = createLogger('real-time-monitoring')

/**
 * Alert severity
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

/**
 * Alert
 */
export interface Alert {
  readonly id: string
  readonly title: string
  readonly message: string
  readonly severity: AlertSeverity
  readonly metric: string
  readonly threshold: number
  readonly currentValue: number
  readonly timestamp: number
  readonly acknowledged: boolean
}

/**
 * Metric threshold
 */
export interface MetricThreshold {
  readonly metric: string
  readonly threshold: number
  readonly severity: AlertSeverity
  readonly condition: 'above' | 'below' | 'equal'
}

/**
 * Real-time monitoring options
 */
export interface RealTimeMonitoringOptions {
  readonly enableAlerts?: boolean
  readonly enableRegressionDetection?: boolean
  readonly alertThresholds?: MetricThreshold[]
  readonly updateInterval?: number
}

/**
 * Real-time monitor
 */
export class RealTimeMonitor {
  private readonly alerts: Alert[] = []
  private readonly thresholds: MetricThreshold[] = []
  private readonly enableAlerts: boolean
  private readonly enableRegressionDetection: boolean
  private readonly updateInterval: number
  private monitorInterval: number | null = null
  private readonly listeners = new Set<(metrics: PerformanceMetrics) => void>()
  private readonly alertListeners = new Set<(alert: Alert) => void>()

  constructor(options: RealTimeMonitoringOptions = {}) {
    this.enableAlerts = options.enableAlerts ?? true
    this.enableRegressionDetection = options.enableRegressionDetection ?? true
    this.updateInterval = options.updateInterval ?? 5000
    this.thresholds = options.alertThresholds ?? []

    if (this.enableAlerts || this.enableRegressionDetection) {
      this.startMonitoring()
    }
  }

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    if (this.monitorInterval !== null) {
      return
    }

    this.monitorInterval = window.setInterval(() => {
      this.checkMetrics()
    }, this.updateInterval)

    logger.debug('Real-time monitoring started', { updateInterval: this.updateInterval })
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval !== null) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
      logger.debug('Real-time monitoring stopped')
    }
  }

  /**
   * Check metrics
   */
  private checkMetrics(): void {
    const performanceAnalytics = getPerformanceAnalytics()
    const metrics = performanceAnalytics.getMetrics()

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(metrics)
      } catch (error) {
        logger.error('Error in metrics listener', {
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    })

    // Check thresholds
    if (this.enableAlerts) {
      this.checkThresholds(metrics)
    }

    // Detect regressions
    if (this.enableRegressionDetection) {
      this.detectRegressions(metrics)
    }
  }

  /**
   * Check thresholds
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    this.thresholds.forEach((threshold) => {
      const value = this.getMetricValue(metrics, threshold.metric)

      if (value === null) {
        return
      }

      const shouldAlert = this.checkThresholdCondition(value, threshold.threshold, threshold.condition)

      if (shouldAlert) {
        this.createAlert(threshold, value)
      }
    })
  }

  /**
   * Get metric value
   */
  private getMetricValue(metrics: PerformanceMetrics, metricName: string): number | null {
    // Extract metric value from metrics object
    // This is a simplified implementation
    if (metricName.startsWith('webVital.')) {
      const vitalName = metricName.split('.')[1]
      const vital = metrics.webVitals.find((v) => v.name === vitalName)
      return vital ? vital.value : null
    }

    if (metricName.startsWith('frameRate.')) {
      const frameRateMetric = metrics.frameRate[metrics.frameRate.length - 1]
      if (metricName === 'frameRate.fps') {
        return frameRateMetric ? frameRateMetric.fps : null
      }
      if (metricName === 'frameRate.droppedFrames') {
        return frameRateMetric ? frameRateMetric.droppedFrames : null
      }
    }

    if (metricName.startsWith('memory.')) {
      const memoryMetric = metrics.memory[metrics.memory.length - 1]
      if (metricName === 'memory.usedJSHeapSize') {
        return memoryMetric ? memoryMetric.usedJSHeapSize : null
      }
      if (metricName === 'memory.totalJSHeapSize') {
        return memoryMetric ? memoryMetric.totalJSHeapSize : null
      }
    }

    return null
  }

  /**
   * Check threshold condition
   */
  private checkThresholdCondition(
    value: number,
    threshold: number,
    condition: 'above' | 'below' | 'equal'
  ): boolean {
    switch (condition) {
      case 'above':
        return value > threshold
      case 'below':
        return value < threshold
      case 'equal':
        return value === threshold
      default:
        return false
    }
  }

  /**
   * Create alert
   */
  private createAlert(threshold: MetricThreshold, currentValue: number): void {
    const alertId = `alert-${threshold.metric}-${Date.now()}`
    const existingAlert = this.alerts.find(
      (a) => a.metric === threshold.metric && !a.acknowledged
    )

    if (existingAlert) {
      // Update existing alert
      return
    }

    const alert: Alert = {
      id: alertId,
      title: `Metric threshold exceeded: ${threshold.metric}`,
      message: `${threshold.metric} is ${currentValue}, threshold is ${threshold.threshold}`,
      severity: threshold.severity,
      metric: threshold.metric,
      threshold: threshold.threshold,
      currentValue,
      timestamp: Date.now(),
      acknowledged: false,
    }

    this.alerts.push(alert)

    // Notify alert listeners
    this.alertListeners.forEach((listener) => {
      try {
        listener(alert)
      } catch (error) {
        logger.error('Error in alert listener', {
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    })

    logger.warn('Alert created', {
      id: alertId,
      metric: threshold.metric,
      severity: threshold.severity,
      currentValue,
      threshold: threshold.threshold,
    })
  }

  /**
   * Detect regressions
   */
  private detectRegressions(metrics: PerformanceMetrics): void {
    const _performanceAnalytics = getPerformanceAnalytics()

    // Check for frame rate regression
    if (metrics.frameRate.length > 0) {
      const recentFPS = metrics.frameRate.slice(-10).map((m) => m.fps)
      const avgFPS = recentFPS.reduce((a, b) => a + b, 0) / recentFPS.length

      if (avgFPS < 50) {
        // Frame rate dropped below 50 FPS
        this.createAlert(
          {
            metric: 'frameRate.fps',
            threshold: 50,
            severity: 'warning',
            condition: 'below',
          },
          avgFPS
        )
      }
    }

    // Check for memory regression
    if (metrics.memory.length > 0) {
      const recentMemory = metrics.memory.slice(-10).map((m) => m.usedJSHeapSize)
      const _avgMemory = recentMemory.reduce((a, b) => a + b, 0) / recentMemory.length
      const maxMemory = Math.max(...recentMemory)

      if (maxMemory > 100 * 1024 * 1024) {
        // Memory usage exceeded 100MB
        this.createAlert(
          {
            metric: 'memory.usedJSHeapSize',
            threshold: 100 * 1024 * 1024,
            severity: 'warning',
            condition: 'above',
          },
          maxMemory
        )
      }
    }
  }

  /**
   * Subscribe to metrics
   */
  subscribe(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Subscribe to alerts
   */
  subscribeToAlerts(listener: (alert: Alert) => void): () => void {
    this.alertListeners.add(listener)
    return () => {
      this.alertListeners.delete(listener)
    }
  }

  /**
   * Get alerts
   */
  getAlerts(): readonly Alert[] {
    return [...this.alerts]
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId)
    if (alert) {
      const index = this.alerts.indexOf(alert)
      this.alerts[index] = { ...alert, acknowledged: true }
      logger.debug('Alert acknowledged', { alertId })
    }
  }

  /**
   * Add threshold
   */
  addThreshold(threshold: MetricThreshold): void {
    this.thresholds.push(threshold)
    logger.debug('Threshold added', { metric: threshold.metric, threshold: threshold.threshold })
  }

  /**
   * Remove threshold
   */
  removeThreshold(metric: string): void {
    const index = this.thresholds.findIndex((t) => t.metric === metric)
    if (index !== -1) {
      this.thresholds.splice(index, 1)
      logger.debug('Threshold removed', { metric })
    }
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts.length = 0
    logger.debug('Alerts cleared')
  }
}

/**
 * Create real-time monitor instance
 */
let monitorInstance: RealTimeMonitor | null = null

export function getRealTimeMonitor(options?: RealTimeMonitoringOptions): RealTimeMonitor {
  if (!monitorInstance) {
    monitorInstance = new RealTimeMonitor(options)
  }
  return monitorInstance
}
