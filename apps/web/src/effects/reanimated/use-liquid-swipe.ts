/**
 * Liquid Swipe Animation
 * Smooth, fluid swipe with elastic bounce and momentum
 */

import { useSharedValue, usewithSpring, withDecay } from '@petspark/motion';
import { useCallback, useState } from 'react';

export interface UseLiquidSwipeOptions {
  threshold?: number;
  damping?: number;
  stiffness?: number;
  velocity?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useLiquidSwipe(options: UseLiquidSwipeOptions = {}) {
  const {
    threshold = 100,
    damping = 15,
    stiffness = 150,
    velocity = 1000,
    onSwipeLeft,
    onSwipeRight,
  } = options;

  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleDragStart = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
    setStartX(clientX);
  }, []);

  const handleDragMove = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
      const deltaX = clientX - startX;

      translateX.value = deltaX;
      scale.value = 1 - Math.abs(deltaX) / 1000;
      rotate.value = deltaX / 20;
    },
    [isDragging, startX]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const currentTranslateX = translateX.value;

    if (Math.abs(currentTranslateX) > threshold) {
      // Swipe complete
      const direction = currentTranslateX > 0 ? 1 : -1;
      translateX.value = withDecay({
        velocity: direction * velocity,
        deceleration: 0.998,
      });

      if (direction > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (direction < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Return to center
      translateX.value = withSpring(0, { damping, stiffness });
      scale.value = withSpring(1, { damping, stiffness });
      rotate.value = withSpring(0, { damping, stiffness });
    }
  }, [isDragging, threshold, damping, stiffness, velocity, onSwipeLeft, onSwipeRight]);

  const animatedStyle = useAnimatedStyle((): Record<string, unknown> => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: `${String(rotate.value ?? '')}deg` },
    ],
  }));

  return {
    animatedStyle,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    isDragging,
  };
}
