'use client';
import React from 'react';
import { motion } from '@petspark/motion';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface TypingDotsProps {
  dotSize?: number;
  dotColor?: string;
  gap?: number;
  animationDuration?: number;
  className?: string;
}

const DEFAULT_DOT_SIZE = 6;
const DEFAULT_DOT_COLOR = 'hsl(var(--muted-foreground))';
const DEFAULT_GAP = 4;
const DEFAULT_ANIMATION_DURATION = 1200;

export function TypingDots({
  dotSize = DEFAULT_DOT_SIZE,
  dotColor = DEFAULT_DOT_COLOR,
  gap = DEFAULT_GAP,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  className,
}: TypingDotsProps): React.JSX.Element {
  const _uiConfig = useUIConfig();

  const dotStyle: React.CSSProperties = {
    width: dotSize,
    height: dotSize,
    backgroundColor: dotColor,
    borderRadius: dotSize / 2,
  };

  const animationConfig = {
    scale: [1, 1.4, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: animationDuration / 1000,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  };

  return (
    <div className={cn('flex items-center', className)} style={{ gap }}>
      <motion.div
        style={dotStyle}
        animate={animationConfig}
        className="rounded-full"
      />
      <motion.div
        style={dotStyle}
        animate={animationConfig}
        transition={{
          ...animationConfig.transition,
          delay: 0.15,
        }}
        className="rounded-full"
      />
      <motion.div
        style={dotStyle}
        animate={animationConfig}
        transition={{
          ...animationConfig.transition,
          delay: 0.3,
        }}
        className="rounded-full"
      />
    </div>
  );
}
