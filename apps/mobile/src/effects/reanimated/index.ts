/**
 * Mobile Animation Hooks Index
 * Exports all Reanimated animation hooks for mobile platform
 */

// Core components
export { AnimatedView, type AnimatedStyle } from './animated-view'

// Transitions
export {
  springConfigs,
  timingConfigs,
  validateSpringConfig,
  type SpringConfig,
} from './transitions'

// Navigation & Layout hooks
export {
  useNavBarAnimation,
  type UseNavBarAnimationOptions,
  type UseNavBarAnimationReturn,
} from './use-nav-bar-animation'
export {
  useNavButtonAnimation,
  type UseNavButtonAnimationOptions,
  type UseNavButtonAnimationReturn,
} from './use-nav-button-animation'
export {
  useHeaderAnimation,
  type UseHeaderAnimationOptions,
  type UseHeaderAnimationReturn,
} from './use-header-animation'
export {
  useHeaderButtonAnimation,
  type UseHeaderButtonAnimationOptions,
  type UseHeaderButtonAnimationReturn,
} from './use-header-button-animation'
export {
  useSidebarAnimation,
  type UseSidebarAnimationOptions,
  type UseSidebarAnimationReturn,
} from './use-sidebar-animation'
export {
  useModalAnimation,
  type UseModalAnimationOptions,
  type UseModalAnimationReturn,
} from './use-modal-animation'
export {
  usePageTransition,
  type UsePageTransitionOptions,
  type UsePageTransitionReturn,
} from './use-page-transition'
export {
  usePageTransitionWrapper,
  type UsePageTransitionWrapperOptions,
  type UsePageTransitionWrapperReturn,
} from './use-page-transition-wrapper'
export {
  useLogoAnimation,
  useLogoGlow,
  type UseLogoAnimationReturn,
  type UseLogoGlowReturn,
} from './use-logo-animation'

// Visual effects
export { useShimmer, type UseShimmerOptions, type UseShimmerReturn } from './use-shimmer'
export {
  useShimmerSweep,
  type UseShimmerSweepOptions,
  type UseShimmerSweepReturn,
} from './use-shimmer-sweep'
export {
  useTypingShimmer,
  type UseTypingShimmerOptions,
  type UseTypingShimmerReturn,
} from './use-typing-shimmer'
export { useGlowPulse, type UseGlowPulseOptions, type UseGlowPulseReturn } from './use-glow-pulse'
export {
  useGlowBorder,
  type UseGlowBorderOptions,
  type UseGlowBorderReturn,
} from './use-glow-border'
export {
  useGradientAnimation,
  type UseGradientAnimationOptions,
  type UseGradientAnimationReturn,
} from './use-gradient-animation'
export {
  useFloatingParticle,
  type UseFloatingParticleOptions,
  type UseFloatingParticleReturn,
} from './use-floating-particle'
export {
  useConfettiBurst,
  type UseConfettiBurstOptions,
  type UseConfettiBurstReturn,
  type ConfettiParticle,
} from './use-confetti-burst'

// Interaction hooks
export { useHoverLift, type UseHoverLiftOptions, type UseHoverLiftReturn } from './use-hover-lift'
export {
  useHoverAnimation,
  type UseHoverAnimationOptions,
  type UseHoverAnimationReturn,
} from './use-hover-animation'
export { useHoverTap, type UseHoverTapOptions, type UseHoverTapReturn } from './use-hover-tap'
export {
  useMagneticEffect,
  type UseMagneticEffectOptions,
  type UseMagneticEffectReturn,
} from './use-magnetic-effect'
export {
  useMagneticPress,
  type UseMagneticPressOptions,
  type UseMagneticPressReturn,
} from './use-magnetic-press'
export {
  useParallaxTilt,
  type UseParallaxTiltOptions,
  type UseParallaxTiltReturn,
} from './use-parallax-tilt'
export { useBounceOnTap } from './use-bounce-on-tap'
export {
  useElasticScale,
  type UseElasticScaleOptions,
  type UseElasticScaleReturn,
} from './use-elastic-scale'
export {
  useBreathingAnimation,
  type UseBreathingAnimationOptions,
  type UseBreathingAnimationReturn,
} from './use-breathing-animation'

// Animation hooks
export { useRotation, type UseRotationOptions, type UseRotationReturn } from './use-rotation'
export {
  useIconRotation,
  type UseIconRotationOptions,
  type UseIconRotationReturn,
} from './use-icon-rotation'
export {
  useExpandCollapse,
  type UseExpandCollapseOptions,
  type UseExpandCollapseReturn,
} from './use-expand-collapse'
export {
  useEntryAnimation,
  type UseEntryAnimationOptions,
  type UseEntryAnimationReturn,
} from './use-entry-animation'

// Staggered animations
export { useStaggeredContainer } from './use-staggered-container'
export { useStickerAnimation } from './use-sticker-animation'
export { useStaggeredItem } from './use-staggered-item'

// Ripple effect
export { useRippleEffect } from './use-ripple-effect'

// Bubble & Chat effects
export {
  useBubbleEntry,
  type UseBubbleEntryOptions,
  type UseBubbleEntryReturn,
  type BubbleDirection,
} from './use-bubble-entry'
export {
  useBubbleGesture,
  type UseBubbleGestureOptions,
  type UseBubbleGestureReturn,
} from './use-bubble-gesture'
export {
  useBubbleTilt,
  type UseBubbleTiltOptions,
  type UseBubbleTiltReturn,
} from './use-bubble-tilt'
export {
  useBubbleTheme,
  type UseBubbleThemeOptions,
  type UseBubbleThemeReturn,
  type SenderType,
  type MessageType,
  type ChatTheme,
} from './use-bubble-theme'
export {
  useTimestampReveal,
  type UseTimestampRevealOptions,
  type UseTimestampRevealReturn,
} from './use-timestamp-reveal'
export {
  useReceiptTransition,
  type UseReceiptTransitionOptions,
  type UseReceiptTransitionReturn,
} from './use-receipt-transition'
export {
  useMediaBubble,
  type UseMediaBubbleOptions,
  type UseMediaBubbleReturn,
  type MediaType,
} from './use-media-bubble'
export {
  useThreadHighlight,
  type UseThreadHighlightOptions,
  type UseThreadHighlightReturn,
} from './use-thread-highlight'

// Ultra Enhanced Animations
export { useUltraCardReveal } from './use-ultra-card-reveal'
export { useMorphShape } from './use-morph-shape'
export { use3DFlipCard } from './use-3d-flip-card'
export { useSpringCarousel } from './use-spring-carousel'
export { useWaveAnimation, useMultiWave } from './use-wave-animation'

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
