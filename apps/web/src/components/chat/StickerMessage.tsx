'use client';;
import { useState, useCallback, useEffect } from 'react';
import { useSharedValue, usewithSpring, MotionView } from '@petspark/motion';
import type { Sticker } from '@/lib/sticker-library';
import { cn } from '@/lib/utils';
import { useStickerAnimation } from '@/effects/reanimated/use-sticker-animation';
import { useHoverTap } from '@/effects/reanimated/use-hover-tap';
import { springConfigs } from '@/effects/reanimated/transitions';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface StickerMessageProps {
  sticker: Sticker;
  isOwn?: boolean;
  onHover?: () => void;
}

function useStickerEntryAnimation() {
  const entryOpacity = useSharedValue<number>(0);
  const entryScale = useSharedValue<number>(0.5);

  useEffect(() => {
    entryOpacity.value = withSpring(1, springConfigs.smooth);
    entryScale.value = withSpring(1, springConfigs.bouncy);
  }, [entryOpacity, entryScale]);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [{ scale: entryScale.value }],
  }));

  return entryStyle;
}

export function StickerMessage({ sticker, isOwn = false, onHover }: StickerMessageProps) {
  const _uiConfig = useUIConfig();
  const [isHovered, setIsHovered] = useState(false);
  const entryStyle = useStickerEntryAnimation();

  const stickerAnimation = useStickerAnimation({
    animation: sticker.animation ?? undefined,
    enabled: isHovered && Boolean(sticker.animation),
  });

  const hoverTap = useHoverTap({
    hoverScale: 1.1,
    tapScale: 0.95,
  });

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (sticker.animation) {
      stickerAnimation.trigger();
    }
    hoverTap.handleMouseEnter();
    onHover?.();
  }, [sticker.animation, stickerAnimation, hoverTap, onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    stickerAnimation.reset();
    hoverTap.handleMouseLeave();
  }, [stickerAnimation, hoverTap]);

  const combinedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hoverTap.scale.get() }],
  }));

  return (
    <MotionView
      style={entryStyle}
      className={cn('flex items-center', isOwn ? 'justify-end' : 'justify-start')}
    >
      <MotionView
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={hoverTap.handlePress ?? undefined}
        style={combinedStyle}
        className={cn(
          'relative cursor-default select-none sticker-message p-2 rounded-2xl',
          isHovered && 'bg-muted/30'
        )}
      >
        <span className="block">{sticker.emoji}</span>
      </MotionView>
    </MotionView>
  );
}
