'use client'

import type {
  PanGestureConfig,
  TapGestureConfig,
  LongPressGestureConfig
} from '@/types/gesture-types'

export function calculateVelocity(
  translationX: number,
  translationY: number,
  timeDelta: number
): { velocityX: number; velocityY: number } {
  if (timeDelta === 0) {
    return { velocityX: 0, velocityY: 0 }
  }

  return {
    velocityX: translationX / timeDelta,
    velocityY: translationY / timeDelta
  }
}

export function calculateMagnitude(x: number, y: number): number {
  return Math.sqrt(x * x + y * y)
}

export function checkThreshold(
  value: number,
  threshold: number,
  direction: 'positive' | 'negative' | 'both' = 'both'
): boolean {
  if (direction === 'positive') {
    return value >= threshold
  }
  if (direction === 'negative') {
    return value <= -threshold
  }
  return Math.abs(value) >= threshold
}

export function checkVelocityThreshold(
  velocityX: number,
  velocityY: number,
  threshold: number
): boolean {
  const magnitude = calculateMagnitude(velocityX, velocityY)
  return magnitude >= threshold
}

export function getPlatformGestureConfig(): {
  pan: Partial<PanGestureConfig>
  tap: Partial<TapGestureConfig>
  longPress: Partial<LongPressGestureConfig>
} {
  const isWeb = typeof window !== 'undefined' && window.navigator

  return {
    pan: {
      enabled: true,
      ...(isWeb ? {} : { activeOffsetX: [-10, 10], activeOffsetY: [-10, 10] }),
      minPointers: 1,
      maxPointers: 1
    },
    tap: {
      enabled: true,
      numberOfTaps: 1,
      maxDurationMs: 500,
      maxDelayMs: 300
    },
    longPress: {
      enabled: true,
      minDurationMs: 500,
      maxDistance: 10
    }
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function interpolateGesture(
  value: number,
  inputRange: [number, number],
  outputRange: [number, number],
  extrapolate: 'clamp' | 'extend' = 'clamp'
): number {
  const [inputMin, inputMax] = inputRange
  const [outputMin, outputMax] = outputRange

  if (inputMin === inputMax) {
    return outputMin
  }

  const ratio = (value - inputMin) / (inputMax - inputMin)
  let result = outputMin + ratio * (outputMax - outputMin)

  if (extrapolate === 'clamp') {
    result = clamp(result, Math.min(outputMin, outputMax), Math.max(outputMin, outputMax))
  }

  return result
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
