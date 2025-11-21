'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  animateWithTiming,
  runOnUI,
  type SharedValue,
} from '@petspark/motion';
import { useCallback } from 'react';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';

export type DeleteAnimationContext = 'self-delete' | 'admin-delete' | 'emoji-media' | 'group-chat';

export interface UseDeleteBubbleAnimationOptions {
  onFinish?: () => void;
  context?: DeleteAnimationContext;
  hapticFeedback?: boolean;
  duration?: number;
}

export interface UseDeleteBubbleAnimationReturn {
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  translateY: SharedValue<number>;
  translateX: SharedValue<number>;
  height: SharedValue<number>;
  rotation: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  triggerDelete: () => void;
  reset: () => void;
}

const DEFAULT_DURATION = 300;
const DEFAULT_HAPTIC_FEEDBACK = true;

export function useDeleteBubbleAnimation(
  options: UseDeleteBubbleAnimationOptions = {}
): UseDeleteBubbleAnimationReturn {
  const {
    onFinish,
    context = 'self-delete',
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    duration = DEFAULT_DURATION,
  } = options;

  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const height = useSharedValue(60);
  const rotation = useSharedValue(0);

  const triggerDelete = useCallback(() => {
    if (hapticFeedback) {
      haptics.impact(context === 'admin-delete' ? 'heavy' : 'medium');
    }

    runOnUI(() => {
      switch (context) {
        case 'self-delete': {
          scale.value = withSequence(
            withSpring(1.1, springConfigs.snappy),
            withTiming(0, { ...timingConfigs.smooth, duration })
          );
          translateY.value = withTiming(-40, {
            ...timingConfigs.smooth,
            duration,
          });
          opacity.value = withTiming(0, {
            ...timingConfigs.smooth,
            duration,
          });
          void animateWithTiming(height, 0, { duration }).then(() => {
            if (onFinish) {
              onFinish();
            }
          });
          break;
        }

        case 'admin-delete': {
          scale.value = withSequence(
            withSpring(1.15, { ...springConfigs.bouncy, damping: 12 }),
            withTiming(0.8, { duration: duration * 0.3 }),
            withTiming(0, { duration: duration * 0.7 })
          );
          translateX.value = withSequence(
            withSpring(10, springConfigs.bouncy),
            withSpring(-10, springConfigs.bouncy),
            withTiming(0, { duration: duration * 0.5 })
          );
          translateY.value = withTiming(0, { duration: duration * 0.5 });
          opacity.value = withSequence(
            withTiming(0.7, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.8 })
          );
          void animateWithTiming(height, 0, { duration }).then(() => {
            if (onFinish) {
              onFinish();
            }
          });
          rotation.value = withSequence(
            withSpring(5, springConfigs.bouncy),
            withSpring(-5, springConfigs.bouncy),
            withTiming(0, { duration: duration * 0.5 })
          );
          break;
        }

        case 'emoji-media': {
          scale.value = withSequence(
            withSpring(1.2, springConfigs.bouncy),
            withTiming(0, { duration: duration * 0.6 })
          );
          opacity.value = withSequence(
            withTiming(0.8, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.8 })
          );
          void animateWithTiming(height, 0, { duration }).then(() => {
            if (onFinish) {
              onFinish();
            }
          });
          rotation.value = withTiming(Math.random() > 0.5 ? 15 : -15, { duration });
          break;
        }

        case 'group-chat': {
          scale.value = withTiming(0.95, { duration: duration * 0.3 });
          opacity.value = withSequence(
            withTiming(0.5, { duration: duration * 0.3 }),
            withTiming(0, { duration: duration * 0.7 })
          );
          void animateWithTiming(height, 0, { duration }).then(() => {
            if (onFinish) {
              onFinish();
            }
          });
          break;
        }

        default: {
          scale.value = withTiming(0, { duration });
          opacity.value = withTiming(0, { duration });
          void animateWithTiming(height, 0, { duration }).then(() => {
            if (onFinish) {
              onFinish();
            }
          });
        }
      }
    })();
  }, [
    context,
    duration,
    hapticFeedback,
    onFinish,
    opacity,
    scale,
    translateY,
    translateX,
    height,
    rotation,
  ]);

  const reset = useCallback(() => {
    runOnUI(() => {
      opacity.value = 1;
      scale.value = 1;
      translateY.value = 0;
      translateX.value = 0;
      height.value = 60;
      rotation.value = 0;
    })();
  }, [opacity, scale, translateY, translateX, height, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Record<string, string | number>[] = [];
    
    const scaleValue = scale.get();
    if (scaleValue !== 1) transforms.push({ scale: scaleValue });
    
    const translateYValue = translateY.get();
    if (translateYValue !== 0) transforms.push({ translateY: translateYValue });
    
    const translateXValue = translateX.get();
    if (translateXValue !== 0) transforms.push({ translateX: translateXValue });
    
    const rotationValue = rotation.get();
    if (rotationValue !== 0) transforms.push({ rotate: `${rotationValue}deg` });

    return {
      opacity: opacity.get(),
      transform: transforms,
      height: height.get(),
      overflow: 'hidden' as const,
    };
  });

  return {
    opacity,
    scale,
    translateY,
    translateX,
    height,
    rotation,
    animatedStyle,
    triggerDelete,
    reset,
  };
}
