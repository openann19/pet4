'use client';

import { useEffect, useState, useRef } from 'react';
import {
  useSharedValue,
  withTiming,
  withSpring,
  type SharedValue,
  type AnimatedStyle,
} from '@petspark/motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';


export interface UseAnimatePresenceOptions {
  isVisible: boolean;
  initial?: boolean;
  exitDuration?: number;
  enterDuration?: number;
  exitTransition?: 'fade' | 'scale' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';
  enterTransition?: 'fade' | 'scale' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';
  onExitComplete?: () => void;
  enabled?: boolean;
}

export interface UseAnimatePresenceReturn {
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  shouldRender: boolean;
}

export function useAnimatePresence(options: UseAnimatePresenceOptions): UseAnimatePresenceReturn {
  const {
    isVisible,
    initial = false,
    exitDuration = timingConfigs.fast.duration ?? 150,
    enterDuration = timingConfigs.smooth.duration ?? 300,
    exitTransition = 'fade',
    enterTransition = 'fade',
    onExitComplete,
    enabled = true,
  } = options;

  const opacity = useSharedValue(initial && isVisible ? 1 : 0);
  const scale = useSharedValue(initial && isVisible ? 1 : 0.95);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(initial && isVisible ? 0 : -20);
  const [shouldRender, setShouldRender] = useState(initial && isVisible);
  const exitTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setShouldRender(isVisible);
      return;
    }

    if (isVisible) {
      setShouldRender(true);

      const enterConfig = {
        duration: enterDuration,
        easing: timingConfigs.smooth.easing,
      };

      switch (enterTransition) {
        case 'fade':
          opacity.value = withTiming(1, enterConfig);
          scale.value = withSpring(1, springConfigs.smooth);
          translateY.value = withSpring(0, springConfigs.smooth);
          break;
        case 'scale':
          opacity.value = withTiming(1, enterConfig);
          scale.value = withSpring(1, springConfigs.bouncy);
          translateY.value = withSpring(0, springConfigs.smooth);
          break;
        case 'slideUp':
          opacity.value = withTiming(1, enterConfig);
          scale.value = withSpring(1, springConfigs.smooth);
          translateY.value = withSpring(0, springConfigs.smooth);
          translateX.value = withSpring(0, springConfigs.smooth);
          break;
        case 'slideDown':
          opacity.value = withTiming(1, enterConfig);
          scale.value = withSpring(1, springConfigs.smooth);
          translateY.value = withSpring(0, springConfigs.smooth);
          translateX.value = withSpring(0, springConfigs.smooth);
          break;
        case 'slideLeft':
          opacity.value = withTiming(1, enterConfig);
          scale.value = withSpring(1, springConfigs.smooth);
          translateX.value = withSpring(0, springConfigs.smooth);
          translateY.value = withSpring(0, springConfigs.smooth);
          break;
        case 'slideRight':
          opacity.value = withTiming(1, enterConfig);
          scale.value = withSpring(1, springConfigs.smooth);
          translateX.value = withSpring(0, springConfigs.smooth);
          translateY.value = withSpring(0, springConfigs.smooth);
          break;
      }
    } else {
      const exitConfig = {
        duration: exitDuration,
        easing: timingConfigs.fast.easing,
      };

      switch (exitTransition) {
        case 'fade':
          opacity.value = withTiming(0, exitConfig);
          scale.value = withTiming(0.95, exitConfig);
          break;
        case 'scale':
          opacity.value = withTiming(0, exitConfig);
          scale.value = withTiming(0.8, exitConfig);
          break;
        case 'slideUp':
          opacity.value = withTiming(0, exitConfig);
          translateY.value = withTiming(-20, exitConfig);
          break;
        case 'slideDown':
          opacity.value = withTiming(0, exitConfig);
          translateY.value = withTiming(20, exitConfig);
          break;
        case 'slideLeft':
          opacity.value = withTiming(0, exitConfig);
          translateX.value = withTiming(-20, exitConfig);
          break;
        case 'slideRight':
          opacity.value = withTiming(0, exitConfig);
          translateX.value = withTiming(20, exitConfig);
          break;
      }

      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }

      exitTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        onExitComplete?.();
      }, exitDuration);
    }

    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [
    isVisible,
    enabled,
    exitDuration,
    enterDuration,
    exitTransition,
    enterTransition,
    onExitComplete,
    opacity,
    scale,
    translateX,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number | string>[] = [];

    if (translateX.value !== 0) {
      transforms.push({ translateX: translateX.value });
    }
    if (translateY.value !== 0) {
      transforms.push({ translateY: translateY.value });
    }
    if (scale.value !== 1) {
      transforms.push({ scale: scale.value });
    }

    return {
      opacity: opacity.value,
      transform: transforms.length > 0 ? transforms : undefined,
    };
  });

  return {
    opacity,
    scale,
    translateX,
    translateY,
    animatedStyle,
    shouldRender,
  };
}
