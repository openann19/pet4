'use client';;
import { MotionView } from "@petspark/motion";

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import { usePageTransitionWrapper } from '@/effects/reanimated/use-page-transition-wrapper';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import type { AnimatedStyle } from '@petspark/motion';

export interface PageTransitionWrapperProps {
  children: ReactNode;
  key?: string;
  duration?: number;
  direction?: 'up' | 'down' | 'fade';
  className?: string;
}

export function PageTransitionWrapper({
  children,
  key: transitionKey = 'default',
  duration = 300,
  direction = 'up',
  className,
}: PageTransitionWrapperProps): React.JSX.Element {
  const reducedMotion = usePrefersReducedMotion();
  const effectiveDuration = reducedMotion ? 0 : duration;

  const transition = usePageTransitionWrapper({
    key: transitionKey,
    duration: effectiveDuration,
    direction,
  });

  const animatedStyleValue = useAnimatedStyleValue(
    reducedMotion
      ? {
          opacity: 1,
        }
      : transition.style
  );

  const wrapperClassName = useMemo(() => {
    const baseClasses = 'w-full h-full';
    return className ? `${baseClasses} ${className}` : baseClasses;
  }, [className]);

  if (reducedMotion) {
    return <div className={wrapperClassName}>{children}</div>;
  }

  return (
    <MotionView style={animatedStyleValue} className={wrapperClassName}>
      {children}
    </MotionView>
  );
}
