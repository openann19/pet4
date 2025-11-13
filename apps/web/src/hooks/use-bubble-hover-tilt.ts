'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  type SharedValue,
} from '@petspark/motion';
import { useCallback } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';

export interface UseBubbleHoverTiltOptions {
  enabled?: boolean;
  maxTilt?: number;
  maxLift?: number;
  glowIntensity?: number;
}

export interface UseBubbleHoverTiltReturn {
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
  lift: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  glowStyle: ReturnType<typeof useAnimatedStyle>;
  handleMouseMove: (event: React.MouseEvent<HTMLElement>) => void;
  handleMouseLeave: () => void;
}

const DEFAULT_MAX_TILT = 8;
const DEFAULT_MAX_LIFT = -4;
const DEFAULT_GLOW_INTENSITY = 0.6;

export function useBubbleHoverTilt(
  options: UseBubbleHoverTiltOptions = {}
): UseBubbleHoverTiltReturn {
  const {
    enabled = true,
    maxTilt = DEFAULT_MAX_TILT,
    maxLift = DEFAULT_MAX_LIFT,
    glowIntensity = DEFAULT_GLOW_INTENSITY,
  } = options;

  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const lift = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!enabled) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (event.clientX - centerX) / (rect.width / 2);
      const deltaY = (event.clientY - centerY) / (rect.height / 2);

      tiltX.value = withSpring(deltaX * maxTilt, springConfigs.smooth);
      tiltY.value = withSpring(deltaY * maxTilt, springConfigs.smooth);
      lift.value = withSpring(maxLift, springConfigs.smooth);
      glowOpacity.value = withSpring(glowIntensity, springConfigs.smooth);
    },
    [enabled, maxTilt, maxLift, glowIntensity, tiltX, tiltY, lift, glowOpacity]
  );

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;

    tiltX.value = withSpring(0, springConfigs.smooth);
    tiltY.value = withSpring(0, springConfigs.smooth);
    lift.value = withSpring(0, springConfigs.smooth);
    glowOpacity.value = withSpring(0, springConfigs.smooth);
  }, [enabled, tiltX, tiltY, lift, glowOpacity]);

  const animatedStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowOpacity.value, [0, 1], [0, 24], Extrapolation.CLAMP);

    return {
      transform: [
        { rotateX: `${tiltY.value}deg` },
        { rotateY: `${-tiltX.value}deg` },
        { translateZ: `${lift.value}px` },
      ],
      boxShadow: `0 ${Math.abs(lift.value)}px ${shadowRadius}px rgba(59, 130, 246, ${glowOpacity.value * 0.4})`,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
      transform: [{ translateZ: `${lift.value * 1.5}px` }],
    };
  });

  return {
    tiltX,
    tiltY,
    lift,
    glowOpacity,
    animatedStyle,
    glowStyle,
    handleMouseMove,
    handleMouseLeave,
  };
}
