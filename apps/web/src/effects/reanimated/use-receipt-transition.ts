'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { useEffect, useCallback } from 'react';
import type { MessageStatus } from '@/lib/chat-types';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';

export interface UseReceiptTransitionOptions {
  status: MessageStatus;
  previousStatus?: MessageStatus;
  pulseDuration?: number;
}

export interface UseReceiptTransitionReturn {
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  colorIntensity: SharedValue<number>;
  iconRotation: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  animateStatusChange: (newStatus: MessageStatus) => void;
}

const DEFAULT_PULSE_DURATION = 600;

const STATUS_COLORS = {
  sending: 'rgba(156, 163, 175, 1)',
  sent: 'rgba(156, 163, 175, 1)',
  delivered: 'rgba(96, 165, 250, 1)',
  read: 'rgba(59, 130, 246, 1)',
  failed: 'rgba(239, 68, 68, 1)',
};

export function useReceiptTransition(
  options: UseReceiptTransitionOptions
): UseReceiptTransitionReturn {
  const { status, previousStatus, pulseDuration = DEFAULT_PULSE_DURATION } = options;

  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const colorIntensity = useSharedValue(status === 'read' || status === 'delivered' ? 1 : 0);
  const iconRotation = useSharedValue(0);

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

      iconRotation.value = withSequence(
        withTiming(-10, { duration: pulseDuration / 4 }),
        withSpring(0, springConfigs.bouncy)
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
      } else if (newStatus === 'sent' || newStatus === 'sending') {
        colorIntensity.value = withTiming(0, timingConfigs.fast);
      }
    },
    [opacity, scale, colorIntensity, iconRotation, previousStatus, pulseDuration]
  );

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
  }, [status, previousStatus, colorIntensity, animateStatusChange]);

  const animatedStyle = useAnimatedStyle(() => {
    const baseColor = STATUS_COLORS.sent;
    const targetColor = STATUS_COLORS[status] ?? STATUS_COLORS.sending;

    const r = interpolate(
      colorIntensity.value,
      [0, 1],
      [
        parseInt(/rgba?\((\d+)/.exec(baseColor)?.[1] ?? '156', 10),
        parseInt(/rgba?\((\d+)/.exec(targetColor)?.[1] ?? '156', 10),
      ],
      Extrapolation.CLAMP
    );
    const g = interpolate(
      colorIntensity.value,
      [0, 1],
      [
        parseInt(/rgba?\(\d+, (\d+)/.exec(baseColor)?.[1] ?? '163', 10),
        parseInt(/rgba?\(\d+, (\d+)/.exec(targetColor)?.[1] ?? '163', 10),
      ],
      Extrapolation.CLAMP
    );
    const b = interpolate(
      colorIntensity.value,
      [0, 1],
      [
        parseInt(/rgba?\(\d+, \d+, (\d+)/.exec(baseColor)?.[1] ?? '175', 10),
        parseInt(/rgba?\(\d+, \d+, (\d+)/.exec(targetColor)?.[1] ?? '175', 10),
      ],
      Extrapolation.CLAMP
    );

    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }, { rotate: `${iconRotation.value}deg` }],
      color: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
    };
  });

  return {
    opacity,
    scale,
    colorIntensity,
    iconRotation,
    animatedStyle,
    animateStatusChange,
  };
}
