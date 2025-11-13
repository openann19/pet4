'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  type SharedValue,
} from '@petspark/motion';
import { useEffect, useCallback } from 'react';
import type { MessageStatus } from '@/lib/chat-types';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';

export interface UseMessageDeliveryTransitionOptions {
  status: MessageStatus;
  previousStatus?: MessageStatus;
  pulseDuration?: number;
}

export interface UseMessageDeliveryTransitionReturn {
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  colorIntensity: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  animateStatusChange: (newStatus: MessageStatus) => void;
}

const DEFAULT_PULSE_DURATION = 600;

export function useMessageDeliveryTransition(
  options: UseMessageDeliveryTransitionOptions
): UseMessageDeliveryTransitionReturn {
  const { status, previousStatus, pulseDuration = DEFAULT_PULSE_DURATION } = options;

  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const colorIntensity = useSharedValue(status === 'read' || status === 'delivered' ? 1 : 0);

  useEffect(() => {
    if (previousStatus && previousStatus !== status) {
      animateStatusChange(status);
    } else {
      if (status === 'read' || status === 'delivered') {
        colorIntensity.value = withTiming(1, timingConfigs.smooth);
      } else {
        colorIntensity.value = withTiming(0, timingConfigs.fast);
      }
    }
  }, [status, previousStatus, colorIntensity]);

  const animateStatusChange = useCallback(
    (newStatus: MessageStatus) => {
      opacity.value = withSequence(
        withTiming(0.6, { duration: pulseDuration / 3 }),
        withTiming(1, { duration: pulseDuration / 3 })
      );

      scale.value = withSequence(
        withSpring(1.3, {
          damping: 10,
          stiffness: 400,
        }),
        withSpring(1, springConfigs.bouncy)
      );

      if (newStatus === 'read' && previousStatus === 'delivered') {
        colorIntensity.value = withSequence(
          withTiming(0, { duration: 100 }),
          withDelay(50, withTiming(1, { duration: pulseDuration / 2 }))
        );
      } else if (newStatus === 'delivered') {
        colorIntensity.value = withTiming(1, timingConfigs.smooth);
      } else if (newStatus === 'read') {
        colorIntensity.value = withTiming(1, timingConfigs.smooth);
      }
    },
    [opacity, scale, colorIntensity, previousStatus, pulseDuration]
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return {
    opacity,
    scale,
    colorIntensity,
    animatedStyle,
    animateStatusChange,
  };
}
