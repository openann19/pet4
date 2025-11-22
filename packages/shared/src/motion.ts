/**
 * Global Motion Configuration
 *
 * Shared motion constants and configurations for consistent animations
 * across web and mobile platforms.
 *
 * Location: packages/shared/src/motion.ts
 */

export interface MotionConfig {
  base: {
    stiffness: number
    damping: number
    mass: number
  }
  durations: {
    tap: number
    toast: number
    modal: number
  }
}

/**
 * Base motion configuration
 * Used for spring animations and timing durations
 */
export const MOTION: MotionConfig = {
  base: {
    stiffness: 280,
    damping: 20,
    mass: 1,
  },
  durations: {
    tap: 150,
    toast: 220,
    modal: 260,
  },
} as const

/**
 * Get motion config with platform-specific adjustments
 */
export function getMotionConfig(_platform: 'web' | 'mobile'): MotionConfig {
  // Platform-specific adjustments can be added here
  return MOTION
}
