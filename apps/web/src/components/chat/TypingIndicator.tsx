import { useMemo } from 'react';
import { MotionView } from '@petspark/motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TypingUser } from '@/lib/chat-types';
import { useTypingIndicatorMotion } from '@/effects/chat/typing';
import { cn } from '@/lib/utils';

export interface TypingIndicatorProps {
  readonly users: readonly TypingUser[];
}

export default function TypingIndicator({ users }: TypingIndicatorProps): JSX.Element | null {
  const displayUsers = useMemo(() => users.slice(0, 3), [users]);
  const isTyping = users.length > 0;
  const typingText = useMemo(() => {
    if (!isTyping) {
      return '';
    }

    const names = users.map(user => user.userName?.trim() || 'Someone');

    if (names.length === 1) {
      return `${names[0]} is typing`;
    }

    if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing`;
    }

    return `${names[0]} and ${users.length - 1} others are typing`;
  }, [isTyping, users]);

  const typingMotion = useTypingIndicatorMotion({
    isTyping,
    dotCount: 3,
    label: typingText,
  });

  if (!typingMotion.isVisible) {
    return null;
  }

  const DOT_SIZE = 6;
  const activeLabel = typingMotion.displayMode === 'text' ? typingMotion.label : typingText;

  return (
    <MotionView
      style={typingMotion.animatedStyle}
      className="flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <Avatar key={user.userId} className="w-4 h-4 ring-1 ring-background">
            <AvatarImage src={(user as { userAvatar?: string }).userAvatar} alt={user.userName} />
            <AvatarFallback className="text-[8px]">{user.userName?.[0] ?? '?'}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center gap-1 text-xs text-primary">
        <span>{activeLabel}</span>
        {typingMotion.displayMode !== 'text' && (
          <div className="flex gap-0.5" aria-hidden="true">
            {typingMotion.dots.map((dot) => (
              <MotionView
                key={dot.id}
                style={{
                  ...dot.animatedStyle,
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                }}
                className={cn('rounded-full bg-primary/80')}
              />
            ))}
          </div>
        )}
      </div>
    </MotionView>
  );
}
