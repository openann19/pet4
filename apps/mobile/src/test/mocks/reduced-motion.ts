/**
 * Mock for reduced-motion.ts used in tests
 * This prevents esbuild from trying to transform the real file which uses
 * dynamic imports and typeof checks incompatible with test environment
 */

import { vi } from 'vitest'
import type { SharedValue } from 'react-native-reanimated'

// Create a mock SharedValue
const createMockSharedValue = <T>(initial: T): SharedValue<T> => {
  let value = initial
  return {
    get value(): T {
      return value
    },
    set value(v: T) {
      value = v
    },
  } as SharedValue<T>
}

export const useReducedMotionSV = vi.fn(() => createMockSharedValue<boolean>(false))

export const getReducedMotionDuration = vi.fn((duration: number, reduced: boolean = false) => {
  return reduced ? Math.min(120, duration) : duration
})

export const useReducedMotion = vi.fn(() => false)

export const isReduceMotionEnabled = vi.fn(() => false)

export const getReducedMotionMultiplier = vi.fn((reduced: boolean = false) => {
  return reduced ? 0 : 1
})

