import { Router } from 'express'
import { performanceMonitor } from '../../services/performance-monitor'
import { createLogger } from '../../utils/logger'

const logger = createLogger('PerformanceRoutes')
const router = Router()

// Get performance metrics for monitoring
router.get('/metrics', (req, res) => {
  try {
    const timeWindow = parseInt(req.query.window as string) || 60 // minutes
    const report = performanceMonitor.getPerformanceReport(timeWindow)

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
      timeWindowMinutes: timeWindow,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to get performance metrics', err)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance metrics',
      message: err.message,
    })
  }
})

// Get metrics for specific query
router.get('/metrics/:queryName', (req, res) => {
  try {
    const { queryName } = req.params
    const timeWindow = parseInt(req.query.window as string) || 60 // minutes

    const metrics = performanceMonitor.getMetrics(queryName)
    const averageTime = performanceMonitor.getAverageQueryTime(queryName, timeWindow)

    res.json({
      success: true,
      data: {
        queryName,
        metrics,
        averageTimeMs: averageTime,
        timeWindowMinutes: timeWindow,
        totalExecutions: metrics.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to get query metrics', err, { queryName: req.params.queryName })
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve query metrics',
      message: err.message,
    })
  }
})

// Clear performance metrics (admin only)
router.delete('/metrics', (req, res) => {
  try {
    performanceMonitor.clearMetrics()
    logger.info('Performance metrics cleared by admin')

    res.json({
      success: true,
      message: 'Performance metrics cleared successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to clear performance metrics', err)
    res.status(500).json({
      success: false,
      error: 'Failed to clear performance metrics',
      message: err.message,
    })
  }
})

export default router
