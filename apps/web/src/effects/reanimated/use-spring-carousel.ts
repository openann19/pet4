/**
 * Spring Carousel Animation
 * Smooth carousel with spring physics and snap points
 */

import { useSharedValue, usewithSpring, interpolate   type AnimatedStyle,
} from '@petspark/motion';
import { useCallback, useState } from 'react';
import { isTruthy, isDefined } from '@petspark/shared';

export interface UseSpringCarouselOptions {
  itemCount: number;
  itemWidth: number;
  gap?: number;
  damping?: number;
  stiffness?: number;
  onIndexChange?: (index: number) => void;
}

export function useSpringCarousel(options: UseSpringCarouselOptions) {
  const { itemCount, itemWidth, gap = 16, damping = 20, stiffness = 120, onIndexChange } = options;

  const translateX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slideWidth = itemWidth + gap;

  const goToIndex = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(itemCount - 1, index));
      const targetX = -clampedIndex * slideWidth;

      translateX.value = withSpring(targetX, {
        damping,
        stiffness,
      });

      setCurrentIndex(clampedIndex);
      if (isTruthy(onIndexChange)) {
        onIndexChange(clampedIndex);
      }
    },
    [itemCount, slideWidth, damping, stiffness, onIndexChange]
  );

  const next = useCallback(() => {
    if (currentIndex < itemCount - 1) {
      goToIndex(currentIndex + 1);
    }
  }, [currentIndex, itemCount, goToIndex]);

  const previous = useCallback(() => {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    }
  }, [currentIndex, goToIndex]);

  const createItemStyle = useCallback(
    (itemIndex: number) => {
      return useAnimatedStyle(() => {
        const inputRange = [
          (itemIndex - 1) * -slideWidth,
          itemIndex * -slideWidth,
          (itemIndex + 1) * -slideWidth,
        ];

        const scale = interpolate(translateX.value, inputRange, [0.85, 1, 0.85]);

        const opacity = interpolate(translateX.value, inputRange, [0.6, 1, 0.6]);

        const rotateY = interpolate(translateX.value, inputRange, [20, 0, -20]);

        return {
          transform: [
            { translateX: itemIndex * slideWidth },
            { scale },
            { perspective: 1000 },
            { rotateY: `${String(rotateY ?? '')}deg` },
          ],
          opacity,
        };
      });
    },
    [slideWidth]
  );

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return {
    containerStyle,
    createItemStyle,
    currentIndex,
    goToIndex,
    next,
    previous,
    canGoNext: currentIndex < itemCount - 1,
    canGoPrevious: currentIndex > 0,
  };
}
