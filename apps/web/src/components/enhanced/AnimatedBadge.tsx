'use client';

import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { Presence } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import type { ReactNode } from 'react';

export interface AnimatedBadgeProps {
  children: ReactNode;
  show?: boolean;
  className?: string;
}

/**
 * Animated badge component to replace motion.div badges
 * Used for migrating from framer-motion to react-native-reanimated
 */
export function AnimatedBadge({ children, show = true, className }: AnimatedBadgeProps) {
  const scale = useSharedValue(show ? 1 : 0);
  const opacity = useSharedValue(show ? 1 : 0);

  useEffect(() => {
    if (show) {
      scale.value = withSpring(1, springConfigs.bouncy);
      opacity.value = withSpring(1, springConfigs.smooth);
    } else {
      scale.value = withSpring(0, springConfigs.smooth);
      opacity.value = withSpring(0, springConfigs.smooth);
    }
  }, [show, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  })) as AnimatedStyle;

  return (
    <Presence visible={show}>
      <AnimatedView style={animatedStyle} className={className}>
        {children}
      </AnimatedView>
    </Presence>
  );
}
