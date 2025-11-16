'use client';;
import { MotionView } from "@petspark/motion";

import { useTypingIndicator } from './effects/useTypingIndicator';
import { type AnimatedStyle } from '@/effects/reanimated/animated-view';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface TypingDotsProps {
  dotSize?: number;
  dotColor?: string;
  className?: string;
  enabled?: boolean;
}

export function TypingDots({
  dotSize = 6,
  dotColor = 'hsl(var(--muted-foreground))',
  className,
  enabled = true,
}: TypingDotsProps): React.JSX.Element {
    const _uiConfig = useUIConfig();
    const { dotStyles, containerStyle } = useTypingIndicator({
        enabled,
        dotSize,
      });

  return (
    <MotionView
      style={containerStyle as AnimatedStyle}
      className={cn('flex items-center gap-1', className)}
    >
      {dotStyles.map((style, index) => (
        <MotionView key={index} style={style as AnimatedStyle} className="rounded-full">
          <div style={{ backgroundColor: dotColor }} />
        </MotionView>
      ))}
    </MotionView>
  );
}
