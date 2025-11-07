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
export { useMagneticEffect, type UseMagneticEffectOptions, type UseMagneticEffectReturn } from './use-magnetic-effect'
export { useHoverAnimation, type UseHoverAnimationOptions, type UseHoverAnimationReturn } from './use-hover-animation'
export { useHoverTap, type UseHoverTapOptions, type UseHoverTapReturn } from './use-hover-tap'

// Visual effects
export { useGlowPulse, type UseGlowPulseOptions, type UseGlowPulseReturn } from './use-glow-pulse'
export { useShimmer, type UseShimmerOptions, type UseShimmerReturn } from './use-shimmer'
export { useGradientAnimation, type UseGradientAnimationOptions, type UseGradientAnimationReturn } from './use-gradient-animation'
export { useShimmerSweep, type UseShimmerSweepOptions, type UseShimmerSweepReturn } from './use-shimmer-sweep'
export { useConfettiBurst, type UseConfettiBurstOptions, type UseConfettiBurstReturn, type ConfettiParticle } from './use-confetti-burst'
export { useElasticScale, type UseElasticScaleOptions, type UseElasticScaleReturn } from './use-elastic-scale'
export { useFloatingParticle, type UseFloatingParticleOptions, type UseFloatingParticleReturn } from './use-floating-particle'
export { useThreadHighlight, type UseThreadHighlightOptions, type UseThreadHighlightReturn } from './use-thread-highlight'
export { useGlowBorder, type UseGlowBorderOptions, type UseGlowBorderReturn } from './use-glow-border'
export { useBreathingAnimation, type UseBreathingAnimationOptions, type UseBreathingAnimationReturn } from './use-breathing-animation'
export { useReceiptTransition, type UseReceiptTransitionOptions, type UseReceiptTransitionReturn } from './use-receipt-transition'
export { useTypingShimmer, type UseTypingShimmerOptions, type UseTypingShimmerReturn } from './use-typing-shimmer'
export { useTimestampReveal, type UseTimestampRevealOptions, type UseTimestampRevealReturn } from './use-timestamp-reveal'
export { useBubbleTheme, type UseBubbleThemeReturn } from './use-bubble-theme'
export type { SenderType, MessageType, ChatTheme } from './use-bubble-theme'
export { useBubbleTilt, type UseBubbleTiltReturn } from './use-bubble-tilt'
export type { UseBubbleTiltOptions } from './use-bubble-tilt'
export { useMediaBubble, type UseMediaBubbleReturn } from './use-media-bubble'
export type { MediaType } from './use-media-bubble'
export { useReactionSparkles, type UseReactionSparklesReturn } from './use-reaction-sparkles'
export type { ReactionType } from './use-reaction-sparkles'
export { useMagneticHover, type UseMagneticHoverReturn } from './use-magnetic-hover'
export type { UseMagneticHoverOptions } from './use-magnetic-hover'
export { useDragGesture, type UseDragGestureReturn } from './use-drag-gesture'
export type { UseDragGestureOptions } from './use-drag-gesture'
export { useBubbleGesture, type UseBubbleGestureReturn } from './use-bubble-gesture'
export type { UseBubbleGestureOptions } from './use-bubble-gesture'
export { useSwipeReply, type UseSwipeReplyReturn } from './use-swipe-reply'
export type { UseSwipeReplyOptions } from './use-swipe-reply'
export { usePullToRefresh, type UsePullToRefreshReturn } from './use-pull-to-refresh'
export type { UsePullToRefreshOptions } from './use-pull-to-refresh'
export { useParallaxTilt, type UseParallaxTiltReturn } from './use-parallax-tilt'
export type { UseParallaxTiltOptions } from './use-parallax-tilt'
export { useKineticScroll, type UseKineticScrollReturn } from './use-kinetic-scroll'
export type { UseKineticScrollOptions } from './use-kinetic-scroll'
export { useParallaxScroll, useParallaxLayers, type UseParallaxScrollReturn, type UseParallaxLayersReturn } from './use-parallax-scroll'
export type { UseParallaxScrollOptions, UseParallaxLayersOptions } from './use-parallax-scroll'
export { useLiquidSwipe, type UseLiquidSwipeReturn } from './use-liquid-swipe'
export type { UseLiquidSwipeOptions } from './use-liquid-swipe'

// Motion Migration Layer (Phase 3)
export { useMotionDiv, useInteractiveMotion, useRepeatingAnimation } from './use-motion-div'
export { useMotionVariants, type UseMotionVariantsReturn } from './use-motion-variants'
export type { UseMotionVariantsOptions, VariantDefinition, Variants } from './use-motion-variants'
export { useAnimatePresence, type UseAnimatePresenceReturn } from './use-animate-presence'
export type { UseAnimatePresenceOptions } from './use-animate-presence'
export { useLayoutAnimation, type UseLayoutAnimationReturn } from './use-layout-animation'
export type { UseLayoutAnimationOptions } from './use-layout-animation'

// Transition hooks
export { useEntryAnimation, type UseEntryAnimationOptions, type UseEntryAnimationReturn } from './use-entry-animation'
export { useModalAnimation, type UseModalAnimationOptions, type UseModalAnimationReturn } from './use-modal-animation'
export { usePageTransition, type UsePageTransitionOptions, type UsePageTransitionReturn } from './use-page-transition'
export { usePageTransitionWrapper, type UsePageTransitionWrapperOptions, type UsePageTransitionWrapperReturn } from './use-page-transition-wrapper'
export { useHeaderAnimation, type UseHeaderAnimationOptions, type UseHeaderAnimationReturn } from './use-header-animation'
export { useSidebarAnimation, type UseSidebarAnimationOptions, type UseSidebarAnimationReturn } from './use-sidebar-animation'
export { useExpandCollapse, type UseExpandCollapseOptions, type UseExpandCollapseReturn } from './use-expand-collapse'
export { useRotation, type UseRotationOptions, type UseRotationReturn } from './use-rotation'
export { useIconRotation, type UseIconRotationOptions, type UseIconRotationReturn } from './use-icon-rotation'
export { useLogoAnimation, type UseLogoAnimationReturn } from './use-logo-animation'
export { useLogoGlow, type UseLogoGlowReturn } from './use-logo-animation'

// Existing hooks
export { useBounceOnTap } from './use-bounce-on-tap'
export { useRippleEffect } from './use-ripple-effect'
export { useStaggeredContainer } from './use-staggered-container'
export { useStaggeredItem } from './use-staggered-item'
export { useStickerAnimation } from './use-sticker-animation'

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
