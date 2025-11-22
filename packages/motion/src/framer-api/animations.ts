/**
 * Framer Motion API: Animation Converters
 * Convert React Native Reanimated animation functions to Framer Motion transitions
 */

import type { Transition, Spring, Tween } from 'framer-motion'

/**
 * Spring configuration from Reanimated format to Framer Motion
 */
export interface ReanimatedSpringConfig {
  damping?: number
  stiffness?: number
  mass?: number
  velocity?: number
}

/**
 * Timing configuration from Reanimated format to Framer Motion
 */
export interface ReanimatedTimingConfig {
  duration?: number
  easing?: (t: number) => number
}

/**
 * Convert Reanimated spring config to Framer Motion spring transition
 */
export function convertSpringToFramer(
  config?: ReanimatedSpringConfig
): Spring {
  if (!config) {
    return {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 1,
    }
  }

  return {
    type: 'spring',
    stiffness: config.stiffness ?? 300,
    damping: config.damping ?? 30,
    mass: config.mass ?? 1,
    velocity: config.velocity ?? 0,
  }
}

/**
 * Convert Reanimated timing config to Framer Motion tween transition
 */
export function convertTimingToFramer(
  config?: ReanimatedTimingConfig
): Tween {
  if (!config) {
    return {
      type: 'tween',
      duration: 0.3,
      ease: [0.2, 0.8, 0.2, 1],
    }
  }

  // Convert easing function to cubic-bezier if possible
  // For complex easings, use a default curve
  let ease: Tween['ease'] = [0.2, 0.8, 0.2, 1]

  if (config.easing) {
    // Try to approximate common easing functions
    // This is a simplified conversion - for exact matches, use custom easing
    ease = [0.2, 0.8, 0.2, 1]
  }

  return {
    type: 'tween',
    duration: (config.duration ?? 300) / 1000, // Convert ms to seconds
    ease,
  }
}

/**
 * Create a Framer Motion transition from Reanimated withSpring config
 */
export function withSpringTransition(
  config?: ReanimatedSpringConfig
): Transition {
  return convertSpringToFramer(config)
}

/**
 * Create a Framer Motion transition from Reanimated withTiming config
 */
export function withTimingTransition(
  config?: ReanimatedTimingConfig
): Transition {
  return convertTimingToFramer(config)
}

/**
 * Create a delayed transition
 */
export function withDelayTransition(
  delay: number,
  transition: Transition
): Transition {
  return {
    ...transition,
    delay: delay / 1000, // Convert ms to seconds
  }
}

/**
 * Create a repeating transition
 */
export function withRepeatTransition(
  transition: Transition,
  repeat?: number,
  repeatType?: 'loop' | 'reverse' | 'mirror'
): Transition {
  return {
    ...transition,
    repeat: repeat ?? Infinity,
    repeatType: repeatType ?? 'loop',
  }
}

/**
 * Create a sequence of transitions
 * Note: Framer Motion doesn't have direct sequence support, so we use delay
 */
export function withSequenceTransition(
  transitions: Array<{ transition: Transition; delay?: number }>
): Transition {
  // For sequences, we'll return the first transition
  // Complex sequences should be handled with variants
  if (transitions.length === 0) {
    return { type: 'tween', duration: 0.3 }
  }

  const first = transitions[0]
  if (!first) {
    return { type: 'tween', duration: 0.3 }
  }
  return {
    ...first.transition,
    delay: (first.delay ?? 0) / 1000,
  }
}

/**
 * Convert Reanimated animation config to Framer Motion transition
 * Handles both spring and timing configs
 */
export function toFramerTransition(
  config?: ReanimatedSpringConfig | ReanimatedTimingConfig
): Transition {
  if ('damping' in (config ?? {}) || 'stiffness' in (config ?? {})) {
    return convertSpringToFramer(config as ReanimatedSpringConfig)
  }
  
  return convertTimingToFramer(config as ReanimatedTimingConfig)
}

