'use client';;
import { MotionView } from "@petspark/motion";

import { useTypingPlaceholder } from '@/hooks/use-typing-placeholder';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface TypingPlaceholderProps {
  enabled?: boolean;
  isOwn?: boolean;
  className?: string;
}

export function TypingPlaceholder({
  enabled = true,
  isOwn = false,
  className,
}: TypingPlaceholderProps): React.JSX.Element {
    const _uiConfig = useUIConfig();
    const { animatedStyles, containerStyle } = useTypingPlaceholder({
        enabled,
        barCount: 3,
        barWidth: 4,
        barHeight: 32,
        animationDuration: 600,
      });

  return (
    <MotionView
      style={containerStyle}
      className={cn(
        'flex items-end gap-1.5 px-3 py-2 rounded-2xl max-w-[78%]',
        isOwn
          ? 'bg-linear-to-br from-primary to-accent rounded-br-sm'
          : 'bg-card border border-border rounded-bl-sm',
        className
      )}
    >
      {animatedStyles.map((style, index) => (
        <MotionView
          key={index}
          style={style}
          className={cn('rounded-full', isOwn ? 'bg-white/80' : 'bg-muted-foreground/60')}
        >
          <div className="w-full h-full" />
        </MotionView>
      ))}
    </MotionView>
  );
}
