'use client';

import { useSharedValue, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback } from 'react';
import type { ReactNode, CSSProperties } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  variant?: 'default' | 'glass' | 'gradient' | 'glow';
  delay?: number;
  tabIndex?: number;
  role?: string;
  ariaLabel?: string;
}

function useSharedValueStyle(sharedValue: ReturnType<typeof useSharedValue<number>>): number {
  const [value, setValue] = useState(sharedValue.value);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(sharedValue.value);
    }, 16);
    return () => clearInterval(interval);
  }, [sharedValue]);

  return value;
}

export function AnimatedCard({
  children,
  className,
  onClick,
  hover = true,
  variant = 'default',
  delay = 0,
  tabIndex = 0,
  role = 'group',
  ariaLabel,
}: AnimatedCardProps) {
  const isClickable = typeof onClick === 'function';

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  const currentScale = useSharedValueStyle(scale);
  const currentTranslateY = useSharedValueStyle(translateY);
  const currentOpacity = useSharedValueStyle(opacity);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        opacity.value = withTiming(1, {
          duration: 400,
          easing: Easing.inOut(Easing.ease),
        });
        translateY.value = withTiming(0, {
          duration: 400,
          easing: Easing.inOut(Easing.ease),
        });
      }, delay);
      return () => clearTimeout(timer);
    }
    opacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });
    return undefined;
  }, [delay, opacity, translateY]);

  const handleEnter = useCallback(() => {
    if (!hover || !isClickable) return;
    scale.value = withSpring(1.02, { damping: 25, stiffness: 400 });
    translateY.value = withSpring(-8, { damping: 25, stiffness: 400 });
  }, [hover, isClickable, scale, translateY]);

  const handleLeave = useCallback(() => {
    if (!hover || !isClickable) return;
    scale.value = withSpring(1, { damping: 25, stiffness: 400 });
    translateY.value = withSpring(0, { damping: 25, stiffness: 400 });
  }, [hover, isClickable, scale, translateY]);

  const handleClick = useCallback(() => {
    if (isTruthy(isClickable)) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 }, () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      });
      onClick?.();
    }
  }, [isClickable, onClick, scale]);

  const variantClasses = {
    default: 'bg-card border border-border',
    glass: 'glass-card backdrop-blur-md bg-white/5 border border-white/10 shadow-sm',
    gradient: 'gradient-card border border-transparent',
    glow: 'bg-card border border-border animate-glow-ring shadow-lg shadow-primary/10',
  };

  const containerStyle: CSSProperties = {
    transform: `scale(${currentScale}) translateY(${currentTranslateY}px)`,
    opacity: currentOpacity,
  };

  return (
    <div
      className={cn(
        'transition-transform duration-300',
        isClickable &&
          'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl',
        className
      )}
      style={containerStyle}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      tabIndex={isClickable ? tabIndex : undefined}
      role={isClickable ? role : undefined}
      aria-label={ariaLabel}
    >
      <Card
        className={cn(
          'overflow-hidden rounded-xl transition-all duration-300',
          variantClasses[variant]
        )}
      >
        {children}
      </Card>
    </div>
  );
}
