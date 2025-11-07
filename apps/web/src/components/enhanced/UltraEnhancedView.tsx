/**
 * Ultra Enhanced View Wrapper
 * Wraps any view with ultra animations and effects
 */

import { type ReactNode } from 'react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import {
  usePageTransition,
  useParallaxScroll,
  useBreathingAnimation,
} from '@/effects/reanimated';

export interface UltraEnhancedViewProps {
  children: ReactNode;
  enableParallax?: boolean;
  enableBreathing?: boolean;
  enableTransition?: boolean;
  className?: string;
}

export function UltraEnhancedView({
  children,
  enableParallax = false,
  enableBreathing = false,
  enableTransition = true,
  className = '',
}: UltraEnhancedViewProps) {
  const pageTransition = usePageTransition({
    isVisible: true,
    direction: 'up',
    duration: 400,
  });

  const parallax = useParallaxScroll({
    speed: 0.3,
    direction: 'vertical',
    enabled: enableParallax,
  });

  const breathing = useBreathingAnimation({
    enabled: enableBreathing,
    duration: 4000,
    minScale: 0.995,
    maxScale: 1.005,
  });

  const combinedStyle = {
    ...(enableTransition ? pageTransition.style : {}),
    ...(enableParallax ? parallax.animatedStyle : {}),
    ...(enableBreathing ? breathing.animatedStyle : {}),
  };

  return (
    <AnimatedView style={combinedStyle} className={className}>
      {children}
    </AnimatedView>
  );
}
