'use client';

import {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type AnimatedStyle,
} from '@petspark/motion';
import { useEffect } from 'react';


export interface UseGradientAnimationOptions {
  type?: 'scale' | 'rotate' | 'translate' | 'combined';
  duration?: number;
  delay?: number;
  opacityRange?: [number, number];
  scaleRange?: [number, number];
  translateRange?: { x: [number, number]; y: [number, number] };
  rotationRange?: [number, number];
}

export interface UseGradientAnimationReturn {
  scale: ReturnType<typeof useSharedValue<number>>;
  opacity: ReturnType<typeof useSharedValue<number>>;
  x: ReturnType<typeof useSharedValue<number>>;
  y: ReturnType<typeof useSharedValue<number>>;
  rotation: ReturnType<typeof useSharedValue<number>>;
  style: AnimatedStyle;
}

export function useGradientAnimation(
  options: UseGradientAnimationOptions = {}
): UseGradientAnimationReturn {
  const {
    type = 'combined',
    duration = 10,
    delay = 0,
    opacityRange = [0.4, 0.8],
    scaleRange = [1, 1.4],
    translateRange = { x: [0, 100], y: [0, 60] },
    rotationRange = [0, 360],
  } = options;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(opacityRange[0]);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (type === 'scale' || type === 'combined') {
      scale.value = withRepeat(
        withSequence(
          withTiming(scaleRange[0], { duration: duration * 1000 * 0.33 }),
          withTiming(scaleRange[1], { duration: duration * 1000 * 0.33 }),
          withTiming(scaleRange[0], { duration: duration * 1000 * 0.34 })
        ),
        -1,
        false
      );
    }

    if (type === 'translate' || type === 'combined') {
      opacity.value = withRepeat(
        withSequence(
          withTiming(opacityRange[0], { duration: duration * 1000 * 0.33 }),
          withTiming(opacityRange[1], { duration: duration * 1000 * 0.33 }),
          withTiming(opacityRange[0], { duration: duration * 1000 * 0.34 })
        ),
        -1,
        false
      );

      x.value = withRepeat(
        withSequence(
          withTiming(translateRange.x[0], { duration: duration * 1000 * 0.33 }),
          withTiming(translateRange.x[1], { duration: duration * 1000 * 0.33 }),
          withTiming(translateRange.x[0], { duration: duration * 1000 * 0.34 })
        ),
        -1,
        false
      );

      y.value = withRepeat(
        withSequence(
          withTiming(translateRange.y[0], { duration: duration * 1000 * 0.33 }),
          withTiming(translateRange.y[1], { duration: duration * 1000 * 0.33 }),
          withTiming(translateRange.y[0], { duration: duration * 1000 * 0.34 })
        ),
        -1,
        false
      );
    }

    if (type === 'rotate' || type === 'combined') {
      rotation.value = withRepeat(
        withTiming(rotationRange[1], { duration: duration * 1000 }),
        -1,
        false
      );
    }
  }, [
    type,
    duration,
    delay,
    opacityRange,
    scaleRange,
    translateRange,
    rotationRange,
    scale,
    opacity,
    x,
    y,
    rotation,
  ]);

  const style = useAnimatedStyle(() => {
    const transforms: Record<string, number>[] = [];

    if (type === 'scale' || type === 'combined') {
      transforms.push({ scale: scale.value });
    }

    if (type === 'translate' || type === 'combined') {
      transforms.push({ translateX: x.value });
      transforms.push({ translateY: y.value });
    }

    if (type === 'rotate' || type === 'combined') {
      transforms.push({ rotate: rotation.value });
    }

    return {
      transform: transforms,
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  return {
    scale,
    opacity,
    x,
    y,
    rotation,
    style,
  };
}
