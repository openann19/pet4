'use client';

import { useSharedValue, animate, type AnimatedStyle } from '@petspark/motion';
import { useEffect } from 'react';


export interface UsePageTransitionOptions {
  isVisible: boolean;
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'fade';
}

export interface UsePageTransitionReturn {
  opacity: ReturnType<typeof useSharedValue<number>>;
  translateY: ReturnType<typeof useSharedValue<number>>;
  scale: ReturnType<typeof useSharedValue<number>>;
  style: AnimatedStyle;
}

export function usePageTransition(options: UsePageTransitionOptions): UsePageTransitionReturn {
  const { isVisible, duration = 300, delay = 0, direction = 'up' } = options;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(direction === 'up' ? 30 : direction === 'down' ? -30 : 0);
  const scale = useSharedValue(0.98);

  useEffect(() => {
    if (isVisible) {
      const delaySeconds = delay;
      const durationSeconds = duration / 1000;
      animate(opacity, 1, {
        delay: delaySeconds,
        duration: durationSeconds,
      });
      animate(translateY, 0, {
        delay: delaySeconds,
        duration: durationSeconds,
      });
      animate(scale, 1, {
        delay: delaySeconds,
        duration: durationSeconds,
      });
    } else {
      const durationSeconds = duration / 1000;
      animate(opacity, 0, {
        duration: durationSeconds,
      });
      animate(translateY, direction === 'up' ? -30 : 30, {
        duration: durationSeconds,
      });
      animate(scale, 0.98, {
        duration: durationSeconds,
      });
    }
  }, [isVisible, duration, delay, direction, opacity, translateY, scale]);

  const style = useAnimatedStyle(() => {
    return {
      opacity: opacity.get(),
      transform: [{ translateY: translateY.get() }, { scale: scale.get() }],
    };
  }) as AnimatedStyle;

  return {
    opacity,
    translateY,
    scale,
    style,
  };
}
