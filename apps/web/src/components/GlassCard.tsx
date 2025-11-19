import { cn } from '@/lib/utils';
import { motion, type AnimatedStyle, type Transition, useSharedValue, withTiming } from '@petspark/motion';
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
  const opacity = useSharedValue<number>(0);
  const y = useSharedValue<number>(20);
  const hoverScale = useSharedValue<number>(1);
  const hoverY = useSharedValue<number>(0);

  // Entry animation
  React.useEffect(() => {
    if (prefersReducedMotion) {
      opacity.value = 1;
      y.value = 0;
      return;
    }
    opacity.value = withTiming(1, { duration: 400 }) as { target: 1; transition: Transition };
    y.value = withTiming(0, { duration: 400 }) as { target: 0; transition: Transition };
  }, [opacity, y, prefersReducedMotion]);

  // Hover animation
  const handleMouseEnter = React.useCallback(() => {
    if (isTruthy(enableHover) && !prefersReducedMotion) {
      hoverScale.value = withTiming(1.02, { duration: 200 }) as { target: 1.02; transition: Transition };
      hoverY.value = withTiming(-6, { duration: 200 }) as { target: -6; transition: Transition };
    }
  }, [enableHover, hoverScale, hoverY, prefersReducedMotion]);

  const handleMouseLeave = React.useCallback(() => {
    if (isTruthy(enableHover) && !prefersReducedMotion) {
      hoverScale.value = withTiming(1, { duration: 200 }) as { target: 1; transition: Transition };
      hoverY.value = withTiming(0, { duration: 200 }) as { target: 0; transition: Transition };
    }
  }, [enableHover, hoverScale, hoverY, prefersReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = y.get() + hoverY.get();
    const scale = hoverScale.get();
    const transforms: Record<string, number | string>[] = [];
    if (translateY !== 0) {
      transforms.push({ translateY });
    }
    if (scale !== 1) {
      transforms.push({ scale });
    }
    return {
      opacity: opacity.get(),
      transform: transforms.length > 0 ? transforms : undefined,
      boxShadow:
        enableHover && hoverY.get() < 0 ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : undefined,
    };
  });

  return (
    <MotionView
      style={animatedStyle}
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
