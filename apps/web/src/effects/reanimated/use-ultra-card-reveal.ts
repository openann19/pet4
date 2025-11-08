/**
 * Ultra Card Reveal Animation
 * Advanced card reveal with 3D transforms, staggered content, and particle effects
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export interface UseUltraCardRevealOptions {
  delay?: number;
  duration?: number;
  enabled?: boolean;
  index?: number;
  perspective?: number;
  rotationIntensity?: number;
}

export function useUltraCardReveal(options: UseUltraCardRevealOptions = {}) {
  const {
    delay = 0,
    duration = 800,
    enabled = true,
    index = 0,
    perspective = 1000,
    rotationIntensity = 15,
  } = options;

  const progress = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const rotateX = useSharedValue(rotationIntensity);
  const rotateY = useSharedValue(-rotationIntensity);
  const translateZ = useSharedValue(-100);

  useEffect(() => {
    if (enabled) {
      const staggerDelay = delay + index * 100;

      progress.value = withDelay(
        staggerDelay,
        withSpring(1, {
          damping: 20,
          stiffness: 90,
          mass: 1,
        })
      );

      scale.value = withDelay(
        staggerDelay,
        withSequence(
          withSpring(1.1, { damping: 15, stiffness: 100 }),
          withSpring(1, { damping: 20, stiffness: 120 })
        )
      );

      rotateX.value = withDelay(staggerDelay, withSpring(0, { damping: 25, stiffness: 80 }));

      rotateY.value = withDelay(staggerDelay, withSpring(0, { damping: 25, stiffness: 80 }));

      translateZ.value = withDelay(staggerDelay, withSpring(0, { damping: 20, stiffness: 100 }));
    }
  }, [enabled, delay, index, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.3, 1], [0, 0.6, 1]);

    return {
      opacity,
      transform: [
        { perspective },
        { scale: scale.value },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
        { translateZ: translateZ.value },
      ],
    };
  });

  return {
    animatedStyle,
    progress,
  };
}
