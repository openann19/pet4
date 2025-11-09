/**
 * Effect Telemetry Hook (Mobile)
 *
 * Tracks effect performance metrics: duration, dropped frames, device Hz
 * Logs to structured logger (no PII)
 * Integrates with useDeviceRefreshRate for accurate Hz detection
 *
 * Location: apps/mobile/src/effects/core/use-effect-telemetry.ts
 */

import { useRef, useCallback, useEffect } from 'react'
import { createLogger } from '../../utils/logger'
import { useReducedMotionSV } from '../chat/core/reduced-motion'
import { useDeviceRefreshRate } from '../../hooks/use-device-refresh-rate'
import { logEffectStart, logEffectEnd, logEffectError } from '../chat/core/telemetry'
import type { EffectName } from '../chat/core/telemetry'

const logger = createLogger('EffectTelemetry')

export interface EffectTelemetryEvent {
  effect: string
  startedAt: number
  endedAt?: number
  durationMs?: number
  droppedFrames?: number
  deviceHz?: number
  reducedMotion: boolean
  success: boolean
}

export interface UseEffectTelemetryOptions {
  effectName: EffectName | string
  enabled?: boolean
  alertOnThreshold?: boolean
  maxDroppedFrames?: number
  maxDurationMs?: number
}

export interface UseEffectTelemetryReturn {
  start: () => string | null
  end: (success?: boolean, error?: Error) => void
  getDeviceHz: () => number
  getDroppedFrames: () => number
}

/**
 * Performance thresholds for alerts
 */
const DEFAULT_THRESHOLDS = {
  maxDroppedFrames: 2,
  maxDurationMs: 300,
}

/**
 * Track performance regressions
 */
const performanceHistory: Array<{
  effect: string
  durationMs: number
  droppedFrames: number
  timestamp: number
}> = []

const MAX_HISTORY_SIZE = 100

/**
 * Check for performance regression
 */
function checkPerformanceRegression(
  effect: string,
  durationMs: number,
  droppedFrames: number
): boolean {
  // Get recent history for this effect
  const recent = performanceHistory
    .filter((e) => e.effect === effect && Date.now() - e.timestamp < 3600000) // Last hour
    .slice(-10) // Last 10 runs

  if (recent.length < 3) {
    return false // Not enough data
  }

  const avgDuration = recent.reduce((sum, e) => sum + e.durationMs, 0) / recent.length
  const avgDroppedFrames = recent.reduce((sum, e) => sum + e.droppedFrames, 0) / recent.length

  // Check if current performance is significantly worse
  const durationRegression = durationMs > avgDuration * 1.5
  const framesRegression = droppedFrames > avgDroppedFrames * 2

  return durationRegression || framesRegression
}

/**
 * Hook to track effect telemetry
 */
