/**
 * Performance Monitoring for Chat Effects
 *
 * Monitors frame budgets, dropped frames, and performance metrics.
 * Ensures all effects stay within frame budget (≤8.3ms at 120Hz, ≤16.6ms at 60Hz).
 *
 * Location: apps/mobile/src/effects/chat/core/performance.ts
 */

import { useEffect, useRef } from 'react'
import { useSharedValue, type SharedValue } from 'react-native-reanimated'
import { createLogger } from '../../../utils/logger'
import { isTruthy, isDefined } from '@petspark/shared';

const logger = createLogger('performance')

/**
 * Device refresh rate (Hz)
 */
export type DeviceHz = 60 | 120 | 240

/**
 * Frame budget in milliseconds based on refresh rate
 */
export function getFrameBudget(deviceHz: DeviceHz): number {
  // Frame budget = 1000ms / refresh rate
  // 60Hz: 16.67ms per frame
  // 120Hz: 8.33ms per frame
  // 240Hz: 4.17ms per frame
  return 1000 / deviceHz
}

/**
 * Detect device refresh rate (async)
 * Defaults to 60Hz if detection fails
 */
export async function detectDeviceHzAsync(): Promise<DeviceHz> {
  // Try to detect device refresh rate using available APIs
  try {
    // Check if react-native-device-info is available
    // Dynamic import to avoid bundling issues
    const deviceInfoModule = await import('react-native-device-info').catch(() => null)
    const DeviceInfo = deviceInfoModule?.default ?? deviceInfoModule

      if (DeviceInfo && typeof DeviceInfo.getDeviceId === 'function') {
      // iOS ProMotion devices (iPhone 13 Pro and later) support 120Hz
      // iPad Pro models may support up to 120Hz
      // Future devices may support 240Hz
      const deviceId = DeviceInfo.getDeviceId()
      const isProMotion =
        deviceId &&
        (deviceId.includes('iPhone14') || // iPhone 13 Pro series
          deviceId.includes('iPhone15') || // iPhone 14 Pro series
          deviceId.includes('iPhone16') || // iPhone 15 Pro series
          deviceId.includes('iPhone17') || // iPhone 16 Pro series (future)
          deviceId.includes('iPad')) // iPad Pro models
      if (isProMotion) {
        // Most ProMotion devices support 120Hz, some newer may support 240Hz
        // Default to 120Hz, can be enhanced with actual device detection
        return 120
      }
    }
  } catch {
    // Device info not available, fall through to default
  }

  // Default to 60Hz
  return 60
}

/**
 * Detect device refresh rate (synchronous, returns cached or default)
 * For reactive updates, use detectDeviceHzAsync() or a hook
 */
let cachedDeviceHz: DeviceHz | null = null

export function detectDeviceHz(): DeviceHz {
  if (cachedDeviceHz !== null) {
    return cachedDeviceHz
  }

  // Initialize asynchronously (non-blocking)
  detectDeviceHzAsync()
    .then(hz => {
      cachedDeviceHz = hz
    })
    .catch(() => {
      // Silent fail, will use default
    })

  // Return default while detecting
  return 60
}

/**
 * Frame drop counter for monitoring performance
 */
interface FrameDropCounter {
  droppedFrames: number
  totalFrames: number
  lastFrameTime: number
  windowStartTime: number
  droppedFramesInWindow: number[]
}

/**
 * Hook to monitor dropped frames
 * Tracks frame drops in a sliding window (300ms)
 */
export function useFrameDropCounter(
  deviceHz: DeviceHz = 60,
  enabled: boolean = true
): {
  droppedFrames: SharedValue<number>
  droppedFramesInWindow: SharedValue<number>
  reset: () => void
} {
  const frameBudget = getFrameBudget(deviceHz)
  const droppedFrames = useSharedValue<number>(0)
  const droppedFramesInWindow = useSharedValue<number>(0)

  const counterRef = useRef<FrameDropCounter>({
    droppedFrames: 0,
    totalFrames: 0,
    lastFrameTime: Date.now(),
    windowStartTime: Date.now(),
    droppedFramesInWindow: [],
  })

  useEffect(() => {
    if (!enabled) {
      return
    }

    let animationFrameId: number | null = null
    const windowSizeMs = 300 // 300ms sliding window

    const checkFrame = (): void => {
      const now = Date.now()
      const counter = counterRef.current
      const actualFrameTime = now - counter.lastFrameTime

      // Check if frame was dropped (actual time > expected + threshold)
      const threshold = frameBudget * 1.5 // Allow 50% margin
      if (actualFrameTime > threshold) {
        counter.droppedFrames++
        counter.droppedFramesInWindow.push(now)
      }

      counter.totalFrames++
      counter.lastFrameTime = now

      // Clean up old dropped frames outside the window
      const windowStart = now - windowSizeMs
      counter.droppedFramesInWindow = counter.droppedFramesInWindow.filter(
        time => time >= windowStart
      )

      // Update SharedValues
      droppedFrames.value = counter.droppedFrames
      droppedFramesInWindow.value = counter.droppedFramesInWindow.length

      // Warn if too many dropped frames in window (>2 in 300ms)
      if (counter.droppedFramesInWindow.length > 2) {
        logger.warn('High dropped frame count detected', {
          droppedFramesInWindow: counter.droppedFramesInWindow.length,
          windowSizeMs,
          deviceHz,
        })
      }

      animationFrameId = requestAnimationFrame(checkFrame)
    }

    // Start monitoring
    counterRef.current.lastFrameTime = Date.now()
    counterRef.current.windowStartTime = Date.now()
    animationFrameId = requestAnimationFrame(checkFrame)

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [deviceHz, enabled, droppedFrames, droppedFramesInWindow, frameBudget])

  const reset = (): void => {
    counterRef.current = {
      droppedFrames: 0,
      totalFrames: 0,
      lastFrameTime: Date.now(),
      windowStartTime: Date.now(),
      droppedFramesInWindow: [],
    }
    droppedFrames.value = 0
    droppedFramesInWindow.value = 0
  }

  return {
    droppedFrames,
    droppedFramesInWindow,
    reset,
  }
}

/**
 * Check if effect duration exceeds frame budget
 */
export function exceedsFrameBudget(durationMs: number, deviceHz: DeviceHz): boolean {
  const frameBudget = getFrameBudget(deviceHz)
  return durationMs > frameBudget
}

/**
 * Warn if effect exceeds frame budget
 */
export function warnIfExceedsBudget(
  effectName: string,
  durationMs: number,
  deviceHz: DeviceHz
): void {
  if (exceedsFrameBudget(durationMs, deviceHz)) {
    logger.warn('Effect exceeds frame budget', {
      effectName,
      durationMs,
      frameBudget: getFrameBudget(deviceHz),
      deviceHz,
    })
  }
}

/**
 * Get performance metrics summary
 */
export function getPerformanceMetrics(
  droppedFrames: number,
  totalFrames: number,
  durationMs: number,
  deviceHz: DeviceHz
): {
  droppedFrameRate: number
  averageFrameTime: number
  frameBudget: number
  withinBudget: boolean
} {
  const droppedFrameRate = totalFrames > 0 ? droppedFrames / totalFrames : 0
  const averageFrameTime = durationMs / totalFrames
  const frameBudget = getFrameBudget(deviceHz)
  const withinBudget = averageFrameTime <= frameBudget

  return {
    droppedFrameRate,
    averageFrameTime,
    frameBudget,
    withinBudget,
  }
}
