import { useEffect } from 'react';
import { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";

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
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedView
      style={[
        animatedStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
      className={cn('bg-primary rounded-full', className)}
    />
  );
}
