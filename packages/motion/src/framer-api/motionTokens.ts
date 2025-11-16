/**
 * Framer Motion Token Mappings
 * 
 * Maps canonical motion tokens to Framer Motion transition objects.
 * This is the web-specific implementation layer.
 */

import type { Transition } from 'framer-motion'
import {
  motionDurations,
  motionEasings,
  motionSprings,
  type MotionDurationKey,
  type MotionEasingKey,
  type MotionSpringKey,
} from '../motionTokens'

/**
 * Convert motion duration key to Framer Motion duration
 */
export function getFramerDuration(key: MotionDurationKey): number {
  return motionDurations[key]
}

/**
 * Convert motion easing key to Framer Motion easing array
 */
export function getFramerEasing(key: MotionEasingKey): readonly [number, number, number, number] {
  return motionEasings[key]
}

/**
 * Convert motion easing key to Framer Motion easing string
 */
export function getFramerEasingString(key: MotionEasingKey): string {
  const [x1, y1, x2, y2] = motionEasings[key]
  return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`
}

/**
 * Convert motion spring key to Framer Motion spring transition
 */
export function getFramerSpringTransition(key: MotionSpringKey): Transition {
  const spring = motionSprings[key]
  return {
    type: 'spring',
    stiffness: spring.stiffness,
    damping: spring.damping,
    mass: spring.mass,
  }
}

/**
 * Convert motion duration + easing to Framer Motion timing transition
 */
export function getFramerTimingTransition(
  durationKey: MotionDurationKey,
  easingKey: MotionEasingKey = 'standard'
): Transition {
  return {
    duration: motionDurations[durationKey] / 1000, // Convert ms to seconds
    ease: motionEasings[easingKey],
  }
}

/**
 * Get a complete Framer Motion transition from tokens
 */
export function getFramerTransition(
  type: 'spring' | 'tween',
  springKey?: MotionSpringKey,
  durationKey?: MotionDurationKey,
  easingKey?: MotionEasingKey
): Transition {
  if (type === 'spring' && springKey) {
    return getFramerSpringTransition(springKey)
  }
  
  if (type === 'tween' && durationKey) {
    return getFramerTimingTransition(durationKey, easingKey)
  }
  
  // Default fallback
  return {
    type: 'tween',
    duration: motionDurations.normal / 1000,
    ease: motionEasings.standard,
  }
}

