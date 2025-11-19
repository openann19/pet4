'use client';

import { useEffect } from 'react';
import { useSharedValue, usewithTiming, Easing   type AnimatedStyle,
} from '@petspark/motion';

import { useUIConfig } from '@/hooks/use-ui-config';

export interface UseGlassBackgroundOptions {
  enabled?: boolean;
  intensity?: number;
}

export interface UseGlassBackgroundReturn {
  animatedStyle: AnimatedStyle;
  blurIntensity: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Glassmorphism background effect
 *
 * Creates a glass-like background with blur and transparency
 *
 * @example
 * ```tsx
 * const { animatedStyle } = useGlassBackground({ intensity: 0.8 })
 * return <AnimatedView style={animatedStyle}>{content}</AnimatedView>
 * ```
 */
export function useGlassBackground(
  options: UseGlassBackgroundOptions = {}
): UseGlassBackgroundReturn {
  const { enabled = true, intensity = 0.8 } = options;
  const { visual } = useUIConfig();

  const blurIntensity = useSharedValue<number>(0);

  useEffect(() => {
    if (!enabled || !visual.enableBlur) {
      return;
    }

    blurIntensity.value = withTiming(intensity, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
  }, [enabled, visual.enableBlur, blurIntensity, intensity]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !visual.enableBlur) {
      return {};
    }

    return {
      backdropFilter: `blur(${String(blurIntensity.value * 20)}px)`,
      WebkitBackdropFilter: `blur(${String(blurIntensity.value * 20)}px)`,
      backgroundColor: `rgba(255, 255, 255, ${String(0.1 * blurIntensity.value)})`,
      borderWidth: 1,
      borderColor: `rgba(255, 255, 255, ${0.2 * blurIntensity.value})`,
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    blurIntensity,
  };
}
