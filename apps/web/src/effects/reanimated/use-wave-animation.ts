/**
 * Wave Animation (Web - Framer Motion)
 * Simple wave animation using Framer Motion for web platform.
 */

import { useMotionValue, animate, type MotionValue, type MotionStyle } from '@petspark/motion';
import { useEffect } from 'react';

export interface UseWaveAnimationOptions {
  amplitude?: number;
  frequency?: number;
  speed?: number;
  direction?: 'horizontal' | 'vertical';
  enabled?: boolean;
}

export interface UseWaveAnimationReturn {
  x: MotionValue<number>;
  y: MotionValue<number>;
  progress: MotionValue<number>;
  animatedStyle: MotionStyle;
}

export function useWaveAnimation(options: UseWaveAnimationOptions = {}): UseWaveAnimationReturn {
  const {
    amplitude = 20,
    frequency = 2,
    speed = 3000,
    direction = 'horizontal',
    enabled = true,
  } = options;

  const progress = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const animatedStyle: MotionStyle = {
    x,
    y,
  };

  useEffect(() => {
    if (!enabled) return;

    const controls = animate(progress, 1, {
      duration: speed / 1000,
      repeat: Infinity,
      ease: 'linear',
      onUpdate: (latest) => {
        const phase = latest * Math.PI * 2 * frequency;
        const wave = Math.sin(phase) * amplitude;

        if (direction === 'horizontal') {
          x.set(wave);
          y.set(0);
        } else {
          x.set(0);
          y.set(wave);
        }
      },
    });

    return () => controls.stop();
  }, [enabled, speed, frequency, amplitude, direction, progress, x, y]);

  return {
    x,
    y,
    progress,
    animatedStyle,
  };
}

export function useMultiWave(waveCount = 3) {
  const progress = useMotionValue(0);

  useEffect(() => {
    const controls = animate(progress, 1, {
      duration: 4,
      repeat: Infinity,
      ease: 'linear',
    });

    return () => controls.stop();
  }, [progress]);

  const createWaveMotionValues = (waveIndex: number, amplitude = 15) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const opacity = useMotionValue(0.3);

    useEffect(() => {
      const unsubscribe = progress.on('change', (latest) => {
        const phaseOffset = (waveIndex * Math.PI * 2) / waveCount;
        const phase = latest * Math.PI * 2 + phaseOffset;
        const wave = Math.sin(phase) * amplitude;
        const opacityValue = 0.3 + Math.sin(latest * Math.PI * 2) * 0.15;

        x.set(wave * 0.5);
        y.set(wave);
        opacity.set(opacityValue);
      });

      return unsubscribe;
    }, [x, y, opacity, waveIndex, amplitude]);

    return { x, y, opacity };
  };

  return {
    createWaveMotionValues,
    progress,
  };
}
