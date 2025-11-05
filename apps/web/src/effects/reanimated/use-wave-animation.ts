/**
 * Wave Animation
 * Flowing wave effect for backgrounds and decorative elements
 */

import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';

export interface UseWaveAnimationOptions {
  amplitude?: number;
  frequency?: number;
  speed?: number;
  direction?: 'horizontal' | 'vertical';
  enabled?: boolean;
}

export function useWaveAnimation(options: UseWaveAnimationOptions = {}) {
  const {
    amplitude = 20,
    frequency = 2,
    speed = 3000,
    direction = 'horizontal',
    enabled = true,
  } = options;

  const progress = useSharedValue(0);

  useEffect(() => {
    if (enabled) {
      progress.value = withRepeat(
        withTiming(1, { duration: speed, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      progress.value = 0;
    }
  }, [enabled, speed]);

  const animatedStyle = useAnimatedStyle(() => {
    const phase = progress.value * Math.PI * 2 * frequency;
    const wave = Math.sin(phase) * amplitude;

    if (direction === 'horizontal') {
      return {
        transform: [{ translateX: wave }],
      };
    } else {
      return {
        transform: [{ translateY: wave }],
      };
    }
  });

  return {
    animatedStyle,
    progress,
  };
}

export function useMultiWave(waveCount: number = 3) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const createWaveStyle = (waveIndex: number, amplitude: number = 15) => {
    return useAnimatedStyle(() => {
      const phaseOffset = (waveIndex * Math.PI * 2) / waveCount;
      const phase = progress.value * Math.PI * 2 + phaseOffset;
      const wave = Math.sin(phase) * amplitude;
      const opacity = interpolate(progress.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);

      return {
        transform: [{ translateY: wave }, { translateX: wave * 0.5 }],
        opacity,
      };
    });
  };

  return {
    createWaveStyle,
    progress,
  };
}
