'use client';

import { useMotionValue, animate, type MotionValue, type AnimatedStyle,
} from '@petspark/motion';
import { useEffect } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';


export interface UseModalAnimationOptions {
  isVisible: boolean;
  duration?: number;
  delay?: number;
}

export interface UseModalAnimationReturn {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  y: MotionValue<number>;
  variants: Variants;
  style: AnimatedStyle;
}

export function useModalAnimation(options: UseModalAnimationOptions): UseModalAnimationReturn {
  const { isVisible, duration = 300, delay = 0 } = options;

  const opacity = useMotionValue(0);
  const scale = useMotionValue(0.9);
  const y = useMotionValue(20);

  useEffect(() => {
    if (isVisible) {
      const delayMs = delay * 1000;
      animate(opacity, 1, {
        delay: delayMs / 1000,
        duration: duration / 1000,
        ease: 'easeInOut',
      });
      animate(scale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(y, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    } else {
      animate(opacity, 0, {
        duration: duration / 1000,
        ease: 'easeInOut',
      });
      animate(scale, 0.9, {
        duration: duration / 1000,
        ease: 'easeInOut',
      });
      animate(y, 20, {
        duration: duration / 1000,
        ease: 'easeInOut',
      });
    }
  }, [isVisible, duration, delay, opacity, scale, y]);

  const variants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: delay / 1000,
        opacity: {
          duration: duration / 1000,
          ease: 'easeInOut',
        },
        scale: {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
        },
        y: {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
        },
      },
    },
  };

  // Create style object from motion values for use with MotionView
  const style: AnimatedStyle = {
    opacity,
    scale,
    y,
  };

  return {
    opacity,
    scale,
    y,
    variants,
    style,
  };
}
