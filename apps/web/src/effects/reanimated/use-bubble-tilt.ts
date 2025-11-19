'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  type SharedValue,
  type AnimatedStyle,
} from '@petspark/motion';
import { useCallback } from 'react';

export interface UseBubbleTiltOptions {
  maxTilt?: number;
  damping?: number;
  stiffness?: number;
  enabled?: boolean;
  perspective?: number;
}

export interface UseBubbleTiltReturn {
  rotateX: SharedValue<number>;
  rotateY: SharedValue<number>;
  shadowDepth: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  handleMove: (x: number, y: number, width: number, height: number) => void;
  handleLeave: () => void;
}

const DEFAULT_MAX_TILT = 8;
const DEFAULT_DAMPING = 15;
const DEFAULT_STIFFNESS = 150;
const DEFAULT_PERSPECTIVE = 1000;

export function useBubbleTilt(options: UseBubbleTiltOptions = {}): UseBubbleTiltReturn {
  const {
    maxTilt = DEFAULT_MAX_TILT,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    enabled = true,
    perspective = DEFAULT_PERSPECTIVE,
  } = options;

  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const shadowDepth = useSharedValue(0);

  const handleMove = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (!enabled) {
        return;
      }

      const centerX = width / 2;
      const centerY = height / 2;

      const deltaX = x - centerX;
      const deltaY = y - centerY;

      const tiltX = interpolate(
        deltaY,
        [-height / 2, height / 2],
        [maxTilt, -maxTilt],
        Extrapolation.CLAMP
      );

      const tiltY = interpolate(
        deltaX,
        [-width / 2, width / 2],
        [-maxTilt, maxTilt],
        Extrapolation.CLAMP
      );

      rotateX.value = withSpring(tiltX, { damping, stiffness });
      rotateY.value = withSpring(tiltY, { damping, stiffness });

      const tiltMagnitude = Math.sqrt(tiltX * tiltX + tiltY * tiltY);
      shadowDepth.value = withSpring(
        interpolate(tiltMagnitude, [0, maxTilt], [0, 1], Extrapolation.CLAMP),
        { damping, stiffness }
      );
    },
    [enabled, maxTilt, damping, stiffness, rotateX, rotateY, shadowDepth]
  );

  const handleLeave = useCallback(() => {
    if (!enabled) {
      return;
    }
    rotateX.value = withSpring(0, { damping, stiffness });
    rotateY.value = withSpring(0, { damping, stiffness });
    shadowDepth.value = withSpring(0, { damping, stiffness });
  }, [enabled, damping, stiffness, rotateX, rotateY, shadowDepth]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return {
        transform: [{ perspective }, { rotateX: '0deg' }, { rotateY: '0deg' }],
      };
    }

    const shadowBlur = interpolate(shadowDepth.value, [0, 1], [4, 16], Extrapolation.CLAMP);
    const shadowSpread = interpolate(shadowDepth.value, [0, 1], [0, 8], Extrapolation.CLAMP);
    const shadowOpacity = interpolate(shadowDepth.value, [0, 1], [0.2, 0.4], Extrapolation.CLAMP);

    return {
      transform: [
        { perspective },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
      ],
      boxShadow: `0 ${shadowDepth.value * 4}px ${shadowBlur}px ${shadowSpread}px rgba(0, 0, 0, ${shadowOpacity})`,
    };
  });

  return {
    rotateX,
    rotateY,
    shadowDepth,
    animatedStyle,
    handleMove,
    handleLeave,
  };
}
