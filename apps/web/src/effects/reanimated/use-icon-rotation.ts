'use client';

import { useSharedValue, usewithTiming } from '@petspark/motion';
import { useEffect } from 'react';
import type  from '@petspark/motion';

export interface UseIconRotationOptions {
  enabled?: boolean;
  targetRotation?: number;
  duration?: number;
  enablePulse?: boolean;
}

export interface UseIconRotationReturn {
  rotation: ReturnType<typeof useSharedValue<number>>;
  style: AnimatedStyle;
}

export function useIconRotation(options: UseIconRotationOptions = {}): UseIconRotationReturn {
  const { enabled = false, targetRotation = 360, duration = 500, enablePulse = false } = options;

  const rotationValue = useSharedValue(0);

  useEffect(() => {
    if (enabled) {
      rotationValue.value = withTiming(targetRotation, { duration });
    } else {
      rotationValue.value = withTiming(0, { duration });
    }
  }, [enabled, duration, targetRotation, rotationValue, enablePulse]);

  const style = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotationValue.value}deg` }],
    };
  }) as AnimatedStyle;

  return {
    rotation: rotationValue,
    style,
  };
}
