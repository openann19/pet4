import { MotionView } from "@petspark/motion";
/**
 * Typing Indicator Component
 *
 * Shows typing indicator for users
 */

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { WebBubbleWrapper } from '../WebBubbleWrapper';
import { LiquidDots } from '../LiquidDots';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface TypingIndicatorProps {
  users: { userName?: string }[];
}

export function TypingIndicator({ users }: TypingIndicatorProps): JSX.Element {
    const _uiConfig = useUIConfig();
    const animation = useEntryAnimation({ initialY: 20, delay: 0 });

  return (
    <MotionView style={animation.animatedStyle} className="flex items-end gap-2 flex-row">
      <Avatar className="w-8 h-8 ring-2 ring-white/20 shrink-0">
        <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
          {users[0]?.userName?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
      <WebBubbleWrapper showTyping isIncoming>
        <LiquidDots enabled dotColor="hsl(var(--muted-foreground))" />
      </WebBubbleWrapper>
    </MotionView>
  );
}
