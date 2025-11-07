/**
 * Animated Glow Border
 * Pulsating glow effect with customizable colors and intensity
 */

import { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, interpolate, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';
import { isTruthy, isDefined } from '@/core/guards';

export interface UseGlowBorderOptions {
  color?: string;
  intensity?: number;
  speed?: number;
  enabled?: boolean;
  pulseSize?: number;
}

export function useGlowBorder(options: UseGlowBorderOptions = {}) {
  const {
    color = 'rgba(99, 102, 241, 0.8)',
    intensity = 20,
    speed = 2000,
    enabled = true,
    pulseSize = 8,
  } = options;

  const progress = useSharedValue(0);

  useEffect(() => {
    if (isTruthy(enabled)) {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: speed, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: speed, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      progress.value = 0;
    }
  }, [enabled, speed]);

  const animatedStyle = useAnimatedStyle(() => {
    const glowIntensity = interpolate(progress.value, [0, 0.5, 1], [0, intensity, 0]);
    
    const shadowOpacity = interpolate(progress.value, [0, 0.5, 1], [0.3, 0.8, 0.3]);

    return {
      boxShadow: `0 0 ${String(glowIntensity ?? '')}px ${String(pulseSize ?? '')}px ${String(color ?? '')}, 0 0 ${String(glowIntensity * 0.5 ?? '')}px ${String(pulseSize * 0.5 ?? '')}px ${String(color ?? '')} inset`,
      filter: `drop-shadow(0 0 ${String(glowIntensity * 0.5 ?? '')}px ${String(color ?? '')})`,
      opacity: shadowOpacity,
    };
  });

  return {
    animatedStyle,
    progress,
  };
}
