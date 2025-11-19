'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  runOnUI,
  runOnJS,
  type SharedValue,
  type AnimatedStyle,
} from '@petspark/motion';
import { useCallback } from 'react';
import { timingConfigs, type TimingConfig } from '@/effects/reanimated/transitions';
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

  const opacity = useSharedValue<number>(1);
  const scale = useSharedValue<number>(1);
  const translateY = useSharedValue<number>(0);
  const translateX = useSharedValue<number>(0);
  const height = useSharedValue<number>(60);
  const rotation = useSharedValue<number>(0);

  // Extract completion callback to reduce nesting
  const handleAnimationComplete = useCallback(() => {
    if (onFinish) {
      runOnJS(onFinish)();
    }
  }, [onFinish]);

  const triggerDelete = useCallback(() => {
    if (hapticFeedback) {
      haptics.impact(context === 'admin-delete' ? 'heavy' : 'medium');
    }

    runOnUI(() => {
      switch (context) {
        case 'self-delete': {
          const easingFunc = timingConfigs.smooth.easing;
          const timingConfig1: TimingConfig = {
            duration: duration * 0.1,
            ...(easingFunc !== undefined ? { easing: easingFunc } : {}),
          };
          const timingConfig2: TimingConfig = {
            duration: duration * 0.9,
            ...(easingFunc !== undefined ? { easing: easingFunc } : {}),
          };
          const timingConfig3: TimingConfig = {
            duration,
            ...(easingFunc !== undefined ? { easing: easingFunc } : {}),
          };
          scale.value = withSequence(withTiming(1.1, timingConfig1), withTiming(0, timingConfig2));
          translateY.value = withTiming(-40, timingConfig3);
          opacity.value = withTiming(0, timingConfig3);
          height.value = withTiming(0, { duration });
          runOnJS(handleAnimationComplete)();
          break;
        }

        case 'admin-delete': {
          scale.value = withSequence(
            withTiming(1.15, { duration: duration * 0.2 }),
            withTiming(0.8, { duration: duration * 0.3 }),
            withTiming(0, { duration: duration * 0.5 })
          );
          translateX.value = withSequence(
            withTiming(10, { duration: duration * 0.2 }),
            withTiming(-10, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.6 })
          );
          translateY.value = withTiming(0, { duration: duration * 0.5 });
          opacity.value = withSequence(
            withTiming(0.7, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.8 })
          );
          height.value = withTiming(0, { duration });
          rotation.value = withSequence(
            withTiming(5, { duration: duration * 0.2 }),
            withTiming(-5, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.6 })
          );
          runOnJS(handleAnimationComplete)();
          break;
        }

        case 'emoji-media': {
          scale.value = withSequence(
            withTiming(1.2, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.8 })
          );
          opacity.value = withSequence(
            withTiming(0.8, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.8 })
          );
          height.value = withTiming(0, { duration });
          runOnJS(handleAnimationComplete)();
          rotation.value = withTiming(Math.random() > 0.5 ? 15 : -15, { duration });
          break;
        }

        case 'group-chat': {
          scale.value = withTiming(0.95, { duration: duration * 0.3 });
          opacity.value = withSequence(
            withTiming(0.5, { duration: duration * 0.3 }),
            withTiming(0, { duration: duration * 0.7 })
          );
          height.value = withTiming(0, { duration });
          runOnJS(handleAnimationComplete)();
          break;
        }

        default: {
          scale.value = withTiming(0, { duration });
          opacity.value = withTiming(0, { duration });
          height.value = withTiming(0, { duration });
          runOnJS(handleAnimationComplete)();
        }
      }
    })();
  }, [
    context,
    duration,
    hapticFeedback,
    handleAnimationComplete,
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
    const scaleVal = scale.value;
    const translateYVal = translateY.value;
    const translateXVal = translateX.value;
    const rotateVal = `${rotation.value}deg`;
    
    return {
      opacity: opacity.value,
      transform: [
        { scale: scaleVal, translateY: translateYVal, translateX: translateXVal, rotate: rotateVal },
      ],
      height: height.value,
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
