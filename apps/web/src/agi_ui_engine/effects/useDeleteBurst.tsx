'use client';

import { useCallback } from 'react';
import {
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
  type AnimatedStyle,
} from '@petspark/motion';

import { useUIConfig } from '@/hooks/use-ui-config';

export interface UseDeleteBurstOptions {
  enabled?: boolean;
  onFinish?: () => void;
}

export interface UseDeleteBurstReturn {
  animatedStyle: AnimatedStyle;
  trigger: () => void;
  opacity: ReturnType<typeof useSharedValue<number>>;
  scale: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Delete burst animation with particle explosion
 *
 * Creates a burst effect when deleting messages
 *
 * @example
 * ```tsx
 * const { animatedStyle, trigger } = useDeleteBurst({ onFinish: handleDelete })
 * return <AnimatedView style={animatedStyle}>{content}</AnimatedView>
 * ```
 */
export function useDeleteBurst(options: UseDeleteBurstOptions = {}): UseDeleteBurstReturn {
  const { enabled = true, onFinish } = options;
  const { animation } = useUIConfig();

  const opacity = useSharedValue<number>(1);
  const scale = useSharedValue<number>(1);

  const trigger = useCallback(() => {
    if (!enabled || !animation.showParticles) {
      return;
    }

    opacity.value = withSequence(
      withTiming(0.5, {
        duration: 100,
        easing: Easing.out(Easing.ease),
      }),
      withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.ease),
      })
    );

    scale.value = withSequence(
      withTiming(1.1, {
        duration: 100,
        easing: Easing.out(Easing.ease),
      }),
      withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.ease),
      })
    );

    setTimeout(() => {
      onFinish?.();
    }, 400);
  }, [enabled, animation.showParticles, opacity, scale, onFinish]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return {};
    }

    return {
      opacity: opacity.value,
      transform: [
        {
          scale: scale.value,
        },
      ],
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    trigger,
    opacity,
    scale,
  };
}
