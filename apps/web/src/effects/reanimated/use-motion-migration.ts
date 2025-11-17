'use client';

import { useEffect, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from '@petspark/motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { usePressBounce } from '@/effects/reanimated/use-bounce-on-tap';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

/**
 * Hook to replace motion.div with initial/animate props
 * Note: This is a simplified version. For complex animations, use useSharedValue directly.
 */
export function useMotionDiv({
  initial = {},
  animate = {},
  transition = {},
  enabled = true,
}: {
  initial?: Record<string, number>;
  animate?: Record<string, number>;
  transition?: {
    type?: string;
    stiffness?: number;
    damping?: number;
    duration?: number;
    delay?: number;
  };
  enabled?: boolean;
}) {
  // Create shared values for common properties
  const scale = useSharedValue(initial.scale ?? animate.scale ?? 1);
  const opacity = useSharedValue(initial.opacity ?? animate.opacity ?? 1);
  const x = useSharedValue(initial.x ?? animate.x ?? 0);
  const y = useSharedValue(initial.y ?? animate.y ?? 0);
  const rotate = useSharedValue(initial.rotate ?? animate.rotate ?? 0);

  useEffect(() => {
    if (!enabled) return;

    const springConfig =
      transition.type === 'spring'
        ? {
            stiffness: transition.stiffness ?? springConfigs.smooth.stiffness,
            damping: transition.damping ?? springConfigs.smooth.damping,
          }
        : springConfigs.smooth;

    const timingConfig = { duration: transition.duration ?? timingConfigs.smooth.duration };

    const updateValue = (key: string, value: number) => {
      if (transition.delay && transition.delay > 0) {
        return transition.type === 'spring'
          ? withDelay(transition.delay, withSpring(value, springConfig))
          : withDelay(transition.delay, withTiming(value, timingConfig));
      }
      return transition.type === 'spring'
        ? withSpring(value, springConfig)
        : withTiming(value, timingConfig);
    };

    if (animate.scale !== undefined) scale.value = updateValue('scale', animate.scale);
    if (animate.opacity !== undefined) opacity.value = updateValue('opacity', animate.opacity);
    if (animate.x !== undefined) x.value = updateValue('x', animate.x);
    if (animate.y !== undefined) y.value = updateValue('y', animate.y);
    if (animate.rotate !== undefined) rotate.value = updateValue('rotate', animate.rotate);
  }, [enabled, animate, transition, scale, opacity, x, y, rotate]);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number | string>[] = [];

    if (x.value !== 0) transforms.push({ translateX: x.value });
    if (y.value !== 0) transforms.push({ translateY: y.value });
    if (scale.value !== 1) transforms.push({ scale: scale.value });
    if (rotate.value !== 0) transforms.push({ rotate: `${rotate.value}deg` });

    return {
      opacity: opacity.value,
      transform: transforms.length > 0 ? transforms : undefined,
    };
  }) as AnimatedStyle;

  return { animatedStyle };
}

/**
 * Hook to replace motion.div with whileHover/whileTap
 */
export function useInteractiveMotion({
  whileHover = {},
  whileTap = {},
  enabled = true,
}: {
  whileHover?: Record<string, number>;
  whileTap?: Record<string, number>;
  enabled?: boolean;
}) {
  const hasHover = enabled && Object.keys(whileHover).length > 0;
  const hasTap = enabled && Object.keys(whileTap).length > 0;

  const hoverLift = useHoverLift({
    scale: whileHover.scale ?? 1.05,
    translateY: whileHover.y ?? whileHover.translateY,
  });
  const bounceOnTap = usePressBounce({
    scale: whileTap.scale ?? 0.95,
    hapticFeedback: false,
  });

  const animatedStyle = useAnimatedStyle(() => {
    const hoverScale = hasHover ? hoverLift.scale.value : 1;
    const tapScale = hasTap ? bounceOnTap.scale.value : 1;
    const hoverY = hasHover ? hoverLift.translateY.value : 0;

    return {
      transform: [{ scale: hoverScale * tapScale }, { translateY: hoverY }],
    };
  }) as AnimatedStyle;

  const handleMouseUp = useCallback(() => {
    // Reset tap scale on mouse up
    if (hasTap) {
      bounceOnTap.scale.value = 1;
    }
  }, [hasTap, bounceOnTap.scale]);

  return {
    animatedStyle,
    onMouseEnter: hasHover ? hoverLift.handleEnter : undefined,
    onMouseLeave: hasHover ? hoverLift.handleLeave : undefined,
    onMouseDown: hasTap ? bounceOnTap.handlePress : undefined,
    onMouseUp: hasTap ? handleMouseUp : undefined,
  };
}

/**
 * Hook for repeating animations (like shimmer, pulse)
 */
export function useRepeatingAnimation({
  animate,
  duration = 2000,
  repeat = Infinity,
  enabled = true,
}: {
  animate: Record<string, number[]>;
  duration?: number;
  repeat?: number;
  enabled?: boolean;
}) {
  const scale = useSharedValue(animate.scale?.[0] ?? 1);
  const rotate = useSharedValue(animate.rotate?.[0] ?? 0);
  const x = useSharedValue(animate.x?.[0] ?? 0);
  const opacity = useSharedValue(animate.opacity?.[0] ?? 1);

  useEffect(() => {
    if (!enabled) return;

    const scaleValues = animate.scale;
    if (scaleValues && Array.isArray(scaleValues) && scaleValues.length > 1) {
      const sequence = scaleValues.map((val) =>
        withTiming(val, { duration: duration / scaleValues.length })
      );
      scale.value = withRepeat(withSequence(...sequence), repeat, false);
    }

    const rotateValues = animate.rotate;
    if (rotateValues && Array.isArray(rotateValues) && rotateValues.length > 1) {
      const sequence = rotateValues.map((val) =>
        withTiming(val, { duration: duration / rotateValues.length })
      );
      rotate.value = withRepeat(withSequence(...sequence), repeat, false);
    }

    const xValues = animate.x;
    if (xValues && Array.isArray(xValues) && xValues.length > 1) {
      const sequence = xValues.map((val) =>
        withTiming(val, { duration: duration / xValues.length })
      );
      x.value = withRepeat(withSequence(...sequence), repeat, false);
    }

    const opacityValues = animate.opacity;
    if (opacityValues && Array.isArray(opacityValues) && opacityValues.length > 1) {
      const sequence = opacityValues.map((val) =>
        withTiming(val, { duration: duration / opacityValues.length })
      );
      opacity.value = withRepeat(withSequence(...sequence), repeat, false);
    }
  }, [enabled, animate, duration, repeat, scale, rotate, x, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number | string>[] = [];

    if (x.value !== 0) transforms.push({ translateX: x.value });
    if (scale.value !== 1) transforms.push({ scale: scale.value });
    if (rotate.value !== 0) transforms.push({ rotate: `${rotate.value}deg` });

    return {
      opacity: opacity.value,
      transform: transforms.length > 0 ? transforms : undefined,
    };
  }) as AnimatedStyle;

  return { animatedStyle };
}
