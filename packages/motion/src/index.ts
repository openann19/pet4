/**
 * Motion Facade - Reanimated Default
 *
 * Re-exports React Native Reanimated components and hooks as default.
 * Framer Motion is only allowed in apps/web web-only paths.
 */

// Re-export Reanimated core components and hooks
export {
  default as Animated,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedGestureHandler,
  useDerivedValue,
  useAnimatedRef,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  withDecay,
  cancelAnimation,
  runOnJS,
  runOnUI,
  Easing,
  interpolate,
  Extrapolation,
  type SharedValue,
  type AnimatedStyle,
  type AnimatedProps,
} from 'react-native-reanimated'

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
export { haptic } from './recipes/haptic'

// Re-export transitions
export { usePageTransitions, Presence } from './transitions/presence'
export { motion } from './tokens'

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

// Platform-specific exports
// On web, allow conditional Framer Motion import only in web-only paths
// This is enforced via ESLint rules
export type { ViewStyle, TextStyle, ImageStyle } from 'react-native'
