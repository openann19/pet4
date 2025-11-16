import { cn } from '@/lib/utils';
import { MotionView } from '@petspark/motion';
import { useSharedValue, useAnimatedStyle, withTiming } from '@petspark/motion';
import React from 'react';
import type { ReactNode } from 'react';
import { isTruthy } from '@petspark/shared';

export type CardVariant =
  | 'glass'
  | 'gradient'
  | 'neon'
  | 'holographic'
  | 'premium'
  | 'minimal'
  | 'floating';
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

interface AdvancedCardProps {
  variant?: CardVariant;
  size?: CardSize;
  children: ReactNode;
  enableHover?: boolean;
  enableGlow?: boolean;
  glowColor?: string;
  className?: string;
}

const sizeClasses: Record<CardSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

const variantClasses: Record<CardVariant, string> = {
  glass: 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl',
  gradient:
    'bg-linear-to-br from-primary/10 via-accent/5 to-secondary/10 backdrop-blur-sm border border-white/10',
  neon: 'bg-background border-2 border-accent shadow-[0_0_20px_rgba(245,158,11,0.3)]',
  holographic:
    'bg-linear-to-br from-primary/20 via-accent/20 to-secondary/20 backdrop-blur-md border border-white/30 relative overflow-hidden',
  premium:
    'bg-linear-to-br from-white/90 to-white/70 backdrop-blur-xl border border-white/40 shadow-2xl',
  minimal: 'bg-card border border-border',
  floating: 'bg-card border border-border shadow-xl',
};

export default function AdvancedCard({
  variant = 'glass',
  size = 'md',
  children,
  enableHover = true,
  enableGlow = false,
  glowColor = 'rgba(245, 158, 11, 0.5)',
  className,
  ...props
}: AdvancedCardProps) {
  const opacity = useSharedValue<number>(0);
  const y = useSharedValue<number>(20);
  const hoverScale = useSharedValue<number>(1);
  const hoverY = useSharedValue<number>(0);

  // Entry animation
  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    y.value = withTiming(0, { duration: 400 });
  }, []);

  // Hover animation
  const handleMouseEnter = React.useCallback(() => {
    if (isTruthy(enableHover)) {
      hoverScale.value = withTiming(1.02, { duration: 200 });
      hoverY.value = withTiming(-4, { duration: 200 });
    }
  }, [enableHover]);

  const handleMouseLeave = React.useCallback(() => {
    if (isTruthy(enableHover)) {
      hoverScale.value = withTiming(1, { duration: 200 });
      hoverY.value = withTiming(0, { duration: 200 });
    }
  }, [enableHover]);

  const animatedStyle = useAnimatedStyle(() => {
    const transform: Record<string, number>[] = [
      { translateY: y.value + hoverY.value },
      { scale: hoverScale.value },
    ];
    return {
      opacity: opacity.value,
      transform,
    };
  });

  return (
    <MotionView
      animatedStyle={animatedStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'rounded-2xl transition-all duration-300',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...(enableGlow
        ? {
            style: {
              boxShadow: `0 0 40px ${glowColor}, 0 20px 25px -5px rgba(0, 0, 0, 0.1)`,
            },
          }
        : {})}
      {...props}
    >
      {variant === 'holographic' && (
        <div className="absolute inset-0 opacity-30 pointer-events-none" />
      )}
      {children}
    </MotionView>
  );
}
