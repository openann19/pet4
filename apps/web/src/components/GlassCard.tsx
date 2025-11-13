import { cn } from '@/lib/utils';
import { MotionView } from '@petspark/motion';
import { useSharedValue, useAnimatedStyle, withTiming, animate } from '@petspark/motion';
import React from 'react';
import type { ReactNode } from 'react';
import { isTruthy } from '@petspark/shared';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

interface GlassCardProps {
  children: ReactNode;
  intensity?: 'light' | 'medium' | 'strong';
  enableHover?: boolean;
  className?: string;
}

const intensityClasses = {
  light: 'bg-(--background)/5 backdrop-blur-sm border-(--border)/10',
  medium: 'bg-(--background)/10 backdrop-blur-md border-(--border)/20',
  strong: 'bg-(--background)/20 backdrop-blur-xl border-(--border)/30',
};

export default function GlassCard({
  children,
  intensity = 'medium',
  enableHover = true,
  className,
  ...props
}: GlassCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const opacity = useSharedValue(0);
  const y = useSharedValue(20);
  const hoverScale = useSharedValue(1);
  const hoverY = useSharedValue(0);

  // Entry animation
  React.useEffect(() => {
    if (prefersReducedMotion) {
      opacity.value = 1;
      y.value = 0;
      return;
    }
    const opacityTransition = withTiming(1, { duration: 400 });
    animate(opacity, opacityTransition.target, opacityTransition.transition);
    const yTransition = withTiming(0, { duration: 400 });
    animate(y, yTransition.target, yTransition.transition);
  }, [opacity, y, prefersReducedMotion]);

  // Hover animation
  const handleMouseEnter = React.useCallback(() => {
    if (isTruthy(enableHover) && !prefersReducedMotion) {
      const scaleTransition = withTiming(1.02, { duration: 200 });
      animate(hoverScale, scaleTransition.target, scaleTransition.transition);
      const yTransition = withTiming(-6, { duration: 200 });
      animate(hoverY, yTransition.target, yTransition.transition);
    }
  }, [enableHover, hoverScale, hoverY, prefersReducedMotion]);

  const handleMouseLeave = React.useCallback(() => {
    if (isTruthy(enableHover) && !prefersReducedMotion) {
      const scaleTransition = withTiming(1, { duration: 200 });
      animate(hoverScale, scaleTransition.target, scaleTransition.transition);
      const yTransition = withTiming(0, { duration: 200 });
      animate(hoverY, yTransition.target, yTransition.transition);
    }
  }, [enableHover, hoverScale, hoverY, prefersReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: y.get() + hoverY.get() }, { scale: hoverScale.get() }],
    boxShadow:
      enableHover && hoverY.get() < 0 ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : undefined,
  }));

  return (
    <MotionView
      animatedStyle={animatedStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'rounded-3xl border shadow-xl',
        prefersReducedMotion ? '' : 'transition-all duration-300',
        intensityClasses[intensity],
        className
      )}
      {...props}
    >
      <div className="relative overflow-hidden rounded-3xl">{children}</div>
    </MotionView>
  );
}
