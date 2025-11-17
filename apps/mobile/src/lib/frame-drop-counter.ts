import { isTruthy, isDefined } from '@petspark/shared';

/**
 * Frame Drop Counter
 *
 * Simple frame drop counter for mobile performance monitoring.
 * Logs frame drops and memory peaks around heavy effects.
 */

interface FrameMetrics {
  droppedFrames: number
  totalFrames: number
  memoryPeak: number
  startTime: number
}

let metrics: FrameMetrics = {
  droppedFrames: 0,
  totalFrames: 0,
  memoryPeak: 0,
  startTime: Date.now(),
}

let lastFrameTime = 0
const FRAME_BUDGET_MS = 16.67 // 60 FPS target

/**
 * Track frame timing
 */
export function trackFrame(): void {
  const now = Date.now()

  if (lastFrameTime > 0) {
    const frameTime = now - lastFrameTime
    if (frameTime > FRAME_BUDGET_MS * 1.5) {
      // Frame drop detected (more than 1.5x frame budget)
      metrics.droppedFrames++
    }
  }

  lastFrameTime = now
  metrics.totalFrames++

  // Track memory usage (if available)
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory
    if (isTruthy(memory)) {
      const usedMB = memory.usedJSHeapSize / (1024 * 1024)
      if (usedMB > metrics.memoryPeak) {
        metrics.memoryPeak = usedMB
      }
    }
  }
}

/**
 * Start frame tracking for an effect
 */
export function startFrameTracking(): () => FrameMetrics {
  const startTime = Date.now()
  const startDropped = metrics.droppedFrames
  const startTotal = metrics.totalFrames
  const startMemory = metrics.memoryPeak

  // Reset frame tracking
  lastFrameTime = 0

  return () => {
    const duration = Date.now() - startTime
    const dropped = metrics.droppedFrames - startDropped
    const total = metrics.totalFrames - startTotal
    const memoryDelta = metrics.memoryPeak - startMemory

    const result: FrameMetrics = {
      droppedFrames: dropped,
      totalFrames: total,
      memoryPeak: memoryDelta,
      startTime,
    }

    // Log if significant frame drops detected
    if (dropped > 2 && duration < 300) {
      // Send to telemetry if available
      const isProduction = process.env['NODE_ENV'] === 'production'
      const telemetryEndpoint = process.env['EXPO_PUBLIC_TELEMETRY_ENDPOINT']

      if (isProduction && telemetryEndpoint) {
        try {
          void fetch(telemetryEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'frame-drop',
              ...result,
              duration,
              frameRate: total > 0 ? ((total - dropped) / total) * 60 : 60,
            }),
            keepalive: true,
          }).catch(() => {
            // Silently fail if telemetry is unavailable
          })
        } catch {
          // Silently fail
        }
      }
    }

    return result
  }
}

/**
 * Get current frame metrics
 */
export function getFrameMetrics(): FrameMetrics {
  return { ...metrics }
}

/**
 * Reset metrics
 */
export function resetFrameMetrics(): void {
  metrics = {
    droppedFrames: 0,
    totalFrames: 0,
    memoryPeak: 0,
    startTime: Date.now(),
  }
  lastFrameTime = 0
}
