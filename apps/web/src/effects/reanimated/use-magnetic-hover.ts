/**
 * Magnetic Hover Effect
 * Elements follow cursor with smooth spring physics and magnetic attraction
 */

import { useSharedValue, useAnimatedStyle, withSpring } from '@petspark/motion';
import { useState, useCallback } from 'react';
import { isTruthy, isDefined } from '@petspark/shared';

export interface UseMagneticHoverOptions {
  strength?: number;
  damping?: number;
  stiffness?: number;
  maxDistance?: number;
  enabled?: boolean;
}

export interface UseMagneticHoverReturn {
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  translateX: ReturnType<typeof useSharedValue<number>>;
  translateY: ReturnType<typeof useSharedValue<number>>;
  variants: any;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleMouseMove: (event: React.MouseEvent<HTMLElement>) => void;
  handleRef: (element: HTMLElement | null) => void;
}

export function useMagneticHover(options: UseMagneticHoverOptions = {}) {
  const {
    strength = 0.3,
    damping = 20,
    stiffness = 150,
    maxDistance = 50,
    enabled = true,
  } = options;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    scale.value = withSpring(1.05, { damping, stiffness });
  }, [enabled, damping, stiffness]);

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;
    translateX.value = withSpring(0, { damping, stiffness });
    translateY.value = withSpring(0, { damping, stiffness });
    scale.value = withSpring(1, { damping, stiffness });
  }, [enabled, damping, stiffness]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!enabled || !elementRect) return;

      const centerX = elementRect.left + elementRect.width / 2;
      const centerY = elementRect.top + elementRect.height / 2;

      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDist = elementRect.width / 2;

      if (distance < maxDist) {
        const normalizedX = Math.max(-maxDistance, Math.min(maxDistance, deltaX * strength));
        const normalizedY = Math.max(-maxDistance, Math.min(maxDistance, deltaY * strength));

        translateX.value = withSpring(normalizedX, { damping, stiffness });
        translateY.value = withSpring(normalizedY, { damping, stiffness });
      }
    },
    [enabled, elementRect, strength, maxDistance, damping, stiffness]
  );

  const handleRef = useCallback((element: HTMLElement | null) => {
    if (isTruthy(element)) {
      setElementRect(element.getBoundingClientRect());
    }
  }, []);

  const animatedStyle = useAnimatedStyle((): Record<string, unknown> => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return {
    animatedStyle,
    translateX,
    translateY,
    variants: undefined,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
    handleRef,
  };
}
