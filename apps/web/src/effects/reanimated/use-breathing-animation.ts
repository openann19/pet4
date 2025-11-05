/**
 * Breathing Animation
 * Gentle, organic breathing effect for ambient UI elements
 */

import { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, interpolate, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';

export interface UseBreathingAnimationOptions {
  minScale?: number;
  maxScale?: number;
  duration?: number;
  enabled?: boolean;
  easing?: 'ease' | 'sine' | 'cubic';
}

export function useBreathingAnimation(options: UseBreathingAnimationOptions = {}) {
  const {
    minScale = 0.98,
    maxScale = 1.02,
    duration = 3000,
    enabled = true,
    easing = 'sine',
  } = options;

  const progress = useSharedValue(0);

  const easingFunction = {
    ease: Easing.inOut(Easing.ease),
    sine: Easing.inOut(Easing.sin),
    cubic: Easing.inOut(Easing.cubic),
  }[easing];

  useEffect(() => {
    if (enabled) {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration, easing: easingFunction }),
          withTiming(0, { duration, easing: easingFunction })
        ),
        -1,
        false
      );
    } else {
      progress.value = withTiming(0, { duration: 300 });
    }
  }, [enabled, duration, easingFunction]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.5, 1], [minScale, maxScale, minScale]);
    
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0.95, 1, 0.95]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return {
    animatedStyle,
    progress,
  };
}
