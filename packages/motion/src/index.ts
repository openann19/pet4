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
// On web, allow conditional Framer Motion import only in web-only paths
// This is enforced via ESLint rules
export type { ViewStyle, TextStyle, ImageStyle } from 'react-native'

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
