'use client';

import { useSharedValue, useanimate   type AnimatedStyle,
} from '@petspark/motion';
import { useEffect, useState } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';


export interface UsePageTransitionWrapperOptions {
  key: string;
  duration?: number;
  direction?: 'up' | 'down' | 'fade';
}

export interface UsePageTransitionWrapperReturn {
  opacity: ReturnType<typeof useSharedValue<number>>;
  translateY: ReturnType<typeof useSharedValue<number>>;
  scale: ReturnType<typeof useSharedValue<number>>;
  style: AnimatedStyle;
  isVisible: boolean;
}

export function usePageTransitionWrapper(
  options: UsePageTransitionWrapperOptions
): UsePageTransitionWrapperReturn {
  const { key, duration = 300, direction = 'up' } = options;

  const [isVisible, setIsVisible] = useState(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(direction === 'up' ? 30 : direction === 'down' ? -30 : 0);
  const scale = useSharedValue(0.98);

  useEffect(() => {
    setIsVisible(true);
    const durationSeconds = duration / 1000;
    animate(opacity, 1, {
      duration: durationSeconds,
    });
    animate(translateY, 0, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    animate(scale, 1, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });

    return () => {
      const exitDurationSeconds = (duration * 0.5) / 1000;
      animate(opacity, 0, {
        duration: exitDurationSeconds,
      });
      animate(translateY, direction === 'up' ? -30 : 30, {
        duration: exitDurationSeconds,
      });
      animate(scale, 0.98, {
        duration: exitDurationSeconds,
      });
      setIsVisible(false);
    };
  }, [key, duration, direction, opacity, translateY, scale]);

  const style = useAnimatedStyle(() => {
    return {
      opacity: opacity.get(),
      transform: [{ translateY: translateY.get() }, { scale: scale.get() }],
    };
  }) as AnimatedStyle;

  return {
    opacity,
    translateY,
    scale,
    style,
    isVisible,
  };
}
