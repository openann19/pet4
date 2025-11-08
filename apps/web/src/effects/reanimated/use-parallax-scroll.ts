/**
 * Parallax Scroll Effect
 * Depth-based parallax scrolling with multiple layers
 */

import { useSharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { useCallback, useEffect } from 'react';

export interface UseParallaxScrollOptions {
  speed?: number;
  direction?: 'vertical' | 'horizontal';
  enabled?: boolean;
}

export function useParallaxScroll(options: UseParallaxScrollOptions = {}) {
  const { speed = 0.5, direction = 'vertical', enabled = true } = options;

  const scrollY = useSharedValue(0);
  const scrollX = useSharedValue(0);

  const handleScroll = useCallback(() => {
    if (!enabled) return;

    scrollY.value = window.scrollY;
    scrollX.value = window.scrollX;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, handleScroll]);

  const animatedStyle = useAnimatedStyle(() => {
    if (direction === 'vertical') {
      const translateY = -scrollY.value * speed;
      return {
        transform: [{ translateY }],
      };
    } else {
      const translateX = -scrollX.value * speed;
      return {
        transform: [{ translateX }],
      };
    }
  });

  return {
    animatedStyle,
    scrollY,
    scrollX,
  };
}

export function useParallaxLayers(layerCount = 3) {
  const scrollY = useSharedValue(0);

  const handleScroll = useCallback(() => {
    scrollY.value = window.scrollY;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const createLayerStyle = useCallback(
    (layerIndex: number) => {
      return useAnimatedStyle(() => {
        const depth = (layerIndex + 1) / layerCount;
        const speed = depth * 0.5;
        const translateY = -scrollY.value * speed;
        const scale = interpolate(scrollY.value, [0, 500], [1, 1 + depth * 0.1]);

        return {
          transform: [{ translateY }, { scale }],
        };
      });
    },
    [layerCount]
  );

  return {
    createLayerStyle,
    scrollY,
  };
}
