'use client';

import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import TypingIndicatorComponent from '../TypingIndicator';
import { MessageItem } from './MessageItem';
import type { ChatMessage } from '@/lib/chat-types';
import { groupMessagesByDate } from '@/lib/chat-utils';
import { AnimatePresence } from '@/effects/reanimated/animate-presence';
import type { RefObject } from 'react';

export interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  typingUsers: { userName?: string }[];
  onReaction: (messageId: string, emoji: string) => void;
  onTranslate: (messageId: string) => void;
  scrollRef: RefObject<HTMLDivElement>;
}

export function MessageList({
  messages,
  currentUserId,
  currentUserName,
  typingUsers,
  onReaction,
  onTranslate,
  scrollRef,
}: MessageListProps): JSX.Element {
  const groups = groupMessagesByDate(messages || []);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
      {groups.map((group, groupIdx) => (
        <div key={group.date} className="space-y-4">
          <DateGroup date={group.date} delay={groupIdx * 100} />
          {group.messages.map((m, idx) => (
            <MessageItem
              key={m.id}
              message={m}
              isCurrentUser={m.senderId === currentUserId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              delay={idx * 50}
              onReaction={onReaction}
              onTranslate={onTranslate}
            />
          ))}
        </div>
      ))}
      {typingUsers.length > 0 && (
        <AnimatePresence>
          <TypingIndicatorComponent key="typing" users={typingUsers} />
        </AnimatePresence>
      )}
    </div>
  );
}

interface DateGroupProps {
  date: string;
  delay: number;
}

function DateGroup({ date, delay }: DateGroupProps): JSX.Element {
  const anim = useEntryAnimation({ initialScale: 0.8, delay });

  return (
    <AnimatedView style={anim.animatedStyle} className="flex justify-center">
      <div className="glass-effect px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
        {date}
      </div>
    </AnimatedView>
  );
}
