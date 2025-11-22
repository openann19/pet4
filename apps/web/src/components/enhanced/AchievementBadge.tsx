import React, { useEffect } from 'react';
import { useSharedValue, withSpring, useAnimatedStyle, MotionView } from '@petspark/motion';
import { useUIConfig } from "@/hooks/use-ui-config";
import { cn } from '@/lib/utils';

export interface AchievementBadgeProps {
  size?: number;
  color?: string;
  className?: string;
}

export function AchievementBadge({
  size = 32,
  color = 'var(--primary)',
  className = '',
}: AchievementBadgeProps) {
  const _uiConfig = useUIConfig();
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { stiffness: 300, damping: 20 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  }));

  return (
    <MotionView
      style={animatedStyle}
      className={cn('bg-primary rounded-full', className)}
    />
  );
}
