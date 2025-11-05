/**
 * Morph Shape Animation
 * Smooth morphing between shapes with border-radius interpolation
 */

import { useSharedValue, useAnimatedStyle, withTiming, interpolate, Easing } from 'react-native-reanimated';
import { useCallback } from 'react';

export interface UseMorphShapeOptions {
  duration?: number;
  shapes?: {
    borderRadius: number[];
    scale?: number;
    rotate?: number;
  }[];
}

export function useMorphShape(options: UseMorphShapeOptions = {}) {
  const {
    duration = 400,
    shapes = [
      { borderRadius: [8, 8, 8, 8], scale: 1, rotate: 0 },
      { borderRadius: [24, 8, 24, 8], scale: 1.05, rotate: 5 },
      { borderRadius: [50, 50, 50, 50], scale: 1, rotate: 0 },
    ],
  } = options;

  const progress = useSharedValue(0);
  const currentShape = useSharedValue(0);

  const morphTo = useCallback(
    (shapeIndex: number) => {
      if (shapeIndex < 0 || shapeIndex >= shapes.length) return;
      
      currentShape.value = shapeIndex;
      progress.value = withTiming(shapeIndex, {
        duration,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    },
    [shapes.length, duration]
  );

  const cycleShape = useCallback(() => {
    const nextShape = (currentShape.value + 1) % shapes.length;
    morphTo(nextShape);
  }, [shapes.length, morphTo]);

  const animatedStyle = useAnimatedStyle(() => {
    const shapeIndex = Math.floor(progress.value);
    const nextShapeIndex = Math.min(shapeIndex + 1, shapes.length - 1);
    const interpolationProgress = progress.value - shapeIndex;

    const currentShapeData = shapes[shapeIndex];
    const nextShapeData = shapes[nextShapeIndex];

    if (!currentShapeData || !nextShapeData) {
      return {};
    }

    const topLeft = interpolate(
      interpolationProgress,
      [0, 1],
      [currentShapeData.borderRadius[0] ?? 8, nextShapeData.borderRadius[0] ?? 8]
    );
    const topRight = interpolate(
      interpolationProgress,
      [0, 1],
      [currentShapeData.borderRadius[1] ?? 8, nextShapeData.borderRadius[1] ?? 8]
    );
    const bottomRight = interpolate(
      interpolationProgress,
      [0, 1],
      [currentShapeData.borderRadius[2] ?? 8, nextShapeData.borderRadius[2] ?? 8]
    );
    const bottomLeft = interpolate(
      interpolationProgress,
      [0, 1],
      [currentShapeData.borderRadius[3] ?? 8, nextShapeData.borderRadius[3] ?? 8]
    );

    const scale = interpolate(
      interpolationProgress,
      [0, 1],
      [currentShapeData.scale ?? 1, nextShapeData.scale ?? 1]
    );

    const rotate = interpolate(
      interpolationProgress,
      [0, 1],
      [currentShapeData.rotate ?? 0, nextShapeData.rotate ?? 0]
    );

    return {
      borderTopLeftRadius: topLeft,
      borderTopRightRadius: topRight,
      borderBottomRightRadius: bottomRight,
      borderBottomLeftRadius: bottomLeft,
      transform: [{ scale }, { rotate: `${rotate}deg` }],
    };
  });

  return {
    animatedStyle,
    morphTo,
    cycleShape,
    currentShape: currentShape.value,
  };
}
