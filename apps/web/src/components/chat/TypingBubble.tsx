'use client'

import { cn } from '@/lib/utils'
import { TypingDots } from './TypingDots'
import { TypingDotsWeb } from './TypingDotsWeb'

export interface TypingBubbleProps {
  isIncoming?: boolean
  variant?: 'mobile' | 'web'
  dotSize?: number
  dotColor?: string
  className?: string
  bubbleClassName?: string
}

export function TypingBubble({
  isIncoming = true,
  variant = 'web',
  dotSize,
  dotColor,
  className,
  bubbleClassName
}: TypingBubbleProps): React.JSX.Element {
  const isMobile = variant === 'mobile'

  return (
    <div
      className={cn(
        'relative rounded-2xl p-3 max-w-[85%]',
        isIncoming
          ? 'bg-[#2E2E2E] text-white rounded-bl-sm'
          : 'bg-[#005AE0] text-white rounded-br-sm',
        bubbleClassName,
        className
      )}
      style={{
        alignSelf: isIncoming ? 'flex-start' : 'flex-end'
      }}
    >
      {isMobile ? (
        <TypingDots
          {...(dotSize !== undefined ? { dotSize } : {})}
          dotColor={dotColor ?? '#aaa'}
        />
      ) : (
        <TypingDotsWeb
          {...(dotSize !== undefined ? { dotSize } : {})}
          dotColor={dotColor ?? '#9ca3af'}
        />
      )}
    </div>
  )
}

