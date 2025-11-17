'use client';

export { useBounceOnTap } from './use-bounce-on-tap';
export { useShimmer } from './use-shimmer';
export { useGlowPulse } from './use-glow-pulse';
export { useMagneticEffect } from './use-magnetic-effect';
export { useParallaxTilt } from './use-parallax-tilt';
export { useHoverLift } from './use-hover-lift';
export { useFloatingParticle } from './use-floating-particle';
export { useGradientAnimation } from './use-gradient-animation';
export { usePageTransition } from './use-page-transition';
export { useNavBarAnimation } from './use-nav-bar-animation';
export { useHeaderAnimation } from './use-header-animation';
export { useHeaderButtonAnimation } from './use-header-button-animation';
export { useStaggeredContainer } from './use-staggered-container';
export { useModalAnimation } from './use-modal-animation';
export { useIconRotation } from './use-icon-rotation';
export { useShimmerSweep } from './use-shimmer-sweep';
export { useLogoAnimation, useLogoGlow } from './use-logo-animation';
export { usePageTransitionWrapper } from './use-page-transition-wrapper';
export { useSidebarAnimation } from './use-sidebar-animation';
export { useExpandCollapse } from './use-expand-collapse';
export { useRotation } from './use-rotation';
export { useStaggeredItem } from './use-staggered-item';
export { useHoverTap } from './use-hover-tap';
export { useEntryAnimation } from './use-entry-animation';
export { useStickerAnimation } from './use-sticker-animation';
export type {
  UseStickerAnimationOptions,
  UseStickerAnimationReturn,
  StickerAnimationType,
} from './use-sticker-animation';
export type {
  UseHeaderButtonAnimationOptions,
  UseHeaderButtonAnimationReturn,
} from './use-header-button-animation';
export type {
  UseStaggeredContainerOptions,
  UseStaggeredContainerReturn,
} from './use-staggered-container';

export type { UseBounceOnTapOptions, UseBounceOnTapReturn } from './use-bounce-on-tap';
export type { UseShimmerOptions, UseShimmerReturn } from './use-shimmer';
export type { UseGlowPulseOptions, UseGlowPulseReturn } from './use-glow-pulse';
export type { UseMagneticEffectOptions, UseMagneticEffectReturn } from './use-magnetic-effect';
export type { UseParallaxTiltOptions, UseParallaxTiltReturn } from './use-parallax-tilt';
export type { UseHoverLiftOptions, UseHoverLiftReturn } from './use-hover-lift';
export type {
  UseFloatingParticleOptions,
  UseFloatingParticleReturn,
} from './use-floating-particle';
export type {
  UseSidebarAnimationOptions,
  UseSidebarAnimationReturn,
} from './use-sidebar-animation';
export type { UseExpandCollapseOptions, UseExpandCollapseReturn } from './use-expand-collapse';
export type { UseRotationOptions, UseRotationReturn } from './use-rotation';
export type { UseStaggeredItemOptions, UseStaggeredItemReturn } from './use-staggered-item';
export type { UseHoverTapOptions, UseHoverTapReturn } from './use-hover-tap';
export type {
  UseGradientAnimationOptions,
  UseGradientAnimationReturn,
} from './use-gradient-animation';
export type { UsePageTransitionOptions, UsePageTransitionReturn } from './use-page-transition';
export type { UseNavBarAnimationOptions, UseNavBarAnimationReturn } from './use-nav-bar-animation';
export type { UseHeaderAnimationOptions, UseHeaderAnimationReturn } from './use-header-animation';
export type { UseModalAnimationOptions, UseModalAnimationReturn } from './use-modal-animation';
export type { UseIconRotationOptions, UseIconRotationReturn } from './use-icon-rotation';
export type { UseShimmerSweepOptions, UseShimmerSweepReturn } from './use-shimmer-sweep';
export type { UseLogoAnimationReturn } from './use-logo-animation';
export type { UseLogoGlowReturn } from './use-logo-animation';
export type {
  UsePageTransitionWrapperOptions,
  UsePageTransitionWrapperReturn,
} from './use-page-transition-wrapper';
export type { SpringConfig, TimingConfig } from './transitions';

// Ultra Enhanced Animations
export { useUltraCardReveal } from './use-ultra-card-reveal';
export { useMagneticHover } from './use-magnetic-hover';
export { useRippleEffect } from './use-ripple-effect';
export { useElasticScale } from './use-elastic-scale';
export { useMorphShape } from './use-morph-shape';
export { use3DFlipCard } from './use-3d-flip-card';
export { useLiquidSwipe } from './use-liquid-swipe';
export { useParallaxScroll, useParallaxLayers } from './use-parallax-scroll';
export { useKineticScroll } from './use-kinetic-scroll';
export { useSpringCarousel } from './use-spring-carousel';
export { useGlowBorder } from './use-glow-border';
export { useBreathingAnimation } from './use-breathing-animation';
export { useWaveAnimation, useMultiWave } from './use-wave-animation';
export { useConfettiBurst } from './use-confetti-burst';

export type { UseUltraCardRevealOptions } from './use-ultra-card-reveal';
export type { UseMagneticHoverOptions } from './use-magnetic-hover';
export type { UseRippleEffectOptions, RippleState } from './use-ripple-effect';
export type { UseElasticScaleOptions } from './use-elastic-scale';
export type { UseMorphShapeOptions } from './use-morph-shape';
export type { Use3DFlipCardOptions } from './use-3d-flip-card';
export type { UseLiquidSwipeOptions } from './use-liquid-swipe';
export type { UseParallaxScrollOptions } from './use-parallax-scroll';
export type { UseKineticScrollOptions } from './use-kinetic-scroll';
export type { UseSpringCarouselOptions } from './use-spring-carousel';
export type { UseGlowBorderOptions } from './use-glow-border';
export type { UseBreathingAnimationOptions } from './use-breathing-animation';
export type { UseWaveAnimationOptions } from './use-wave-animation';
export type { UseConfettiBurstOptions, ConfettiParticle } from './use-confetti-burst';

export { useMotionDiv, useInteractiveMotion, useRepeatingAnimation } from './use-motion-migration';
export { useMotionVariants } from './use-motion-variants';
export { useAnimatePresence } from './use-animate-presence';
export { useLayoutAnimation } from './use-layout-animation';
export { useDragGesture } from './use-drag-gesture';
export type {
  UseMotionVariantsOptions,
  UseMotionVariantsReturn,
  VariantDefinition,
  Variants,
} from './use-motion-variants';
export type { UseAnimatePresenceOptions, UseAnimatePresenceReturn } from './use-animate-presence';
export type { UseLayoutAnimationOptions, UseLayoutAnimationReturn } from './use-layout-animation';
export type { UseDragGestureOptions, UseDragGestureReturn } from './use-drag-gesture';

// Re-export commonly used primitives to simplify imports across app code
export { useSharedValue, useAnimatedStyle } from '@petspark/motion';
