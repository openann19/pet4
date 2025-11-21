/**
 * Animated Glow Border (Web - Framer Motion)
 * Pulsating glow effect with customizable colors and intensity
 */

import {
  useMotionValue,
  animate,
  useTransform,
  type MotionValue,
  type MotionStyle,
} from '@petspark/motion';
import { useEffect } from 'react';

export interface UseGlowBorderOptions {
  color?: string;
  intensity?: number;
  speed?: number;
  enabled?: boolean;
  pulseSize?: number;
}

export interface UseGlowBorderReturn {
  glowIntensity: MotionValue<number>;
  opacity: MotionValue<number>;
  progress: MotionValue<number>;
  animatedStyle: MotionStyle;
}

export function useGlowBorder(options: UseGlowBorderOptions = {}): UseGlowBorderReturn {
  const {
    color = 'rgba(99, 102, 241, 0.8)',
    intensity = 20,
    speed = 2000,
    enabled = true,
    pulseSize = 8,
  } = options;

  const progress = useMotionValue(0);
  const glowIntensity = useTransform(progress, [0, 0.5, 1], [0, intensity, 0]);
  const opacity = useTransform(progress, [0, 0.5, 1], [0.3, 0.8, 0.3]);

  const boxShadow = useTransform(glowIntensity, (value) => `0 0 ${value + pulseSize}px ${color}`);

  useEffect(() => {
    if (!enabled) return;

    const controls = animate(progress, 1, {
      duration: speed / 1000,
      repeat: Infinity,
      ease: 'easeInOut',
    });

    return () => controls.stop();
  }, [enabled, speed, progress]);

  const animatedStyle: MotionStyle = {
    boxShadow,
    opacity,
  };

  return {
    glowIntensity,
    opacity,
    progress,
    animatedStyle,
  };
}
