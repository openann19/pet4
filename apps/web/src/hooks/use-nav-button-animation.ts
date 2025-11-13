'use client';

import { useMotionValue, animate, useTransform, type MotionValue, type Variants } from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';
import { isTruthy } from '@petspark/shared';

export interface UseNavButtonAnimationOptions {
  isActive?: boolean;
  enablePulse?: boolean;
  pulseScale?: number;
  enableRotation?: boolean;
  rotationAmplitude?: number;
  hapticFeedback?: boolean;
}

export interface UseNavButtonAnimationReturn {
  scale: MotionValue<number>;
  translateY: MotionValue<number>;
  rotation: MotionValue<number>;
  iconScale: MotionValue<number>;
  iconRotation: MotionValue<number>;
  indicatorOpacity: MotionValue<number>;
  indicatorWidth: MotionValue<number>;
  variants: Variants;
  iconVariants: Variants;
  indicatorVariants: Variants;
  handlePress: () => void;
  handleHover: () => void;
  handleLeave: () => void;
}

export function useNavButtonAnimation(
  options: UseNavButtonAnimationOptions = {}
): UseNavButtonAnimationReturn {
  const {
    isActive = false,
    enablePulse = true,
    pulseScale = 1.25,
    enableRotation = true,
    rotationAmplitude = 5,
    hapticFeedback = true,
  } = options;

  const scale = useMotionValue(1);
  const translateY = useMotionValue(0);
  const rotation = useMotionValue(0);
  const iconScale = useMotionValue(1);
  const iconRotation = useMotionValue(0);
  const indicatorOpacity = useMotionValue(0);
  const indicatorWidth = useMotionValue(0);

  useEffect(() => {
    if (isTruthy(isActive)) {
      // Active state animations
      if (isTruthy(enablePulse)) {
        animate(iconScale, [pulseScale, 1], {
          type: 'spring',
          damping: springConfigs.bouncy.damping,
          stiffness: springConfigs.bouncy.stiffness,
          repeat: Infinity,
          repeatType: 'reverse',
        });
      } else {
        animate(iconScale, 1.1, {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
        });
      }

      if (isTruthy(enableRotation)) {
        animate(iconRotation, [0, rotationAmplitude], {
          duration: 1.2,
          ease: (t) => Math.sin(t * Math.PI * 2) * 0.5 + 0.5,
          repeat: Infinity,
          repeatType: 'reverse',
        });
      }

      animate(indicatorOpacity, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(indicatorWidth, 32, {
        type: 'spring',
        damping: springConfigs.bouncy.damping,
        stiffness: springConfigs.bouncy.stiffness,
      });
    } else {
      // Inactive state
      animate(iconScale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(iconRotation, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(indicatorOpacity, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(indicatorWidth, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }
  }, [
    isActive,
    enablePulse,
    pulseScale,
    enableRotation,
    rotationAmplitude,
    iconScale,
    iconRotation,
    indicatorOpacity,
    indicatorWidth,
  ]);

  const handlePress = useCallback(() => {
    if (isTruthy(hapticFeedback)) {
      // Using haptics through window object if available
      if (typeof window !== 'undefined' && 'haptics' in window) {
        const haptics = (window as { haptics?: { impact?: (type: string) => void } }).haptics;
        haptics?.impact?.('light');
      }
    }

    animate(scale, 0.92, {
      type: 'spring',
      damping: 15,
      stiffness: 600,
    }).then(() => {
      animate(scale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    });

    animate(translateY, 2, {
      type: 'spring',
      damping: 15,
      stiffness: 600,
    }).then(() => {
      animate(translateY, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    });
  }, [hapticFeedback, scale, translateY]);

  const handleHover = useCallback(() => {
    if (isActive) return;

    animate(scale, 1.08, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    animate(translateY, -3, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    animate(rotation, 2, {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    });
  }, [isActive, scale, translateY, rotation]);

  const handleLeave = useCallback(() => {
    if (isActive) return;

    animate(scale, 1, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    animate(translateY, 0, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    animate(rotation, 0, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [isActive, scale, translateY, rotation]);

  const _indicatorOpacityTransformed = useTransform(indicatorOpacity, [0, 1], [0, 1]);
  const _indicatorWidthTransformed = useTransform(indicatorWidth, [0, 32], [0, 32]);

  const variants: Variants = {
    rest: {
      scale: 1,
      y: 0,
      rotate: 0,
    },
    hover: {
      scale: 1.08,
      y: -3,
      rotate: 2,
      transition: {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      },
    },
    active: {
      scale: 1,
      y: 0,
      rotate: 0,
    },
  };

  const iconVariants: Variants = {
    rest: {
      scale: 1,
      rotate: 0,
    },
    active: isTruthy(enablePulse)
      ? {
          scale: [pulseScale, 1],
          transition: {
            type: 'spring',
            damping: springConfigs.bouncy.damping,
            stiffness: springConfigs.bouncy.stiffness,
            repeat: Infinity,
            repeatType: 'reverse',
          },
        }
      : {
          scale: 1.1,
          transition: {
            type: 'spring',
            damping: springConfigs.smooth.damping,
            stiffness: springConfigs.smooth.stiffness,
          },
        },
  };

  const indicatorVariants: Variants = {
    hidden: {
      opacity: 0,
      width: 0,
    },
    visible: {
      opacity: 1,
      width: 32,
      transition: {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      },
    },
  };

  return {
    scale,
    translateY,
    rotation,
    iconScale,
    iconRotation,
    indicatorOpacity,
    indicatorWidth,
    variants,
    iconVariants,
    indicatorVariants,
    handlePress,
    handleHover,
    handleLeave,
  };
}
