import { MotionView } from '@petspark/motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { WebBubbleWrapper } from '../WebBubbleWrapper';
import { useTypingIndicatorMotion } from '@/effects/chat/typing';
import { cn } from '@/lib/utils';

export interface TypingIndicatorProps {
  users: { userName?: string }[];
}

export function TypingIndicator({ users }: TypingIndicatorProps): JSX.Element | null {
  const animation = useEntryAnimation({ initialY: 20, delay: 0 });
  const typingMotion = useTypingIndicatorMotion({
    isTyping: users.length > 0,
    reducedMode: 'static-dots',
  });

  if (!typingMotion.isVisible) {
    return null;
  }

  const DOT_SIZE = 6;

  return (
    <MotionView style={animation.animatedStyle} className="flex items-end gap-2 flex-row">
      <Avatar className="w-8 h-8 ring-2 ring-white/20 shrink-0">
        <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
          {users[0]?.userName?.[0] ?? '?'}
        </AvatarFallback>
      </Avatar>
      <WebBubbleWrapper showTyping isIncoming>
        <div className="flex items-center gap-1" aria-hidden="true">
          {typingMotion.dots.map((dot) => (
            <MotionView
              key={dot.id}
              style={{
                ...dot.animatedStyle,
                width: DOT_SIZE,
                height: DOT_SIZE,
              }}
              className={cn('rounded-full bg-(--color-neutral-a9)')}
            />
          ))}
        </div>
      </WebBubbleWrapper>
    </MotionView>
  );
}
