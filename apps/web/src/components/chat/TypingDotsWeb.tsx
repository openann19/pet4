'use client';
import React from 'react';
import { MotionView } from '@petspark/motion';
import { cn } from '@/lib/utils';
import { useTypingIndicatorMotion } from '@/effects/chat/typing';

export interface TypingDotsWebProps {
  dotSize?: number;
  dotColor?: string;
  gap?: number;
  animationDuration?: number;
  className?: string;
}

const DEFAULT_DOT_SIZE = 6;
const DEFAULT_DOT_COLOR = 'var(--color-neutral-a9)';
const DEFAULT_GAP = 4;
const DEFAULT_ANIMATION_DURATION = 1200;

export function TypingDotsWeb({
  dotSize = DEFAULT_DOT_SIZE,
  dotColor = DEFAULT_DOT_COLOR,
  gap = DEFAULT_GAP,
  animationDuration: _animationDuration = DEFAULT_ANIMATION_DURATION,
  className,
}: TypingDotsWebProps): React.JSX.Element | null {
  const typingMotion = useTypingIndicatorMotion({
    isTyping: true,
    dotCount: 3,
    reducedMode: 'static-dots',
  });

  if (!typingMotion.isVisible) {
    return null;
  }

  return (
    <MotionView style={typingMotion.animatedStyle} className={cn('flex items-center', className)}>
      <div className="flex items-center" style={{ gap }}>
        {typingMotion.dots.map((dot) => (
          <MotionView
            key={dot.id}
            style={{
              ...dot.animatedStyle,
              width: dotSize,
              height: dotSize,
              backgroundColor: dotColor,
            }}
            className="rounded-full"
          />
        ))}
      </div>
    </MotionView>
  );
}
