/**
 * 3D Flip Card Animation
 * Realistic card flip with perspective and backface visibility
 */

import { useSharedValue, withSpring, interpolate, type AnimatedStyle } from '@petspark/motion';
import { useCallback, useState } from 'react';

export interface Use3DFlipCardOptions {
  duration?: number;
  perspective?: number;
  damping?: number;
  stiffness?: number;
}

export function use3DFlipCard(options: Use3DFlipCardOptions = {}) {
  const { perspective = 1200, damping = 20, stiffness = 100 } = options;

  const rotateY = useSharedValue(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const flip = useCallback(() => {
    const targetRotation = isFlipped ? 0 : 180;
    rotateY.value = withSpring(targetRotation, {
      damping,
      stiffness,
    });
    setIsFlipped(!isFlipped);
  }, [isFlipped, damping, stiffness]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(rotateY.value, [0, 90, 180], [1, 0, 0]);

    return {
      opacity,
      transform: [{ perspective }, { rotateY: `${rotateY.value}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(rotateY.value, [0, 90, 180], [0, 0, 1]);

    return {
      opacity,
      transform: [{ perspective }, { rotateY: `${rotateY.value + 180}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  return {
    front,
    back,
    flip,
    isFlipped,
  };
}
