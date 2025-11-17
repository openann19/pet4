/**
 * Kinetic Scroll Animation
 * Momentum-based scrolling with decay physics
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
  cancelAnimation,
} from '@petspark/motion';
import { useCallback, useState, useRef } from 'react';
import { isTruthy, isDefined } from '@petspark/shared';

export interface UseKineticScrollOptions {
  damping?: number;
  velocityMultiplier?: number;
  clamp?: [number, number];
}

export function useKineticScroll(options: UseKineticScrollOptions = {}) {
  const { damping = 0.998, velocityMultiplier = 1, clamp } = options;

  const offset = useSharedValue(0);
  const velocity = useSharedValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastPosition = useRef(0);
  const lastTime = useRef(0);

  const handleDragStart = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    cancelAnimation(offset);
    setIsDragging(true);

    const clientY = 'touches' in event ? (event.touches[0]?.clientY ?? 0) : event.clientY;
    lastPosition.current = clientY;
    lastTime.current = Date.now();
    velocity.value = 0;
  }, []);

  const handleDragMove = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;

      const clientY = 'touches' in event ? (event.touches[0]?.clientY ?? 0) : event.clientY;
      const currentTime = Date.now();
      const deltaY = clientY - lastPosition.current;
      const deltaTime = currentTime - lastTime.current;

      if (deltaTime > 0) {
        velocity.value = (deltaY / deltaTime) * velocityMultiplier;
      }

      offset.value += deltaY;

      if (isTruthy(clamp)) {
        offset.value = Math.max(clamp[0], Math.min(clamp[1], offset.value));
      }

      lastPosition.current = clientY;
      lastTime.current = currentTime;
    },
    [isDragging, velocityMultiplier, clamp]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const decayConfig =
      clamp !== undefined
        ? {
            velocity: velocity.value,
            deceleration: damping,
            rubberBandEffect: true as const,
            clamp,
          }
        : { velocity: velocity.value, deceleration: damping };

    offset.value = withDecay(decayConfig);
  }, [isDragging, damping, clamp, velocity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  const reset = useCallback(() => {
    cancelAnimation(offset);
    offset.value = 0;
    velocity.value = 0;
  }, []);

  return {
    animatedStyle,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    isDragging,
    offset: offset.value,
    reset,
  };
}
