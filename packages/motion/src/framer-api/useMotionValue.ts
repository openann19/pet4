/**
 * Framer Motion API: useMotionValue
 * Equivalent to React Native Reanimated's useSharedValue
 * Provides a reactive value that can be animated with Framer Motion
 */

import { useMotionValue, type MotionValue } from 'framer-motion'

/**
 * Creates a motion value (equivalent to useSharedValue from Reanimated)
 * @param initial - Initial value
 * @returns MotionValue that can be used with Framer Motion animations
 */
export function useFramerMotionValue<T extends string | number>(
  initial: T
): MotionValue<T> {
  return useMotionValue(initial)
}

/**
 * Type alias for compatibility
 */
export type FramerMotionValue<T extends string | number = number> = MotionValue<T>

// Re-export for convenience
export { useMotionValue } from 'framer-motion'
export type { MotionValue } from 'framer-motion'

