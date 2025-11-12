'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  type SharedValue,
} from 'react-native-reanimated';
import { useEffect, useCallback } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';

export type BubbleDirection = 'incoming' | 'outgoing';

export interface UseBubbleEntryOptions {
  index?: number;
  staggerDelay?: number;
  direction?: BubbleDirection;
  enabled?: boolean;
  isNew?: boolean;
}

// Legacy compatibility interface
export interface UseBubbleEntryReturn {
  opacity: SharedValue<number>;
  translateY: SharedValue<number>;
  translateX: SharedValue<number>;
  scale: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  trigger: () => void;
}

const DEFAULT_INDEX = 0;
const DEFAULT_STAGGER_DELAY = 40;
const DEFAULT_DIRECTION: BubbleDirection = 'outgoing';
const DEFAULT_ENABLED = true;
const DEFAULT_IS_NEW = true;

export function useBubbleEntry(options: UseBubbleEntryOptions = {}): UseBubbleEntryReturn {
  const {
    index = DEFAULT_INDEX,
    staggerDelay = DEFAULT_STAGGER_DELAY,
    direction = DEFAULT_DIRECTION,
    enabled = DEFAULT_ENABLED,
    isNew = DEFAULT_IS_NEW,
  } = options;

  const opacity = useSharedValue(isNew && enabled ? 0 : 1);
  const translateY = useSharedValue(isNew && enabled ? 20 : 0);
  const translateX = useSharedValue(isNew && enabled ? (direction === 'incoming' ? -30 : 30) : 0);
  const scale = useSharedValue(isNew && enabled ? 0.95 : 1);

  const trigger = useCallback(() => {
    if (!enabled || !isNew) {
      return;
    }

    const delay = index * staggerDelay;

    opacity.value = withDelay(delay, withSpring(1, springConfigs.smooth));

    translateY.value = withDelay(delay, withSpring(0, springConfigs.smooth));

    if (direction === 'incoming') {
      translateX.value = withDelay(
        delay,
        withSpring(0, {
          damping: 25,
          stiffness: 400,
          mass: 0.8,
        })
      );
      scale.value = withDelay(
        delay,
        withSpring(1, {
          damping: 20,
          stiffness: 500,
          mass: 0.9,
        })
      );
    } else {
      translateX.value = withDelay(delay, withSpring(0, springConfigs.smooth));
      scale.value = withDelay(delay, withSpring(1, springConfigs.bouncy));
    }
  }, [enabled, isNew, index, staggerDelay, direction, opacity, translateY, translateX, scale]);

  useEffect(() => {
    if (enabled && isNew) {
      trigger();
    }
  }, [enabled, isNew, trigger]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    };
  });

  return {
    opacity,
    translateY,
    translateX,
    scale,
    animatedStyle,
    trigger,
  };
}
