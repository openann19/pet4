import { cn } from '@/lib/utils';
import { MotionView } from '@petspark/motion';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import React from 'react';
import type { ReactNode } from 'react';
import { isTruthy, isDefined } from '@petspark/shared';

interface GlassCardProps {
  children: ReactNode;
  intensity?: 'light' | 'medium' | 'strong';
  enableHover?: boolean;
  className?: string;
}

const intensityClasses = {
  light: 'bg-white/5 backdrop-blur-sm border-white/10',
  medium: 'bg-white/10 backdrop-blur-md border-white/20',
  strong: 'bg-white/20 backdrop-blur-xl border-white/30',
};

export default function GlassCard({
  children,
  intensity = 'medium',
  enableHover = true,
  className,
  ...props
}: GlassCardProps) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(20);
  const hoverScale = useSharedValue(1);
  const hoverY = useSharedValue(0);

  // Entry animation
  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    y.value = withTiming(0, { duration: 400 });
  }, []);

  // Hover animation
  const handleMouseEnter = React.useCallback(() => {
    if (isTruthy(enableHover)) {
      hoverScale.value = withTiming(1.02, { duration: 200 });
      hoverY.value = withTiming(-6, { duration: 200 });
    }
  }, [enableHover]);

  const handleMouseLeave = React.useCallback(() => {
    if (isTruthy(enableHover)) {
      hoverScale.value = withTiming(1, { duration: 200 });
      hoverY.value = withTiming(0, { duration: 200 });
    }
  }, [enableHover]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value + hoverY.value }, { scale: hoverScale.value }],
    boxShadow:
      enableHover && hoverY.value < 0 ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : undefined,
  }));

  return (
    <MotionView
      animatedStyle={animatedStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'rounded-3xl border shadow-xl transition-all duration-300',
        intensityClasses[intensity],
        className
      )}
      {...props}
    >
      <div className="relative overflow-hidden rounded-3xl">{children}</div>
    </MotionView>
  );
}
