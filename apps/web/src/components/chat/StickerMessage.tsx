'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { Sticker } from '@/lib/sticker-library';
import { cn } from '@/lib/utils';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useStickerAnimation } from '@/effects/reanimated/use-sticker-animation';
import { useHoverTap } from '@/effects/reanimated/use-hover-tap';
import { springConfigs } from '@/effects/reanimated/transitions';

export interface StickerMessageProps {
  sticker: Sticker;
  isOwn?: boolean;
  onHover?: () => void;
}

export function StickerMessage({ sticker, isOwn = false, onHover }: StickerMessageProps) {
  const [isHovered, setIsHovered] = useState(false);

  const entryOpacity = useSharedValue(0);
  const entryScale = useSharedValue(0.5);

  const stickerAnimation = useStickerAnimation({
    animation: sticker.animation ?? undefined,
    enabled: isHovered && Boolean(sticker.animation),
  });

  const hoverTap = useHoverTap({
    hoverScale: 1.1,
    tapScale: 0.95,
  });

  useEffect(() => {
    entryOpacity.value = withSpring(1, springConfigs.smooth);
    entryScale.value = withSpring(1, springConfigs.bouncy);
  }, [entryOpacity, entryScale]);

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

  const entryStyle = useAnimatedStyle(() => {
    return {
      opacity: entryOpacity.value,
      transform: [{ scale: entryScale.value }],
    };
  }) as AnimatedStyle;

  const combinedStyle = useAnimatedStyle(() => {
    const hoverStyle = hoverTap.animatedStyle as { transform?: Record<string, number>[] };
    const stickerStyle = stickerAnimation.animatedStyle as { transform?: Record<string, number>[] };

    const transforms: Record<string, number>[] = [];

    if (hoverStyle.transform) {
      transforms.push(...hoverStyle.transform);
    }
    if (stickerStyle.transform) {
      transforms.push(...stickerStyle.transform);
    }

    return {
      ...hoverStyle,
      ...stickerStyle,
      transform: transforms.length > 0 ? transforms : undefined,
    };
  }) as AnimatedStyle;

  return (
    <AnimatedView
      style={entryStyle}
      className={cn('flex items-center', isOwn ? 'justify-end' : 'justify-start')}
    >
      <AnimatedView
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
      </AnimatedView>
    </AnimatedView>
  );
}
