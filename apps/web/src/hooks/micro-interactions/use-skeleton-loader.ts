/**
 * Skeleton Screen Loader Hook (Web)
 *
 * Provides premium skeleton loading animations with:
 * - Shimmer wave effect
 * - Pulse animation
 * - Configurable shapes and sizes
 * - Staggered reveal
 * - Reduced motion support
 *
 * Location: apps/web/src/hooks/micro-interactions/use-skeleton-loader.ts
 */

import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  type SharedValue,
} from '@petspark/motion';
import { useReducedMotionSV } from '@/effects/chat/core/reduced-motion';
import { useUIConfig } from '@/hooks/use-ui-config';

/**
 * Skeleton shape type
 */
export type SkeletonShape = 'rectangle' | 'circle' | 'text' | 'avatar';

/**
 * Skeleton loader options
 */
export interface UseSkeletonLoaderOptions {
  readonly enabled?: boolean;
  readonly shape?: SkeletonShape;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly shimmerSpeed?: number; // ms per cycle
  readonly pulseSpeed?: number; // ms per cycle
  readonly staggerDelay?: number; // ms
  readonly index?: number; // For staggered animations
}

/**
 * Skeleton loader return type
 */
export interface UseSkeletonLoaderReturn {
  readonly shimmerPosition: SharedValue<number>;
  readonly pulseOpacity: SharedValue<number>;
  readonly revealScale: SharedValue<number>;
  readonly animatedStyle: ReturnType<typeof useAnimatedStyle>;
}

const DEFAULT_ENABLED = true;
const DEFAULT_SHIMMER_SPEED = 1500; // ms
const DEFAULT_PULSE_SPEED = 1000; // ms
const DEFAULT_STAGGER_DELAY = 100; // ms
const SHIMMER_GRADIENT_WIDTH = 200; // %

export function useSkeletonLoader(options: UseSkeletonLoaderOptions = {}): UseSkeletonLoaderReturn {
  const {
    enabled = DEFAULT_ENABLED,
    shape: _shape = 'rectangle',
    shimmerSpeed = DEFAULT_SHIMMER_SPEED,
    pulseSpeed = DEFAULT_PULSE_SPEED,
    staggerDelay = DEFAULT_STAGGER_DELAY,
    index = 0,
  } = options;

  const { visual: _visual } = useUIConfig();
  const reducedMotion = useReducedMotionSV();

  // Animation values
  const shimmerPosition = useSharedValue(-SHIMMER_GRADIENT_WIDTH);
  const pulseOpacity = useSharedValue(0.5);
  const revealScale = useSharedValue(0.95);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const isReducedMotion = reducedMotion.value;
    const delay = index * staggerDelay;

    // Shimmer animation (sweeping gradient)
    if (!isReducedMotion) {
      shimmerPosition.value = withDelay(
        delay,
        withRepeat(
          withTiming(100, {
            duration: shimmerSpeed,
            easing: Easing.linear,
          }),
          -1, // Infinite
          false
        )
      );
    } else {
      // Reduced motion: just pulse
      shimmerPosition.value = 0;
    }

    // Pulse animation
    if (!isReducedMotion) {
      pulseOpacity.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration: pulseSpeed / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          -1, // Infinite
          true // Reverse
        )
      );
    } else {
      pulseOpacity.value = 0.7;
    }

    // Reveal scale (staggered entry)
    revealScale.value = withDelay(
      delay,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      })
    );
  }, [
    enabled,
    shimmerSpeed,
    pulseSpeed,
    staggerDelay,
    index,
    shimmerPosition,
    pulseOpacity,
    revealScale,
    reducedMotion,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: revealScale.value }],
      opacity: pulseOpacity.value,
    };
  });

  return {
    shimmerPosition,
    pulseOpacity,
    revealScale,
    animatedStyle,
  };
}
