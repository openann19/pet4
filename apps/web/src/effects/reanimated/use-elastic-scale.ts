/**
 * Elastic Scale Animation
 * Bouncy, elastic scale effect with overshoot for delightful interactions
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  type AnimatedStyle,
} from '@petspark/motion';
import { useCallback } from 'react';

export interface UseElasticScaleOptions {
  scaleUp?: number;
  scaleDown?: number;
  damping?: number;
  stiffness?: number;
  mass?: number;
}

export function useElasticScale(options: UseElasticScaleOptions = {}) {
  const { scaleUp = 1.15, scaleDown = 0.95, damping = 12, stiffness = 200, mass = 0.8 } = options;

  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(scaleDown, {
      damping,
      stiffness: stiffness * 1.5,
      mass: mass * 0.8,
    });
  }, [scaleDown, damping, stiffness, mass]);

  const handlePressOut = useCallback(() => {
    scale.value = withSequence(
      withSpring(scaleUp, {
        damping: damping * 0.6,
        stiffness: stiffness * 1.2,
        mass,
      }),
      withSpring(1, {
        damping,
        stiffness,
        mass,
      })
    );
  }, [scaleUp, damping, stiffness, mass]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
  };
}