export function useEffectTelemetry(options: UseEffectTelemetryOptions): UseEffectTelemetryReturn {
  const {
    effectName,
    enabled = true,
    alertOnThreshold = true,
    maxDroppedFrames = DEFAULT_THRESHOLDS.maxDroppedFrames,
    maxDurationMs = DEFAULT_THRESHOLDS.maxDurationMs,
  } = options

  const reducedMotion = useReducedMotionSV()
  const { hz: deviceHz } = useDeviceRefreshRate()
  const startTimeRef = useRef<number | null>(null)
  const frameCountRef = useRef(0)
  const lastFrameTimeRef = useRef<number | null>(null)
  const effectIdRef = useRef<string | null>(null)
  const animationFrameIdRef = useRef<number | null>(null)
  const expectedFrameTimeRef = useRef<number>(1000 / 60)

  // Update expected frame time when device Hz changes
  useEffect(() => {
    expectedFrameTimeRef.current = 1000 / deviceHz
  }, [deviceHz])

  const start = useCallback((): string | null => {
    if (!enabled) {
      return null
    }

    const startedAt = Date.now()
    startTimeRef.current = startedAt
    frameCountRef.current = 0
    lastFrameTimeRef.current = null

    // Start tracking with telemetry system
    try {
      effectIdRef.current = logEffectStart(effectName as EffectName, {
        deviceHz: deviceHz as 60 | 120,
        reducedMotion: reducedMotion.value,
      })
    } catch (error) {
      logger.warn('Failed to log effect start', { error, effectName })
      effectIdRef.current = null
    }

    // Track frame timing with accurate Hz detection
    const trackFrame = (): void => {
      if (startTimeRef.current === null) {
        return // Effect ended, stop tracking
      }

      const timestamp = Date.now()
      if (lastFrameTimeRef.current !== null) {
        const frameDelta = timestamp - lastFrameTimeRef.current
        const expectedFrameTime = expectedFrameTimeRef.current

        // If frame took significantly longer than expected, count as dropped
        if (frameDelta > expectedFrameTime * 1.5) {
          const dropped = Math.floor(frameDelta / expectedFrameTime - 1)
          frameCountRef.current += Math.max(0, dropped)
        }
      }

      lastFrameTimeRef.current = timestamp
      animationFrameIdRef.current = requestAnimationFrame(trackFrame)
    }

    animationFrameIdRef.current = requestAnimationFrame(trackFrame)

    return effectIdRef.current
  }, [enabled, effectName, deviceHz, reducedMotion])

  const end = useCallback(
    (success = true, error?: Error): void => {
      if (!enabled || startTimeRef.current === null) {
        return
      }

      // Stop frame tracking
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }

      const endedAt = Date.now()
      const durationMs = endedAt - startTimeRef.current
      const droppedFrames = frameCountRef.current

      // Check thresholds
      const exceedsThresholds =
        droppedFrames > maxDroppedFrames || durationMs > maxDurationMs

      // Check for performance regression
      const hasRegression = checkPerformanceRegression(
        effectName,
        durationMs,
        droppedFrames
      )

      // Add to history
      performanceHistory.push({
        effect: effectName,
        durationMs,
        droppedFrames,
        timestamp: Date.now(),
      })

      // Trim history
      if (performanceHistory.length > MAX_HISTORY_SIZE) {
        performanceHistory.shift()
      }

      // Log to telemetry system
      if (effectIdRef.current) {
        try {
          if (error) {
            logEffectError(effectIdRef.current, error, {
              droppedFrames,
              deviceHz: deviceHz as 60 | 120,
              reducedMotion: reducedMotion.value,
            })
          } else {
            logEffectEnd(effectIdRef.current, {
              droppedFrames,
              deviceHz: deviceHz as 60 | 120,
              reducedMotion: reducedMotion.value,
              success,
            })
          }
        } catch (err) {
          logger.warn('Failed to log effect end', { error: err, effectName })
        }
      }

      const event: EffectTelemetryEvent = {
        effect: effectName,
        startedAt: startTimeRef.current,
        endedAt,
        durationMs,
        droppedFrames,
        deviceHz,
        reducedMotion: reducedMotion.value,
        success,
      }

      // Log with appropriate level
      if (error || !success) {
        logger.error('Effect failed', error, {
          effect: event.effect,
          durationMs: event.durationMs,
          droppedFrames: event.droppedFrames,
          deviceHz: event.deviceHz,
        })
      } else if (exceedsThresholds || hasRegression) {
        logger.warn('Effect performance issue', {
          effect: event.effect,
          durationMs: event.durationMs,
          droppedFrames: event.droppedFrames,
          deviceHz: event.deviceHz,
          exceedsThresholds,
          hasRegression,
        })

        // Alert if enabled
        if (alertOnThreshold) {
          if (exceedsThresholds) {
            logger.warn('Effect exceeded thresholds', {
              effect: event.effect,
              droppedFrames,
              maxDroppedFrames,
              durationMs,
              maxDurationMs,
            })
          }

          if (hasRegression) {
            logger.warn('Performance regression detected', {
              effect: event.effect,
              durationMs,
              droppedFrames,
            })
          }
        }
      } else {
        logger.info('Effect completed', {
          effect: event.effect,
          durationMs: event.durationMs,
          droppedFrames: event.droppedFrames,
          deviceHz: event.deviceHz,
          reducedMotion: event.reducedMotion,
          success: event.success,
        })
      }

      // Reset
      startTimeRef.current = null
      frameCountRef.current = 0
      lastFrameTimeRef.current = null
      effectIdRef.current = null
    },
    [
      enabled,
      effectName,
      reducedMotion,
      deviceHz,
      alertOnThreshold,
      maxDroppedFrames,
      maxDurationMs,
    ]
  )

  const getDeviceHz = useCallback((): number => {
    return deviceHz
  }, [deviceHz])

  const getDroppedFrames = useCallback((): number => {
    return frameCountRef.current
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return (): void => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [])

  return {
    start,
    end,
    getDeviceHz,
    getDroppedFrames,
  }
}
