import { createLogger } from '../utils/logger'

const logger = createLogger('PerformanceMonitor')

export interface QueryMetrics {
  queryName: string
  duration: number
  recordCount: number
  timestamp: Date
}

class PerformanceMonitor {
  private metrics: QueryMetrics[] = []
  private readonly maxMetrics = 1000 // Keep last 1000 metrics

  recordQueryMetric(queryName: string, duration: number, recordCount: number): void {
    const metric: QueryMetrics = {
      queryName,
      duration,
      recordCount,
      timestamp: new Date(),
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow queries
    if (duration > 1000) {
      logger.warn('Slow query detected', {
        queryName,
        duration: `${duration}ms`,
        recordCount,
      })
    }

    // Log significant query metrics
    if (recordCount > 100 || duration > 500) {
      logger.info('Query performance metric', {
        queryName,
        duration: `${duration}ms`,
        recordCount,
        throughput: `${(recordCount / (duration / 1000)).toFixed(2)} records/sec`,
      })
    }
  }

  getMetrics(queryName?: string): QueryMetrics[] {
    if (queryName) {
      return this.metrics.filter(m => m.queryName === queryName)
    }
    return [...this.metrics]
  }

  getAverageQueryTime(queryName: string, timeWindowMinutes = 60): number {
    const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000)
    const recentMetrics = this.metrics.filter(
      m => m.queryName === queryName && m.timestamp >= since
    )

    if (recentMetrics.length === 0) return 0

    const total = recentMetrics.reduce((sum, m) => sum + m.duration, 0)
    return total / recentMetrics.length
  }

  getPerformanceReport(timeWindowMinutes = 60): {
    totalQueries: number
    averageQueryTime: number
    slowQueries: number
    topSlowQueries: Array<{ queryName: string; avgDuration: number; count: number }>
  } {
    const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000)
    const recentMetrics = this.metrics.filter(m => m.timestamp >= since)

    const totalQueries = recentMetrics.length
    const averageQueryTime =
      totalQueries > 0 ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries : 0
    const slowQueries = recentMetrics.filter(m => m.duration > 1000).length

    // Group by query name and calculate averages
    const queryGroups = recentMetrics.reduce(
      (groups, metric) => {
        if (!groups[metric.queryName]) {
          groups[metric.queryName] = []
        }
        const existingGroup = groups[metric.queryName]
        if (existingGroup) {
          existingGroup.push(metric)
        }
        return groups
      },
      {} as Record<string, QueryMetrics[]>
    )

    const topSlowQueries = Object.entries(queryGroups)
      .map(([queryName, metrics]) => ({
        queryName,
        avgDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
        count: metrics.length,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10)

    return {
      totalQueries,
      averageQueryTime,
      slowQueries,
      topSlowQueries,
    }
  }

  clearMetrics(): void {
    this.metrics = []
    logger.info('Performance metrics cleared')
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Decorator for automatic query performance monitoring
export function monitorQuery(queryName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      try {
        const result = await method.apply(this, args)
        const duration = Date.now() - startTime

        // Try to extract record count from result
        const recordCount = Array.isArray(result)
          ? result.length
          : result && typeof result === 'object' && 'rows' in result
            ? result.rows.length
            : 1

        performanceMonitor.recordQueryMetric(queryName, duration, recordCount)
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        logger.error('Query failed', error as Error, { queryName, duration: `${duration}ms` })
        throw error
      }
    }

    return descriptor
  }
}
