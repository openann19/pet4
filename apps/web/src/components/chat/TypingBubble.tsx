'use client';

import { cn } from '@/lib/utils';
import { TypingDots } from './TypingDots';
import { TypingDotsWeb } from './TypingDotsWeb';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface TypingBubbleProps {
  isIncoming?: boolean;
  variant?: 'mobile' | 'web';
  dotSize?: number;
  dotColor?: string;
  className?: string;
  bubbleClassName?: string;
}

export function TypingBubble({
  isIncoming = true,
  variant = 'web',
  dotSize,
  dotColor,
  className,
  bubbleClassName,
}: TypingBubbleProps): React.JSX.Element {
    const _uiConfig = useUIConfig();
    const isMobile = variant === 'mobile';

  return (
    <div
      className={cn(
        'relative rounded-2xl p-3 max-w-[85%]',
        isIncoming
          ? 'bg-(--color-neutral-8) text-white rounded-bl-sm'
          : 'bg-(--color-accent-9) text-white rounded-br-sm',
        bubbleClassName,
        className
      )}
      style={{
        alignSelf: isIncoming ? 'flex-start' : 'flex-end',
      }}
    >
      {isMobile ? (
        <TypingDots {...(dotSize !== undefined ? { dotSize } : {})} dotColor={dotColor ?? 'var(--color-neutral-a9)'} />
      ) : (
        <TypingDotsWeb
          {...(dotSize !== undefined ? { dotSize } : {})}
          dotColor={dotColor ?? 'var(--color-neutral-a9)'}
        />
      )}
    </div>
  );
}
