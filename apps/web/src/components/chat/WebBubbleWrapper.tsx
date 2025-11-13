'use client';

import { cn } from '@/lib/utils';
import { type ReactNode, useCallback } from 'react';
import { useAnimatedStyle } from '@petspark/motion';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useBubbleTilt } from '@/effects/reanimated/use-bubble-tilt';
import { useBubbleEntry } from '@/effects/reanimated/use-bubble-entry';
import { useHoverAnimation } from '@/effects/reanimated/use-hover-animation';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { TypingDotsWeb } from './TypingDotsWeb';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface WebBubbleWrapperProps {
  children: ReactNode;
  isIncoming?: boolean;
  index?: number;
  onClick?: () => void;
  onLongPress?: () => void;
  hasReaction?: boolean;
  reactionEmoji?: string;
  showTyping?: boolean;
  className?: string;
  bubbleClassName?: string;
  enable3DTilt?: boolean;
  enableSwipeReply?: boolean;
  staggerDelay?: number;
  glowOpacity?: number;
  glowIntensity?: number;
}

const DEFAULT_STAGGER_DELAY = 0.04;

export function WebBubbleWrapper({
  children,
  isIncoming = false,
  index = 0,
  onClick,
  onLongPress,
  hasReaction = false,
  reactionEmoji = '❤️',
  showTyping = false,
  className,
  bubbleClassName,
  enable3DTilt = true,
  staggerDelay = DEFAULT_STAGGER_DELAY,
  glowOpacity = 0,
  glowIntensity = 0.85,
}: WebBubbleWrapperProps) {
    const _uiConfig = useUIConfig();
    const bubbleTilt = useBubbleTilt({
        enabled: enable3DTilt,
        maxTilt: 10,
      });

  const bubbleEntry = useBubbleEntry({
    index,
    staggerDelay: staggerDelay * 1000,
    direction: isIncoming ? 'incoming' : 'outgoing',
    enabled: true,
    isNew: true,
  });

  const bubbleHover = useHoverAnimation({
    scale: 1.02,
    enabled: enable3DTilt,
  });

  const reactionEntry = useEntryAnimation({
    initialScale: 0,
    delay: 100,
    enabled: hasReaction,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enable3DTilt) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - rect.width / 2;
      const offsetY = e.clientY - rect.top - rect.height / 2;
      bubbleTilt.handleMove(offsetX, offsetY, rect.width, rect.height);
    },
    [enable3DTilt, bubbleTilt]
  );

  const handleMouseLeave = useCallback(() => {
    if (!enable3DTilt) return;
    bubbleTilt.handleLeave();
  }, [enable3DTilt, bubbleTilt]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (onLongPress) {
        onLongPress();
      }
    },
    [onLongPress]
  );

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: bubbleEntry.opacity.value,
      transform: [
        { translateY: bubbleEntry.translateY.value },
        { translateX: bubbleEntry.translateX.value },
        { scale: bubbleEntry.scale.value },
        { rotateX: `${String(bubbleTilt.rotateX.value ?? '')}deg` },
        { rotateY: `${String(bubbleTilt.rotateY.value ?? '')}deg` },
      ],
    };
  }) as AnimatedStyle;

  const bubbleStyle = bubbleHover.animatedStyle;

  // Glow trail style for send effect
  const glowStyle = useAnimatedStyle(() => {
    if (glowOpacity <= 0) {
      return {};
    }

    const glowColor = isIncoming ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.8)';

    return {
      position: 'absolute',
      inset: '-4px',
      borderRadius: 'inherit',
      background: `radial-gradient(circle, ${String(glowColor ?? '')} 0%, transparent 70%)`,
      opacity: glowOpacity * glowIntensity,
      filter: `blur(8px)`,
      pointerEvents: 'none',
      zIndex: -1,
    };
  }) as AnimatedStyle;

  return (
    <AnimatedView
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      style={containerStyle}
      className={cn('relative', className)}
    >
      {/* Glow trail effect */}
      {glowOpacity > 0 && (
        <AnimatedView style={glowStyle}>
          <div />
        </AnimatedView>
      )}

      <AnimatedView
        style={bubbleStyle}
        onMouseEnter={bubbleHover.handleMouseEnter}
        onMouseLeave={bubbleHover.handleMouseLeave}
        onMouseDown={bubbleHover.handleMouseDown}
        onMouseUp={bubbleHover.handleMouseUp}
        className={cn(
          'relative max-w-[85%] rounded-2xl px-4 py-2 shadow-lg transition-all duration-200',
          isIncoming
            ? 'bg-neutral-800 text-white self-start rounded-bl-sm'
            : 'bg-blue-600 text-white self-end rounded-br-sm',
          bubbleClassName
        )}
      >
        {showTyping ? (
          <TypingDotsWeb dotColor={isIncoming ? '#9ca3af' : 'var(--color-bg-overlay)'} dotSize={6} />
        ) : (
          children
        )}
      </AnimatedView>
      {hasReaction && (
        <AnimatedView
          style={reactionEntry.animatedStyle}
          className="absolute -bottom-4 -right-2 text-base pointer-events-none"
        >
          {reactionEmoji}
        </AnimatedView>
      )}
    </AnimatedView>
  );
}
