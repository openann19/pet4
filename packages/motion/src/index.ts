/**
 * Motion Facade - Platform-Aware Exports
 *
 * On web: Exports Framer Motion APIs
 * On native: Exports React Native Reanimated APIs
 */

// Platform detection
const isWeb = typeof window !== 'undefined' && typeof (window as { document?: unknown }).document !== 'undefined'

// Framer Motion API exports (web)
export * from './framer-api'

// Migration utilities (web)
export * from './migration'

// Export Framer Motion-based compatibility APIs
// These provide Reanimated-like APIs using Framer Motion under the hood
export {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  withDecay,
  animateWithSpring,
  animateWithTiming,
  animateWithDelay,
  animateWithRepeat,
  useAnimateValue,
  type SharedValue,
} from './framer-api/hooks'

// Type exports for compatibility
export type { MotionValue, AnimationPlaybackControls, MotionStyle } from 'framer-motion'
// Import needed for the custom animate function
import { animate as framerAnimate } from 'framer-motion'
import type { MotionValue, AnimationPlaybackControls, MotionStyle } from 'framer-motion'


// Custom animate function for compatibility with both signatures
export function animate<T extends number | string>(
  motionValue: MotionValue<T>,
  target: T,
  _transition?: unknown
): AnimationPlaybackControls {
  // If transition is provided, ignore it for now (Framer Motion doesn't support 3-param in this way)
  // Use the two-parameter form which is what Framer Motion actually supports
  return framerAnimate(motionValue, target)
}

// Stub exports for Reanimated APIs not yet implemented
// These can be implemented as needed
export const useAnimatedProps = () => ({})
export const useAnimatedReaction = () => {}
export const useAnimatedGestureHandler = () => ({})
export const useAnimatedRef = <T,>() => ({ current: null as T | null })
export const cancelAnimation = () => {}
export const runOnJS = <T extends (...args: unknown[]) => unknown>(fn: T): T => fn
export const runOnUI = <T extends (...args: unknown[]) => unknown>(fn: T): T => fn

// Transition/animation presets
export const FadeIn = {
  duration: (ms: number) => ({
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    duration: ms,
  }),
}

export const FadeOut = {
  duration: (ms: number) => ({
    keyframes: [{ opacity: 1 }, { opacity: 0 }],
    duration: ms,
  }),
}

export const FadeInUp = {
  duration: (ms: number) => ({
    keyframes: [{ opacity: 0, y: 20 }, { opacity: 1, y: 0 }],
    duration: ms,
    delay: (delayMs: number) => ({
      keyframes: [{ opacity: 0, y: 20 }, { opacity: 1, y: 0 }],
      duration: ms,
      delay: delayMs,
      springify: () => ({
        keyframes: [{ opacity: 0, y: 20 }, { opacity: 1, y: 0 }],
        type: 'spring',
        damping: (d: number) => ({ damping: d, stiffness: (s: number) => ({ stiffness: s }) }),
      }),
    }),
    springify: () => ({
      keyframes: [{ opacity: 0, y: 20 }, { opacity: 1, y: 0 }],
      type: 'spring',
      damping: (d: number) => ({ damping: d, stiffness: (s: number) => ({ stiffness: s }) }),
    }),
  }),
  delay: (delayMs: number) => ({
    keyframes: [{ opacity: 0, y: 20 }, { opacity: 1, y: 0 }],
    delay: delayMs,
    duration: (ms: number) => ({
      keyframes: [{ opacity: 0, y: 20 }, { opacity: 1, y: 0 }],
      duration: ms,
      delay: delayMs,
    }),
  }),
}

export const Layout = {
  springify: () => ({ type: 'spring' }),
}

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t * (2 - t),
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  poly: (n: number) => (t: number) => Math.pow(t, n),
  sin: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  circle: (t: number) => 1 - Math.sqrt(1 - t * t),
  exp: (t: number) => Math.pow(2, 10 * (t - 1)),
  elastic: (bounciness: number) => (t: number) => {
    const p = bounciness * Math.PI
    return 1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * p)
  },
  back: (s: number) => (t: number) => {
    const c = s + 1
    return c * t * t * t - s * t * t
  },
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
    }
  },
  in: (easing: (t: number) => number) => easing,
  out: (easing: (t: number) => number) => (t: number) => 1 - easing(1 - t),
  inOut: (easing: (t: number) => number) => (t: number) =>
    t < 0.5 ? easing(2 * t) / 2 : 1 - easing(2 * (1 - t)) / 2,
}

