'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
  type SharedValue,
} from '@petspark/motion';
import { useCallback } from 'react';
import { haptics } from '@/lib/haptics';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';

export interface UseReactionAnimationOptions {
  hapticFeedback?: boolean;
}

export interface UseReactionAnimationReturn {
  scale: SharedValue<number>;
  translateY: SharedValue<number>;
  opacity: SharedValue<number>;
  rotation: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  animate: (emoji: string) => void;
  reset: () => void;
}

export function useReactionAnimation(
  options: UseReactionAnimationOptions = {}
): UseReactionAnimationReturn {
  const { hapticFeedback = true } = options;

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Record<string, string | number>[] = [];
    
    const scaleValue = scale.get();
    if (scaleValue !== 1) transforms.push({ scale: scaleValue });
    
    const translateYValue = translateY.get();
    if (translateYValue !== 0) transforms.push({ translateY: translateYValue });
    
    const rotationValue = rotation.get();
    if (rotationValue !== 0) transforms.push({ rotate: `${rotationValue as number}deg` });

    return {
      transform: transforms,
      opacity: opacity.get(),
    };
  });

  const animate = useCallback(
    (_emoji: string) => {
      if (hapticFeedback) {
        haptics.selection();
      }

      scale.value = 0;
      translateY.value = 0;
      opacity.value = 1;
      rotation.value = -15;

      scale.value = withSequence(
        withSpring(1.5, {
          damping: 10,
          stiffness: 400,
        }),
        withSpring(1.2, springConfigs.bouncy)
      );

      translateY.value = withTiming(-30, {
        duration: 800,
      });

      rotation.value = withSequence(
        withSpring(15, {
          damping: 12,
          stiffness: 350,
        }),
        withSpring(0, springConfigs.smooth)
      );

      opacity.value = withSequence(
        withTiming(1, timingConfigs.fast),
        withDelay(400, withTiming(0, timingConfigs.smooth))
      );
    },
    [scale, translateY, opacity, rotation, hapticFeedback]
  );

  const reset = useCallback(() => {
    scale.value = withTiming(1, timingConfigs.fast);
    translateY.value = withTiming(0, timingConfigs.fast);
    opacity.value = withTiming(0, timingConfigs.fast);
    rotation.value = withTiming(0, timingConfigs.fast);
  }, [scale, translateY, opacity, rotation]);

  return {
    scale,
    translateY,
    opacity,
    rotation,
    animatedStyle,
    animate,
    reset,
  };
}
