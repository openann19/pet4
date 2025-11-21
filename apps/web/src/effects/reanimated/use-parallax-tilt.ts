'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  animate,
  interpolate,
  type SharedValue,
} from '@petspark/motion';
import { useCallback } from 'react';

export interface UseParallaxTiltOptions {
  maxTilt?: number;
  damping?: number;
  stiffness?: number;
  enabled?: boolean;
  perspective?: number;
}

export interface UseParallaxTiltReturn {
  rotateX: SharedValue<number>;
  rotateY: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  handleMove: (x: number, y: number, width: number, height: number) => void;
  handleLeave: () => void;
}

const DEFAULT_MAX_TILT = 15;
const DEFAULT_DAMPING = 15;
const DEFAULT_STIFFNESS = 150;
const DEFAULT_PERSPECTIVE = 1000;

export function useParallaxTilt(options: UseParallaxTiltOptions = {}): UseParallaxTiltReturn {
  const {
    maxTilt = DEFAULT_MAX_TILT,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    enabled = true,
    perspective = DEFAULT_PERSPECTIVE,
  } = options;

  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return {
        transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg)`,
      };
    }

    return {
      transform: `perspective(${perspective}px) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg)`,
    };
  });

  const handleMove = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (!enabled) return;

      const centerX = width / 2;
      const centerY = height / 2;

      const deltaX = x - centerX;
      const deltaY = y - centerY;

      const tiltX = interpolate(deltaY, [-height / 2, height / 2], [maxTilt, -maxTilt]);

      const tiltY = interpolate(deltaX, [-width / 2, width / 2], [-maxTilt, maxTilt]);

      animate(rotateX, tiltX, {
        type: 'spring',
        damping,
        stiffness,
      });
      animate(rotateY, tiltY, {
        type: 'spring',
        damping,
        stiffness,
      });
    },
    [enabled, maxTilt, damping, stiffness, rotateX, rotateY]
  );

  const handleLeave = useCallback(() => {
    if (!enabled) return;
    animate(rotateX, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
    animate(rotateY, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [enabled, damping, stiffness, rotateX, rotateY]);

  return {
    rotateX,
    rotateY,
    animatedStyle,
    handleMove,
    handleLeave,
  };
}