export const interpolate = (
  value: number,
  inputRange: number[],
  outputRange: number[],
  options?: { extrapolateLeft?: string; extrapolateRight?: string } | string
): number => {
  // Handle both object and string forms of extrapolation
  let extrapolateLeft: string, extrapolateRight: string
  if (typeof options === 'string') {
    // Reanimated-style: interpolate(value, input, output, 'clamp')
    extrapolateLeft = extrapolateRight = options
  } else {
    // Framer Motion style: interpolate(value, input, output, { extrapolateLeft: 'clamp' })
    const opts = options ?? {}
    extrapolateLeft = opts.extrapolateLeft ?? 'extend'
    extrapolateRight = opts.extrapolateRight ?? 'extend'
  }
  
  if (inputRange.length === 0 || outputRange.length === 0) {
    return 0
  }
  
  if (inputRange.length !== outputRange.length) {
    return 0
  }
  
  const firstInput = inputRange[0]
  const lastInput = inputRange[inputRange.length - 1]
  
  if (firstInput === undefined || lastInput === undefined) {
    return 0
  }
  
  if (value <= firstInput) {
    if (extrapolateLeft === 'clamp') {
      const firstOutput = outputRange[0]
      return firstOutput ?? 0
    }
    const firstOutput = outputRange[0]
    return firstOutput ?? 0
  }
  
  if (value >= lastInput) {
    if (extrapolateRight === 'clamp') {
      const lastOutput = outputRange[outputRange.length - 1]
      return lastOutput ?? 0
    }
    const lastOutput = outputRange[outputRange.length - 1]
    return lastOutput ?? 0
  }
  
  const inputIndex = inputRange.findIndex((v, i) => {
    if (i === 0) return false
    const prev = inputRange[i - 1]
    return prev !== undefined && value >= prev && value <= v
  })
  
  if (inputIndex === -1 || inputIndex === 0) {
    const firstOutput = outputRange[0]
    return firstOutput ?? 0
  }
  
  const inputMin = inputRange[inputIndex - 1]
  const inputMax = inputRange[inputIndex]
  const outputMin = outputRange[inputIndex - 1]
  const outputMax = outputRange[inputIndex]
  
  if (inputMin === undefined || inputMax === undefined || outputMin === undefined || outputMax === undefined) {
    const firstOutput = outputRange[0]
    return firstOutput ?? 0
  }
  
  if (inputMax === inputMin) {
    return outputMin
  }
  
  const ratio = (value - inputMin) / (inputMax - inputMin)
  return outputMin + (outputMax - outputMin) * ratio
}

export const Extrapolation = {
  IDENTITY: 'identity',
  CLAMP: 'clamp',
  EXTEND: 'extend',
} as const

// Define AnimatedStyle as MotionStyle for compatibility
export type AnimatedStyle = MotionStyle
export type AnimatedProps = Record<string, unknown>

// Animated export for backward compatibility
export const Animated = {
  View: MotionView,
  Text: MotionText,
  ScrollView: MotionScrollView,
  Image: motion.img,
} as const

// Direct Framer Motion exports for web
export { motion }

// Define custom animation types (avoid conflicts with Framer Motion)
export type PetSparkEasingFunction = (value: number) => number

export type PetSparkTransition =
  | {
      type: 'spring';
      stiffness: number;
      damping: number;
      mass?: number;
    }
  | {
      duration: number;
      ease?: number[] | string;
    };

// Import and re-export motion primitives
import { MotionView } from './primitives/MotionView'
import { MotionText } from './primitives/MotionText'
import { MotionScrollView } from './primitives/MotionScrollView'

export { MotionView, MotionText, MotionScrollView }

import { motion } from 'framer-motion'

