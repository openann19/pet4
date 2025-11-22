/**
 * Motion Tokens - Canonical Motion System
 * 
 * Shared motion tokens providing consistent animation values across web and mobile.
 * These tokens are platform-agnostic and get mapped to platform-specific implementations
 * (Framer Motion for web, Reanimated for mobile).
 * 
 * @packageDocumentation
 */

/**
 * Motion duration keys
 */
export type MotionDurationKey = 'instant' | 'fast' | 'normal' | 'slow'

/**
 * Motion easing keys
 */
export type MotionEasingKey = 'standard' | 'decel' | 'accel' | 'springy'

/**
 * Motion spring keys
 */
export type MotionSpringKey = 'press' | 'bubble' | 'sheet' | 'modal'

/**
 * Spring configuration type for motion tokens
 * Uses the same structure as SpringConfig from types.ts but with required fields
 */
export interface MotionSpringConfig {
  stiffness: number
  damping: number
  mass: number
}

/**
 * Motion durations in milliseconds
 * 
 * - instant: 75ms - Immediate feedback, reduced motion fallback
 * - fast: 150ms - Quick interactions, micro-animations
 * - normal: 260ms - Standard transitions, default timing
 * - slow: 400ms - Deliberate animations, emphasis
 */
export const motionDurations: Record<MotionDurationKey, number> = {
  instant: 75,
  fast: 150,
  normal: 260,
  slow: 400,
} as const

/**
 * Motion easing curves as cubic-bezier tuples [x1, y1, x2, y2]
 * 
 * - standard: [0.2, 0, 0.2, 1] - Balanced, natural motion
 * - decel: [0, 0, 0.2, 1] - Deceleration, easing out
 * - accel: [0.4, 0, 1, 1] - Acceleration, quick start
 * - springy: [0.34, 1.56, 0.64, 1] - Spring-like feel
 */
export const motionEasings: Record<MotionEasingKey, readonly [number, number, number, number]> = {
  standard: [0.2, 0, 0.2, 1] as const,
  decel: [0, 0, 0.2, 1] as const,
  accel: [0.4, 0, 1, 1] as const,
  springy: [0.34, 1.56, 0.64, 1] as const,
} as const

/**
 * Motion spring configurations
 * 
 * - press: Quick, responsive press feedback (buttons, FABs)
 * - bubble: Chat bubble entry animations, list items
 * - sheet: Bottom sheets, side panels
 * - modal: Dialogs, overlays, modals
 */
export const motionSprings: Record<MotionSpringKey, MotionSpringConfig> = {
  press: {
    stiffness: 400,
    damping: 25,
    mass: 0.8,
  },
  bubble: {
    stiffness: 300,
    damping: 20,
    mass: 1,
  },
  sheet: {
    stiffness: 280,
    damping: 30,
    mass: 1,
  },
  modal: {
    stiffness: 250,
    damping: 28,
    mass: 1.2,
  },
} as const

