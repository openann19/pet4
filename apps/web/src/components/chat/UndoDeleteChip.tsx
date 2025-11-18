'use client';;
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, MotionView } from '@petspark/motion';
import { useCallback, useEffect, useState } from 'react';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { ArrowUUpLeft } from '@phosphor-icons/react';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface UndoDeleteChipProps {
  onUndo: () => void;
  duration?: number;
  className?: string;
}

function useUndoDeleteAnimation(isVisible: boolean) {
  const translateX = useSharedValue<number>(-100);
  const opacity = useSharedValue<number>(0);
  const scale = useSharedValue<number>(0.8);

  useEffect(() => {
    if (isVisible) {
      translateX.value = withSpring(0, springConfigs.bouncy);
      opacity.value = withTiming(1, timingConfigs.fast);
      scale.value = withSpring(1, springConfigs.bouncy);
    } else {
      translateX.value = withTiming(-100, timingConfigs.fast);
      opacity.value = withTiming(0, timingConfigs.fast);
      scale.value = withTiming(0.8, timingConfigs.fast);
    }
  }, [isVisible, translateX, opacity, scale]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value, scale: scale.value }],
    opacity: opacity.value,
  }));
}

export function UndoDeleteChip({ onUndo, duration = 5000, className }: UndoDeleteChipProps) {
  const _uiConfig = useUIConfig();
  const [isVisible, setIsVisible] = useState(true);
  const animatedStyle = useUndoDeleteAnimation(isVisible);

  const handleUndo = useCallback(() => {
    haptics.selection();
    setIsVisible(false);
    onUndo();
  }, [onUndo]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  return (
    <MotionView
      style={animatedStyle}
      className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
        'bg-card border border-border rounded-full shadow-lg',
        'px-4 py-2 flex items-center gap-2',
        'transform-gpu',
        className
      )}
    >
      <button
        onClick={() => void handleUndo()}
        className={cn(
          'flex items-center gap-2',
          'text-sm font-medium',
          'hover:opacity-80 transition-opacity'
        )}
      >
        <ArrowUUpLeft size={16} className="text-foreground" />
        <span className="text-foreground">Undo delete</span>
      </button>
    </MotionView>
  );
}
