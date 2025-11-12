#!/usr/bin/env node

/**
 * Performance Validation Script
 * Validates animation performance against targets
 */

import { runPerformanceTestSuite } from './test-animation-performance'
import { createLogger } from '../../src/lib/logger'

const logger = createLogger('performance-validation')

async function main(): Promise<void> {
  logger.info('Starting performance validation')

  const suite = await runPerformanceTestSuite()

  logger.info('Performance test results', { passed: suite.passed, failed: suite.failed })

  if (suite.failed > 0) {
    logger.warn('Some performance tests failed')
    suite.results
      .filter(r => !r.passed)
      .forEach(r => {
        logger.warn('Failed test', {
          averageFrameTime: r.averageFrameTime,
          droppedFrames: r.droppedFrames,
          memoryUsageMB: (r.memoryUsage / 1024 / 1024).toFixed(2),
        })
      })

    process.exit(1)
  }

  logger.info('All performance tests passed')
  process.exit(0)
}

main().catch(error => {
  const err = error instanceof Error ? error : new Error(String(error))
  logger.error('Error running performance tests', err)
  process.exit(1)
})
