/**
 * Liquid Dots Typing Indicator — Web
 * - Reanimated-driven sine chain (UI thread)
 * - Deterministic phases via seeded RNG
 * - Reduced motion: instant subtle pulse (≤120ms)
 * - Premium glow + slight blur (web-only)
 */

import React from 'react';
import { MotionView } from '@petspark/motion';
import { cn } from '@/lib/utils';
import { useTypingIndicatorMotion } from '@/effects/chat/typing';

export interface LiquidDotsProps {
  readonly enabled?: boolean;
  readonly dotSize?: number;
  readonly dotColor?: string;
  readonly className?: string;
  readonly dots?: number;
  readonly seed?: number | string;
}

export function LiquidDots({
  enabled = true,
  dotSize = 6,
  dotColor = 'hsl(var(--muted-foreground))',
  className,
  dots = 3,
  seed: _seed = 'liquid-dots',
}: LiquidDotsProps) {
  const typingMotion = useTypingIndicatorMotion({
    isTyping: enabled,
    dotCount: dots,
    reducedMode: 'static-dots',
  });

  if (!typingMotion.isVisible) {
    return null;
  }

  return (
    <MotionView
      role="status"
      aria-live="polite"
      style={typingMotion.animatedStyle}
      className={cn('flex items-center gap-1', className)}
    >
      {typingMotion.dots.map((dot) => (
        <MotionView
          key={dot.id}
          style={{
            ...dot.animatedStyle,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
            filter: 'blur(0.4px)',
            boxShadow: `0 0 ${dotSize * 0.6}px ${dotColor}40`,
          }}
          className="rounded-full"
        />
      ))}
    </MotionView>
  );
}
