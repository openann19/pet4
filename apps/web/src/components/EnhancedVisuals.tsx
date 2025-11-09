import { MotionView } from '@petspark/motion';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import React from 'react';
import type { ReactNode } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('EnhancedVisuals');

interface EnhancedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function EnhancedCard({ children, className = '', delay = 0 }: EnhancedCardProps) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(20);
  const hoverY = useSharedValue(0);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 500 });
      y.value = withTiming(0, { duration: 500 });
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay, opacity, y]);

  const handleMouseEnter = React.useCallback(() => {
    hoverY.value = withTiming(-4, { duration: 200 });
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    hoverY.value = withTiming(0, { duration: 200 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value + hoverY.value }],
  }));

  return (
    <MotionView
      animatedStyle={animatedStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </MotionView>
  );
}

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label?: string;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon,
  label,
  className = '',
}: FloatingActionButtonProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const hoverScale = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    const timeoutId = setTimeout(() => {
      scale.value = withTiming(1, { duration: 300 });
    }, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [opacity, scale]);

  const handleMouseEnter = React.useCallback(() => {
    hoverScale.value = withTiming(1.05, { duration: 200 });
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    hoverScale.value = withTiming(1, { duration: 200 });
  }, []);

  const handleClick = React.useCallback(() => {
    try {
      onClick();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('FloatingActionButton onClick error', err);
    }
  }, [onClick]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value * hoverScale.value }],
  }));

  return (
    <MotionView
      animatedStyle={animatedStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`fixed bottom-24 right-6 z-50 h-14 flex items-center gap-3 bg-linear-to-r from-primary to-accent text-white px-6 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 ${className}`}
    >
      <span className="text-xl">{icon}</span>
      {label && <span className="font-semibold text-sm">{label}</span>}
    </MotionView>
  );
}

interface PulseIndicatorProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PulseIndicator({ color = 'bg-primary', size = 'md' }: PulseIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const scale1 = useSharedValue(1);
  const opacity1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const opacity2 = useSharedValue(0.5);

  React.useEffect(() => {
    // Pulse animation for first circle
    scale1.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );
    opacity1.value = withRepeat(
      withSequence(withTiming(0.8, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );

    // Pulse animation for second circle
    scale2.value = withRepeat(
      withSequence(withTiming(1.8, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1,
      true
    );
    opacity2.value = withRepeat(
      withSequence(withTiming(0, { duration: 2000 }), withTiming(0.5, { duration: 2000 })),
      -1,
      true
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  return (
    <div className="relative inline-flex">
      <MotionView
        animatedStyle={animatedStyle1}
        className={`${sizeClasses[size]} ${color} rounded-full`}
      />
      <MotionView
        animatedStyle={animatedStyle2}
        className={`absolute inset-0 ${color} rounded-full opacity-30`}
      />
    </div>
  );
}

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
}

export function GradientText({
  children,
  className = '',
  from = 'from-primary',
  via = 'via-accent',
  to = 'to-secondary',
}: GradientTextProps) {
  return (
    <span
      className={`bg-linear-to-r ${from} ${via} ${to} bg-clip-text text-transparent font-bold ${className}`}
    >
      {children}
    </span>
  );
}

interface ShimmerProps {
  children: ReactNode;
  className?: string;
}

export function Shimmer({ children, className = '' }: ShimmerProps) {
  const translateX = useSharedValue(-100);

  React.useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(200, { duration: 2000 }),
        withTiming(-100, { duration: 0 }),
        withTiming(200, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <MotionView
        animatedStyle={animatedStyle}
        className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}

interface CounterBadgeProps {
  count: number;
  max?: number;
  variant?: 'primary' | 'secondary' | 'accent';
}

export function CounterBadge({ count, max = 99, variant = 'primary' }: CounterBadgeProps) {
  const displayCount = count > max ? `${max}+` : count;

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
  };

  const scale = useSharedValue(count === 0 ? 1 : 0);

  React.useEffect(() => {
    if (count > 0) {
      scale.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count === 0) return null;

  return (
    <MotionView
      animatedStyle={animatedStyle}
      className={`absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${variantClasses[variant]}`}
    >
      {displayCount}
    </MotionView>
  );
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

function useDotAnimation(delay: number) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.5);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      translateY.value = withRepeat(
        withSequence(withTiming(-8, { duration: 300 }), withTiming(0, { duration: 300 })),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 300 }), withTiming(0.5, { duration: 300 })),
        -1,
        true
      );
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay, translateY]);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));
}

export function LoadingDots({ size = 'md', color = 'bg-primary' }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const dot1Style = useDotAnimation(0);
  const dot2Style = useDotAnimation(150);
  const dot3Style = useDotAnimation(300);

  return (
    <div className="flex items-center justify-center gap-1.5">
      <MotionView
        animatedStyle={dot1Style}
        className={`${sizeClasses[size]} ${color} rounded-full`}
      />
      <MotionView
        animatedStyle={dot2Style}
        className={`${sizeClasses[size]} ${color} rounded-full`}
      />
      <MotionView
        animatedStyle={dot3Style}
        className={`${sizeClasses[size]} ${color} rounded-full`}
      />
    </div>
  );
}

interface GlowingBorderProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowingBorder({
  children,
  className = '',
  glowColor = 'primary',
}: GlowingBorderProps) {
  const opacity = useSharedValue(0);

  const handleMouseEnter = React.useCallback(() => {
    opacity.value = withTiming(0.5, { duration: 300 });
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    opacity.value = withTiming(0, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <div className={`relative ${className}`}>
      <MotionView
        animatedStyle={animatedStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`absolute -inset-[1px] bg-linear-to-r from-${glowColor} via-accent to-${glowColor} rounded-inherit`}
        style={{ filter: 'blur(4px)' }}
      />
      <div className="relative bg-card rounded-inherit">{children}</div>
    </div>
  );
}
