'use client';

import { useSharedValue, withTiming,
  type AnimatedStyle,
} from '@petspark/motion';
import { useEffect, useRef } from 'react';
import type  from './animated-view';

export interface UseExpandCollapseOptions {
  isExpanded: boolean;
  duration?: number;
  enableOpacity?: boolean;
}

export interface UseExpandCollapseReturn {
  heightStyle: AnimatedStyle;
  opacityStyle: AnimatedStyle;
}

/**
 * Hook for animating expand/collapse transitions with height and opacity
 * Uses React Reanimated for smooth 60fps animations on UI thread
 * Note: Height animation requires maxHeight approach for 'auto' heights
 */
export function useExpandCollapse(options: UseExpandCollapseOptions): UseExpandCollapseReturn {
  const { isExpanded, duration = 300, enableOpacity = true } = options;

  const height = useSharedValue(isExpanded ? 1 : 0);
  const opacity = useSharedValue(isExpanded ? 1 : 0);
  const maxHeightRef = useRef<number>(1000);

  useEffect(() => {
    height.value = withTiming(isExpanded ? 1 : 0, { duration });

    if (enableOpacity) {
      opacity.value = withTiming(isExpanded ? 1 : 0, { duration });
    }
  }, [isExpanded, duration, enableOpacity, height, opacity]);

  const heightStyle = useAnimatedStyle(() => {
    return {
      maxHeight: height.value === 1 ? maxHeightRef.current : 0,
      opacity: height.value,
    };
  }) as AnimatedStyle;

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  return {
    heightStyle,
    opacityStyle,
  };
}
