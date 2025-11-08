/**
 * Effect Telemetry Hook (Mobile)
 *
 * Tracks effect performance metrics: duration, dropped frames
 * Logs to structured logger (no PII)
 */

import { useRef, useCallback } from 'react'
import { createLogger } from '../../utils/logger'
import { useReducedMotionSV } from '../chat/core/reduced-motion'

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
  effectName: string
  enabled?: boolean
}

export interface UseEffectTelemetryReturn {
  start: () => void
  end: (success?: boolean) => void
  getDeviceHz: () => number
}

/**
 * Hook to track effect telemetry
 */
export function useEffectTelemetry(options: UseEffectTelemetryOptions): UseEffectTelemetryReturn {
  const { effectName, enabled = true } = options
  const reducedMotion = useReducedMotionSV()
  const startTimeRef = useRef<number | null>(null)
  const frameCountRef = useRef(0)
  const lastFrameTimeRef = useRef<number | null>(null)

  const start = useCallback(() => {
    if (!enabled) {
      return
    }

    startTimeRef.current = Date.now()
    frameCountRef.current = 0
    lastFrameTimeRef.current = null

    // Track frame timing (simplified for mobile)
    const trackFrame = (): void => {
      const timestamp = Date.now()
      if (lastFrameTimeRef.current !== null) {
        const frameDelta = timestamp - lastFrameTimeRef.current
        const expectedFrameTime = 1000 / 60 // Assume 60Hz

        // If frame took significantly longer, count as dropped
        if (frameDelta > expectedFrameTime * 1.5) {
          frameCountRef.current += Math.floor(frameDelta / expectedFrameTime - 1)
        }
      }

      lastFrameTimeRef.current = timestamp
      requestAnimationFrame(trackFrame)
    }

    requestAnimationFrame(trackFrame)
  }, [enabled])

  const end = useCallback(
    (success = true) => {
      if (!enabled || startTimeRef.current === null) {
        return
      }

      const endedAt = Date.now()
      const durationMs = endedAt - startTimeRef.current
      const droppedFrames = frameCountRef.current

      const event: EffectTelemetryEvent = {
        effect: effectName,
        startedAt: startTimeRef.current,
        endedAt,
        durationMs,
        droppedFrames,
        deviceHz: 60, // Default assumption
        reducedMotion: reducedMotion.value,
        success,
      }

      logger.info('Effect completed', {
        effect: event.effect,
        durationMs: event.durationMs,
        droppedFrames: event.droppedFrames,
        deviceHz: event.deviceHz,
        reducedMotion: event.reducedMotion,
        success: event.success,
      })

      // Reset
      startTimeRef.current = null
      frameCountRef.current = 0
      lastFrameTimeRef.current = null
    },
    [enabled, effectName, reducedMotion]
  )

  const getDeviceHz = useCallback(() => {
    // Default to 60Hz for mobile
    return 60
  }, [])

  return {
    start,
    end,
    getDeviceHz,
  }
}
