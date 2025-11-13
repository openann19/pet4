'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from '@petspark/motion';
import { useEffect } from 'react';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface UseShimmerSweepOptions {
  duration?: number;
  delay?: number;
  opacityRange?: [number, number];
}

export interface UseShimmerSweepReturn {
  x: ReturnType<typeof useSharedValue<number>>;
  opacity: ReturnType<typeof useSharedValue<number>>;
  style: AnimatedStyle;
}

export function useShimmerSweep(options: UseShimmerSweepOptions = {}): UseShimmerSweepReturn {
  const { duration = 3000, delay = 0, opacityRange = [0, 0.5] } = options;

  const x = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    x.value = withRepeat(
      withSequence(withTiming(-100, { duration: 0 }), withTiming(100, { duration })),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(opacityRange[0], { duration: delay }),
        withTiming(opacityRange[1], { duration: duration * 0.5 }),
        withTiming(opacityRange[0], { duration: duration * 0.5 })
      ),
      -1,
      false
    );
  }, [duration, delay, opacityRange, x, opacity]);

      x.value = withRepeat(
        withSequence(
          withTiming(-sweepWidth, { duration: 0 }),
          withTiming(sweepWidth, { duration, easing })
        ),
        -1,
        false
      )

      opacity.value = withRepeat(
        withSequence(
          withTiming(minOpacity, { duration: Math.max(0, delay) }),
          withTiming(maxOpacity, { duration: duration * 0.5 }),
          withTiming(minOpacity, { duration: duration * 0.5 })
        ),
        -1,
        false
      )
    }

    const stop = () => {
      cancelAnimation(x)
      cancelAnimation(opacity)
      x.value = -sweepWidth
      opacity.value = minOpacity
    }

    if (paused || sweepWidth <= 0) {
      stop()
      return stop
    }

    start()
    return stop
  }, [delay, duration, easing, maxOpacity, minOpacity, paused, width, x, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: `${x.value}%` }],
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  return {
    x,
    opacity,
    style,
  };
}
