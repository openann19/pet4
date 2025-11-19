import { useEffect } from 'react';
import { useSharedValue, withSpring, withTiming, type AnimatedStyle } from '@petspark/motion';

import type { Step } from '../create-pet-types';

export function useStepAnimations(currentStep: Step) {
  const stepOpacity = useSharedValue<number>(1);
  const stepX = useSharedValue<number>(0);
  const progressWidth = useSharedValue<number>(0);

  useEffect(() => {
    stepOpacity.value = withSpring(0, { damping: 20, stiffness: 300 });
    stepX.value = withSpring(-20, { damping: 20, stiffness: 300 });

    const timeoutId = setTimeout(() => {
      stepOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
      stepX.value = withSpring(0, { damping: 20, stiffness: 300 });
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentStep, stepOpacity, stepX]);

  useEffect(() => {
    const steps: Step[] = [
      'type',
      'basics',
      'characteristics',
      'photo',
      'personality',
      'preferences',
      'complete',
    ];
    const progress = ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
    progressWidth.value = withTiming(progress, { duration: 300 });
  }, [currentStep, progressWidth]);

  const stepStyle = useAnimatedStyle(() => ({
    opacity: stepOpacity.value,
    transform: [{ translateX: stepX.value }],
  })) as AnimatedStyle;

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  })) as AnimatedStyle;

  return { stepStyle, progressStyle };
}

