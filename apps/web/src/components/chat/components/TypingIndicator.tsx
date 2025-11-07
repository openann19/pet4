/**
 * Typing Indicator Component
 * 
 * Shows typing indicator for users
 */

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation'
import { WebBubbleWrapper } from '../WebBubbleWrapper'
import { LiquidDots } from '../LiquidDots'

export interface TypingIndicatorProps {
  users: Array<{ userName?: string }>
}

export function TypingIndicator({ users }: TypingIndicatorProps): JSX.Element {
  const animation = useEntryAnimation({ initialY: 20, delay: 0 })
  
  return (
    <AnimatedView
      style={animation.animatedStyle}
      className="flex items-end gap-2 flex-row"
    >
      <Avatar className="w-8 h-8 ring-2 ring-white/20 shrink-0">
        <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
          {users[0]?.userName?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
      <WebBubbleWrapper
        showTyping
        isIncoming
      >
        <LiquidDots enabled dotColor="#9ca3af" />
      </WebBubbleWrapper>
    </AnimatedView>
  )
}
