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
export type { MotionValue } from 'framer-motion'
// Re-export animate from framer-motion for direct use
export { animate } from 'framer-motion'
import type { CSSProperties } from 'react'

// Stub exports for Reanimated APIs not yet implemented
// These can be implemented as needed
export const useAnimatedProps = () => ({})
export const useAnimatedReaction = () => {}
export const useAnimatedGestureHandler = () => ({})
export const useAnimatedRef = <T,>() => ({ current: null as T | null })
export const cancelAnimation = () => {}
export const runOnJS = <T extends (...args: unknown[]) => unknown>(fn: T): T => fn
export const runOnUI = <T extends (...args: unknown[]) => unknown>(fn: T): T => fn
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
  options?: { extrapolateLeft?: string; extrapolateRight?: string }
): number => {
  const { extrapolateLeft = 'extend', extrapolateRight = 'extend' } = options ?? {}
  
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

export type AnimatedStyle = import('react').CSSProperties
export type AnimatedProps = Record<string, unknown>

// Default Animated export (stub for compatibility)
export const Animated = {
  View: () => null,
  Text: () => null,
  Image: () => null,
  ScrollView: () => null,
}

// Re-export custom primitives
export { MotionView } from './primitives/MotionView'
export { MotionText } from './primitives/MotionText'
export { MotionScrollView } from './primitives/MotionScrollView'

// Re-export custom hooks/recipes
export { usePressBounce } from './recipes/usePressBounce'
export { useHoverLift } from './recipes/useHoverLift'
export { useMagnetic } from './recipes/useMagnetic'
export { useParallax } from './recipes/useParallax'
export { useShimmer } from './recipes/useShimmer'
export { useRipple } from './recipes/useRipple'
export { useFloatingParticle } from './recipes/useFloatingParticle'
export type { UseFloatingParticleOptions, UseFloatingParticleReturn } from './recipes/useFloatingParticle'
export { useThreadHighlight } from './recipes/useThreadHighlight'
export type { UseThreadHighlightOptions, UseThreadHighlightReturn } from './recipes/useThreadHighlight'
export { useBubbleEntry } from './recipes/useBubbleEntry'
export type { UseBubbleEntryOptions, UseBubbleEntryReturn } from './recipes/useBubbleEntry'
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
export type { Variants, Transition, HTMLMotionProps } from 'framer-motion'
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
  EasingFunction,
  MouseEvent,
  TouchEvent,
  GestureEvent,
  HapticOptions,
} from './types'
