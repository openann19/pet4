/**
 * Mobile Animation Hooks Index
 * Exports all Reanimated animation hooks for mobile platform
 */

// Core components
export { AnimatedView, type AnimatedStyle } from './animated-view'

// Transitions
export { springConfigs, timingConfigs, validateSpringConfig, type SpringConfig, type TimingConfig } from './transitions'

// Navigation hooks
export { useNavButtonAnimation, type UseNavButtonAnimationOptions, type UseNavButtonAnimationReturn } from './use-nav-button-animation'
export { useHeaderButtonAnimation, type UseHeaderButtonAnimationOptions, type UseHeaderButtonAnimationReturn } from './use-header-button-animation'
export { useNavBarAnimation, type UseNavBarAnimationOptions, type UseNavBarAnimationReturn } from './use-nav-bar-animation'

// Hover/Press effects (adapted for mobile)
export { useHoverLift, type UseHoverLiftOptions, type UseHoverLiftReturn } from './use-hover-lift'
export { useMagneticPress, type UseMagneticPressOptions, type UseMagneticPressReturn } from './use-magnetic-press'
export { useHoverAnimation, type UseHoverAnimationOptions, type UseHoverAnimationReturn } from './use-hover-animation'
export { useHoverTap, type UseHoverTapOptions, type UseHoverTapReturn } from './use-hover-tap'

// Visual effects
export { useGlowPulse, type UseGlowPulseOptions, type UseGlowPulseReturn } from './use-glow-pulse'
export { useShimmer, type UseShimmerOptions, type UseShimmerReturn } from './use-shimmer'
export { useConfettiBurst, type UseConfettiBurstOptions, type UseConfettiBurstReturn, type ConfettiParticle } from './use-confetti-burst'
export { useElasticScale, type UseElasticScaleOptions, type UseElasticScaleReturn } from './use-elastic-scale'
export { useGlowBorder, type UseGlowBorderOptions, type UseGlowBorderReturn } from './use-glow-border'
export { useBreathingAnimation, type UseBreathingAnimationOptions, type UseBreathingAnimationReturn } from './use-breathing-animation'

// Transition hooks
export { useEntryAnimation, type UseEntryAnimationOptions, type UseEntryAnimationReturn } from './use-entry-animation'
export { useModalAnimation, type UseModalAnimationOptions, type UseModalAnimationReturn } from './use-modal-animation'
export { usePageTransition, type UsePageTransitionOptions, type UsePageTransitionReturn } from './use-page-transition'
export { useHeaderAnimation, type UseHeaderAnimationOptions, type UseHeaderAnimationReturn } from './use-header-animation'
export { useExpandCollapse, type UseExpandCollapseOptions, type UseExpandCollapseReturn } from './use-expand-collapse'
export { useRotation, type UseRotationOptions, type UseRotationReturn } from './use-rotation'

// Existing hooks
export { useBounceOnTap } from './use-bounce-on-tap'
export { useRippleEffect } from './use-ripple-effect'
export { useStaggeredContainer } from './use-staggered-container'
export { useStaggeredItem } from './use-staggered-item'
export { useStickerAnimation } from './use-sticker-animation'

// Re-export commonly used Reanimated primitives
export {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedReaction,
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
} from 'react-native-reanimated'
