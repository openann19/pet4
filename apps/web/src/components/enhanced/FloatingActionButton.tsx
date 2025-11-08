'use client';

import { useEffect, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Plus } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { AnimatedView, useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface FloatingActionButtonProps {
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  expanded?: boolean;
  label?: string;
}

const SPRING_CONFIG = {
  stiffness: 400,
  damping: 20,
  mass: 1,
};

export function FloatingActionButton({
  icon = <Plus size={24} weight="bold" />,
  onClick,
  className,
  expanded = false,
  label,
}: FloatingActionButtonProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-180);
  const iconRotate = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const labelWidth = useSharedValue(0);
  const shimmerX = useSharedValue(-100);
  const hoverScale = useSharedValue(1);
  const hoverRotate = useSharedValue(0);

  // Entry animation
  useEffect(() => {
    if (reducedMotion) {
      scale.value = withTiming(1, { duration: 200 });
      rotate.value = withTiming(0, { duration: 200 });
    } else {
      scale.value = withSpring(1, SPRING_CONFIG);
      rotate.value = withSpring(0, SPRING_CONFIG);
    }
  }, [scale, rotate, reducedMotion]);

  // Expanded state
  useEffect(() => {
    if (expanded) {
      iconRotate.value = withSpring(45, SPRING_CONFIG);
      labelOpacity.value = withTiming(1, { duration: 200 });
      labelWidth.value = withTiming(1, { duration: 200 });
    } else {
      iconRotate.value = withSpring(0, SPRING_CONFIG);
      labelOpacity.value = withTiming(0, { duration: 200 });
      labelWidth.value = withTiming(0, { duration: 200 });
    }
  }, [expanded, iconRotate, labelOpacity, labelWidth]);

  // Shimmer effect
  useEffect(() => {
    if (reducedMotion) return;

    shimmerX.value = withRepeat(
      withSequence(
        withDelay(3000, withTiming(100, { duration: 2000, easing: Easing.linear })),
        withTiming(-100, { duration: 0 })
      ),
      -1,
      false
    );
  }, [shimmerX, reducedMotion]);

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value * hoverScale.value },
        { rotate: `${rotate.value + hoverRotate.value}deg` },
      ],
      width: expanded ? 'auto' : '56px',
      paddingLeft: expanded ? '20px' : '0',
      paddingRight: expanded ? '20px' : '0',
    };
  }) as AnimatedStyle;

  const labelStyle = useAnimatedStyle(() => {
    return {
      opacity: labelOpacity.value,
      width: labelWidth.value === 0 ? 0 : 'auto',
    };
  }) as AnimatedStyle;

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: `${shimmerX.value}%` }],
    };
  }) as AnimatedStyle;

  const handleClick = useCallback(() => {
    haptics.impact('medium');
    onClick?.();
  }, [onClick]);

  const handleMouseEnter = useCallback(() => {
    if (reducedMotion) return;
    hoverScale.value = withSpring(1.1, SPRING_CONFIG);
    hoverRotate.value = withSpring(5, SPRING_CONFIG);
  }, [hoverScale, hoverRotate, reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    if (reducedMotion) return;
    hoverScale.value = withSpring(1, SPRING_CONFIG);
    hoverRotate.value = withSpring(0, SPRING_CONFIG);
  }, [hoverScale, hoverRotate, reducedMotion]);

  const handleMouseDown = useCallback(() => {
    if (reducedMotion) return;
    hoverScale.value = withSpring(0.95, SPRING_CONFIG);
  }, [hoverScale, reducedMotion]);

  const handleMouseUp = useCallback(() => {
    if (reducedMotion) return;
    hoverScale.value = withSpring(1.1, SPRING_CONFIG);
  }, [hoverScale, reducedMotion]);

  const iconContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${iconRotate.value}deg` }],
      width: 56,
      height: 56,
    };
  }) as AnimatedStyle;

  const buttonCSSStyle = useAnimatedStyleValue(buttonStyle);

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={buttonCSSStyle}
      className={cn(
        'fixed bottom-24 right-6 z-50 flex items-center gap-3 rounded-full',
        'bg-linear-to-br from-primary via-accent to-secondary',
        'text-primary-foreground shadow-2xl',
        'overflow-hidden',
        'cursor-pointer',
        'border-0',
        className
      )}
    >
      <AnimatedView style={iconContainerStyle} className="flex items-center justify-center">
        {icon}
      </AnimatedView>

      {expanded && label && (
        <AnimatedView style={labelStyle} className="font-semibold text-sm whitespace-nowrap">
          {label}
        </AnimatedView>
      )}

      {!reducedMotion && (
        <AnimatedView
          style={shimmerStyle}
          className="absolute inset-0 bg-linear-to-r from-white/0 via-white/30 to-white/0 pointer-events-none"
        >
          {null}
        </AnimatedView>
      )}
    </button>
  );
}
