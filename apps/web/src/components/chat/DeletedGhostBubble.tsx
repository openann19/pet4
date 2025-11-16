'use client';;
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, MotionView } from '@petspark/motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface DeletedGhostBubbleProps {
  isIncoming?: boolean;
  className?: string;
  delay?: number;
}

export function DeletedGhostBubble({
  isIncoming = false,
  className,
  delay = 0,
}: DeletedGhostBubbleProps) {
  const _uiConfig = useUIConfig();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, timingConfigs.smooth);
      scale.value = withSpring(1, springConfigs.smooth);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
      alignSelf: isIncoming ? ('flex-start' as const) : ('flex-end' as const),
    };
  });

  return (
    <MotionView
      style={animatedStyle}
      className={cn(
        'relative rounded-2xl p-3 max-w-[85%]',
        'bg-muted/30 border border-border/50',
        'text-muted-foreground',
        isIncoming ? 'rounded-bl-sm' : 'rounded-br-sm',
        className
      )}
    >
      <p className={cn('text-sm font-medium italic text-center', 'text-muted-foreground/70')}>
        This message was deleted
      </p>
    </MotionView>
  );
}
