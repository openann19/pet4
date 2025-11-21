import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from '@petspark/motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle, MotionValue } from '@petspark/motion';

export function useReactionsPickerAnimations(showReactions: boolean) {
  const reactionsPickerOpacity = useSharedValue(0);
  const reactionsPickerScale = useSharedValue(0.9);
  const reactionsPickerTranslateY = useSharedValue(10);

  useEffect(() => {
    if (showReactions) {
      reactionsPickerOpacity.value = withSpring(1, springConfigs.smooth);
      reactionsPickerScale.value = withSpring(1, springConfigs.bouncy);
      reactionsPickerTranslateY.value = withSpring(0, springConfigs.smooth);
    } else {
      reactionsPickerOpacity.value = withTiming(0, timingConfigs.fast);
      reactionsPickerScale.value = withTiming(0.9, timingConfigs.fast);
      reactionsPickerTranslateY.value = withTiming(10, timingConfigs.fast);
    }
  }, [showReactions, reactionsPickerOpacity, reactionsPickerScale, reactionsPickerTranslateY]);

  const reactionsPickerStyle = useAnimatedStyle(() => {
    const transforms: Record<
      string,
      number | string | MotionValue<number> | MotionValue<string>
    >[] = [{ scale: reactionsPickerScale.value }, { translateY: reactionsPickerTranslateY.value }];

    return {
      opacity: reactionsPickerOpacity.value,
      transform: transforms,
    };
  }) as AnimatedStyle;

  return { reactionsPickerStyle };
}
