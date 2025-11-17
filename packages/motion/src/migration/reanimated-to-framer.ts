/**
 * Migration Utilities: Reanimated to Framer Motion
 * Convert React Native Reanimated configurations to Framer Motion equivalents
 */

import type { Transition, Spring, Tween } from 'framer-motion'
import {
  convertSpringToFramer,
  convertTimingToFramer,
  withDelayTransition,
  withRepeatTransition,
  type ReanimatedSpringConfig,
  type ReanimatedTimingConfig,
} from '../framer-api/animations'

/**
 * Convert a Reanimated withSpring call to Framer Motion transition
 */
export function convertWithSpring(
  target: number,
  config?: ReanimatedSpringConfig
): { target: number; transition: Spring } {
  return {
    target,
    transition: convertSpringToFramer(config),
  }
}

/**
 * Convert a Reanimated withTiming call to Framer Motion transition
 */
export function convertWithTiming(
  target: number,
  config?: ReanimatedTimingConfig
): { target: number; transition: Tween } {
  return {
    target,
    transition: convertTimingToFramer(config),
  }
}

/**
 * Convert a Reanimated withDelay call to Framer Motion transition
 */
export function convertWithDelay(
  delay: number,
  transition: Transition
): Transition {
  return withDelayTransition(delay, transition)
}

/**
 * Convert a Reanimated withRepeat call to Framer Motion transition
 */
export function convertWithRepeat(
  transition: Transition,
  repeat?: number,
  reverse?: boolean
): Transition {
  return withRepeatTransition(transition, repeat, reverse ? 'reverse' : 'loop')
}

/**
 * Convert a Reanimated withSequence call
 * Note: Framer Motion handles sequences differently - use variants for complex sequences
 */
export function convertWithSequence(
  transitions: Array<{ transition: Transition; delay?: number }>
): Transition {
  if (transitions.length === 0) {
    return { type: 'tween', duration: 0.3 }
  }

  // Return the first transition with its delay
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
 * Convert Reanimated SharedValue usage pattern to Framer Motion
 * This is a helper for migrating code that uses useSharedValue
 */
export interface SharedValueMigration {
  initial: number | string
  target: number | string
  transition: Transition
}

/**
 * Create a migration helper for a SharedValue pattern
 */
export function createSharedValueMigration(
  initial: number | string,
  target: number | string,
  transition?: Transition
): SharedValueMigration {
  return {
    initial,
    target,
    transition: transition ?? { type: 'tween', duration: 0.3 },
  }
}