// Re-export custom hooks/recipes
export { usePressBounce } from './recipes/usePressBounce'
// Note: useHoverLift, useParallax, useBubbleEntry are mobile-only (.native.ts)
export { useMagnetic } from './recipes/useMagnetic'
// Note: useFloatingParticle, useThreadHighlight are mobile-only (.native.ts)
export { useShimmer } from './recipes/useShimmer'
export { useRipple } from './recipes/useRipple'
export { useBubbleTheme } from './recipes/useBubbleTheme'
export type { UseBubbleThemeOptions, UseBubbleThemeReturn, SenderType, MessageType, ChatTheme, THEME_COLORS, SENDER_INTENSITY, MESSAGE_INTENSITY } from './recipes/useBubbleTheme'
export { useBubbleTilt } from './recipes/useBubbleTilt'
export type { UseBubbleTiltOptions, UseBubbleTiltReturn } from './recipes/useBubbleTilt'
export { useMediaBubble } from './recipes/useMediaBubble'
export type { UseMediaBubbleOptions, UseMediaBubbleReturn, MediaType } from './recipes/useMediaBubble'
export { useReactionSparkles } from './recipes/useReactionSparkles'
export type { UseReactionSparklesOptions, UseReactionSparklesReturn, ReactionType, EMOJI_COLORS } from './recipes/useReactionSparkles'
export { haptic } from './haptic'
export { useWaveAnimation, useMultiWave } from './recipes/useWaveAnimation'

// Re-export transitions
export { usePageTransitions, Presence } from './transitions/presence'
export { motion as motionTokens } from './tokens'

// Canonical motion tokens (new system)
export {
  motionDurations,
  motionEasings,
  motionSprings,
  type MotionDurationKey,
  type MotionEasingKey,
  type MotionSpringKey,
} from './motionTokens'
// Note: SpringConfig is exported from './types' below to avoid duplicate

// Canonical motion hooks
export {
  usePressMotion,
  useBubbleEntryMotion,
  useListItemPresenceMotion,
  useOverlayTransition,
  type UsePressMotionOptions,
  type UsePressMotionReturn,
  type BubbleMotionOptions,
  type UseBubbleEntryMotionReturn,
  type UseListItemPresenceMotionOptions,
  type UseListItemPresenceMotionReturn,
  type UseOverlayTransitionOptions,
  type UseOverlayTransitionReturn,
} from './hooks'

// Reduced motion utilities
export { usePerfBudget } from './usePerfBudget'
export type { PerfBudget } from './usePerfBudget'

export {
  useReducedMotion,
  useReducedMotionSV,
  isReduceMotionEnabled,
  getReducedMotionDuration,
  getReducedMotionMultiplier,
} from './reduced-motion'

// Shared transitions and configurations
export {
  springConfigs,
  timingConfigs,
  transitionPresets,
  createSpringTransition,
  createTimingTransition,
  createDelayedTransition,
  validateSpringConfig,
  SPRING_RANGES,
} from './shared-transitions'
export type {
  SpringConfigRange,
} from './shared-transitions'

// Platform-specific exports
// On web, Framer Motion is the primary animation library
// On native, React Native Reanimated is used
export type { ViewStyle, TextStyle, ImageStyle } from 'react-native'

// Framer Motion direct exports (web only - use with platform checks)
// Note: These are conditionally available based on platform
// Use type guards or platform checks when using these
export type { Variants, HTMLMotionProps, Transition } from 'framer-motion'
// Export Transition from framer-motion with alias to avoid conflict
export type { Transition as FramerTransition } from 'framer-motion'
// Re-export useTransform from framer-motion for direct use
// Note: useMotionValue is already exported via ./framer-api
export { useTransform } from 'framer-motion'
// For runtime exports, import directly from 'framer-motion' when needed
// This avoids TypeScript issues with conditional exports

// Shared animation types
export type {
  SpringConfig,
  TimingConfig,
  WithSpringConfig,
  WithTimingConfig,
  AnimationState,
  TransformValues,
  BaseAnimationOptions,
  SpringAnimationOptions,
  TimingAnimationOptions,
  GestureAnimationOptions,
  BaseAnimationReturn,
  GestureAnimationReturn,
  TransformAnimationReturn,
  MagneticEffectOptions,
  MagneticEffectReturn,
  ParallaxTiltOptions,
  ParallaxTiltReturn,
  ParticleOptions,
  ParticleSystemReturn,
  MorphShapeOptions,
  MorphShapeReturn,
  CarouselOptions,
  CarouselReturn,
  WaveAnimationOptions,
  WaveAnimationReturn,
  StaggerContainerOptions,
  StaggerContainerReturn,
  TransitionPreset,
  AnimationConfig,
  AnimationType,
  EasingFunction as PetSparkEasingFunctionFromTypes,
  MouseEvent,
  TouchEvent,
  GestureEvent,
  HapticOptions,
} from './types'
