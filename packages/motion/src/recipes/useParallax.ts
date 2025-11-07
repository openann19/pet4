import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useReducedMotionSV } from '../reduced-motion';
import { isTruthy, isDefined } from '@/core/guards';

export interface UseParallaxOptions {
  mult?: number;
}

export interface UseParallaxReturn {
  onScroll: (e: { nativeEvent?: { contentOffset?: { y?: number } } }) => void;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
}

/**
 * Hook for parallax scroll effect.
 * Respects reduced motion preferences (no parallax when enabled).
 */
export function useParallax(mult = 0.2): UseParallaxReturn {
  const reducedMotion = useReducedMotionSV();
  const offset = useSharedValue(0);
  
  const onScroll = (e: { nativeEvent?: { contentOffset?: { y?: number } } }): void => {
    if (!reducedMotion.value) {
      offset.value = e.nativeEvent?.contentOffset?.y ?? 0;
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => {
    if (isTruthy(reducedMotion.value)) {
      return {}; // No parallax when reduced motion is enabled
    }
    return { transform: [{ translateY: -offset.value * mult }] };
  });
  
  return { onScroll, animatedStyle };
}

