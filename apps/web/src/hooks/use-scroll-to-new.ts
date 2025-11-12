'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useCallback, useEffect, useRef } from 'react';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';

export interface UseScrollToNewOptions {
  isVisible?: boolean;
  containerRef?: React.RefObject<HTMLElement>;
  targetRef?: React.RefObject<HTMLElement>;
  threshold?: number;
}

export interface UseScrollToNewReturn {
  chipOpacity: SharedValue<number>;
  chipTranslateY: SharedValue<number>;
  chipStyle: ReturnType<typeof useAnimatedStyle>;
  show: () => void;
  hide: () => void;
  scrollToLatest: () => void;
}

const DEFAULT_THRESHOLD = 200;

export function useScrollToNew(options: UseScrollToNewOptions = {}): UseScrollToNewReturn {
  const { isVisible = false, containerRef, targetRef, threshold = DEFAULT_THRESHOLD } = options;

  const chipOpacity = useSharedValue(0);
  const chipTranslateY = useSharedValue(20);
  const isScrollingRef = useRef(false);

  const show = useCallback(() => {
    chipOpacity.value = withSpring(1, springConfigs.smooth);
    chipTranslateY.value = withSpring(0, springConfigs.smooth);
  }, [chipOpacity, chipTranslateY]);

  const hide = useCallback(() => {
    chipOpacity.value = withTiming(0, timingConfigs.fast);
    chipTranslateY.value = withTiming(20, timingConfigs.fast);
  }, [chipOpacity, chipTranslateY]);

  useEffect(() => {
    if (isVisible) {
      show();
    } else {
      hide();
    }
  }, [isVisible, show, hide]);

  const scrollToLatest = useCallback(() => {
    if (isScrollingRef.current) return;

    isScrollingRef.current = true;

    chipOpacity.value = withSequence(
      withTiming(0.7, timingConfigs.fast),
      withTiming(0, timingConfigs.smooth)
    );

    chipTranslateY.value = withSequence(
      withSpring(-10, springConfigs.smooth),
      withSpring(20, springConfigs.smooth)
    );

    if (targetRef?.current && containerRef?.current) {
      const container = containerRef.current;
      const target = targetRef.current;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      const scrollTop = container.scrollTop + (targetRect.top - containerRect.top) - threshold;

      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      });

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    } else if (targetRef?.current) {
      targetRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    } else {
      isScrollingRef.current = false;
    }
  }, [chipOpacity, chipTranslateY, containerRef, targetRef, threshold]);

  const chipStyle = useAnimatedStyle(() => {
    return {
      opacity: chipOpacity.value,
      transform: [{ translateY: chipTranslateY.value }],
    };
  });

  return {
    chipOpacity,
    chipTranslateY,
    chipStyle,
    show,
    hide,
    scrollToLatest,
  };
}
