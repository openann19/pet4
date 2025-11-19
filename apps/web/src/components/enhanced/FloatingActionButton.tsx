'use client';

import { useEffect, useCallback } from 'react';
import {
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  animate,
  MotionView,
} from '@petspark/motion';
import { Plus } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useUIConfig } from "@/hooks/use-ui-config";

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
    const _uiConfig = useUIConfig();
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
      animate(scale, 1, { duration: 0.2 });
      animate(rotate, 0, { duration: 0.2 });
    } else {
      const scaleTransition = withSpring(1, SPRING_CONFIG);
      animate(scale, scaleTransition.target, scaleTransition.transition);
      const rotateTransition = withSpring(0, SPRING_CONFIG);
      animate(rotate, rotateTransition.target, rotateTransition.transition);
    }
  }, [scale, rotate, reducedMotion]);

  // Expanded state
  useEffect(() => {
    if (expanded) {
      const iconRotateTransition = withSpring(45, SPRING_CONFIG);
      animate(iconRotate, iconRotateTransition.target, iconRotateTransition.transition);
      const opacityTransition = withTiming(1, { duration: 200 });
      animate(labelOpacity, opacityTransition.target, opacityTransition.transition);
      const widthTransition = withTiming(1, { duration: 200 });
      animate(labelWidth, widthTransition.target, widthTransition.transition);
    } else {
      const iconRotateTransition = withSpring(0, SPRING_CONFIG);
      animate(iconRotate, iconRotateTransition.target, iconRotateTransition.transition);
      const opacityTransition = withTiming(0, { duration: 200 });
      animate(labelOpacity, opacityTransition.target, opacityTransition.transition);
      const widthTransition = withTiming(0, { duration: 200 });
      animate(labelWidth, widthTransition.target, widthTransition.transition);
    }
  }, [expanded, iconRotate, labelOpacity, labelWidth]);

  // Shimmer effect
  useEffect(() => {
    if (reducedMotion) return;

    const delayTransition = withDelay(3000, withTiming(100, { duration: 2000, easing: Easing.linear }));
    const sequence = withSequence(
      delayTransition,
      withTiming(-100, { duration: 0 })
    );
    const repeatTransition = withRepeat(sequence, -1, false);
    animate(shimmerX, repeatTransition.target, repeatTransition.transition);
  }, [shimmerX, reducedMotion]);

  const buttonStyle = useAnimatedStyle((): Record<string, unknown> => {
    return {
      transform: [
        { scale: scale.get() * hoverScale.get() },
        { rotate: `${rotate.get() + hoverRotate.get()}deg` },
      ],
      width: expanded ? 'auto' : '56px',
      paddingLeft: expanded ? '20px' : '0',
      paddingRight: expanded ? '20px' : '0',
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    return {
      opacity: labelOpacity.get(),
      width: labelWidth.get() === 0 ? 0 : 'auto',
    };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: `${shimmerX.get()}%` }],
    };
  });

  const handleClick = useCallback(() => {
    haptics.impact('medium');
    onClick?.();
  }, [onClick]);

  const handleMouseEnter = useCallback(() => {
    if (reducedMotion) return;
    const scaleTransition = withSpring(1.1, SPRING_CONFIG);
    animate(hoverScale, scaleTransition.target, scaleTransition.transition);
    const rotateTransition = withSpring(5, SPRING_CONFIG);
    animate(hoverRotate, rotateTransition.target, rotateTransition.transition);
  }, [hoverScale, hoverRotate, reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    if (reducedMotion) return;
    const scaleTransition = withSpring(1, SPRING_CONFIG);
    animate(hoverScale, scaleTransition.target, scaleTransition.transition);
    const rotateTransition = withSpring(0, SPRING_CONFIG);
    animate(hoverRotate, rotateTransition.target, rotateTransition.transition);
  }, [hoverScale, hoverRotate, reducedMotion]);

  const handleMouseDown = useCallback(() => {
    if (reducedMotion) return;
    const scaleTransition = withSpring(0.95, SPRING_CONFIG);
    animate(hoverScale, scaleTransition.target, scaleTransition.transition);
  }, [hoverScale, reducedMotion]);

  const handleMouseUp = useCallback(() => {
    if (reducedMotion) return;
    const scaleTransition = withSpring(1.1, SPRING_CONFIG);
    animate(hoverScale, scaleTransition.target, scaleTransition.transition);
  }, [hoverScale, reducedMotion]);

  const iconContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${String(iconRotate.get() ?? '')}deg` }],
      width: 56,
      height: 56,
    };
  });

  const buttonCSSStyle = useAnimatedStyleValue(buttonStyle);

  return (
    <button
      onClick={() => void handleClick()}
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
      <MotionView style={iconContainerStyle} className="flex items-center justify-center">
        {icon}
      </MotionView>
      {expanded && label && (
        <MotionView style={labelStyle} className="font-semibold text-sm whitespace-nowrap">
          {label}
        </MotionView>
      )}
      {!reducedMotion && (
        <MotionView
          style={shimmerStyle}
          className="absolute inset-0 bg-linear-to-r from-white/0 via-white/30 to-white/0 pointer-events-none"
        >
          {null}
        </MotionView>
      )}
    </button>
  );
}
