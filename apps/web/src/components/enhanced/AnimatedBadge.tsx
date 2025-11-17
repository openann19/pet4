'use client';;
import React, { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, animate, MotionView, Presence } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { ReactNode } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";

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
    const _uiConfig = useUIConfig();
    const scale = useSharedValue(show ? 1 : 0);
  const opacity = useSharedValue(show ? 1 : 0);

  useEffect(() => {
    if (show) {
      const scaleTransition = withSpring(1, springConfigs.bouncy);
      animate(scale, scaleTransition.target, scaleTransition.transition);
      const opacityTransition = withSpring(1, springConfigs.smooth);
      animate(opacity, opacityTransition.target, opacityTransition.transition);
    } else {
      const scaleTransition = withSpring(0, springConfigs.smooth);
      animate(scale, scaleTransition.target, scaleTransition.transition);
      const opacityTransition = withSpring(0, springConfigs.smooth);
      animate(opacity, opacityTransition.target, opacityTransition.transition);
    }
  }, [show, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    opacity: opacity.get(),
  }));

  return (
    <Presence visible={show}>
      <MotionView style={animatedStyle} className={className}>
        {children}
      </MotionView>
    </Presence>
  );
}
