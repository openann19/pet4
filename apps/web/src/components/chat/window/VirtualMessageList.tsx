'use client';

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ChatMessage, TypingUser } from '@/lib/chat-types';
import { groupMessagesByDate } from '@/lib/chat-utils';
import { MessageItem } from './MessageItem';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import TypingIndicatorComponent from '../TypingIndicator';
import { AnimatePresence } from '@/effects/reanimated/animate-presence';
import { useFeatureFlag } from '@/lib/feature-flags';

export interface VirtualMessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  typingUsers: TypingUser[];
  onReaction: (messageId: string, emoji: string) => void;
  onTranslate: (messageId: string) => void;
  className?: string;
}

interface FlatRow {
  type: 'header' | 'msg' | 'typing';
  key: string;
  date?: string;
  msg?: ChatMessage;
}

const DEFAULT_HEADER_HEIGHT = 36;
const DEFAULT_TYPING_HEIGHT = 60;
const DEFAULT_MESSAGE_HEIGHT = 84;
const MAX_MESSAGE_HEIGHT = 400;
const OVERSCAN = 12;

export function VirtualMessageList({
  messages,
  currentUserId,
  currentUserName,
  typingUsers,
  onReaction,
  onTranslate,
  className,
}: VirtualMessageListProps): JSX.Element {
  const useVirtualizedList = useFeatureFlag('chat.virtualization');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const sizeCacheRef = React.useRef<Map<number, number>>(new Map());
  const groups = React.useMemo(() => groupMessagesByDate(messages || []), [messages]);

  const flat = React.useMemo((): FlatRow[] => {
    const out: FlatRow[] = [];
    for (const g of groups) {
      out.push({ type: 'header', key: `h:${g.date}`, date: g.date });
      for (const m of g.messages) {
        out.push({ type: 'msg', key: m.id, msg: m });
      }
    }
    if (typingUsers.length > 0) {
      out.push({ type: 'typing', key: 'typing' });
    }
    return out;
  }, [groups, typingUsers]);

  const estimateSize = React.useCallback(
    (index: number): number => {
      const cached = sizeCacheRef.current.get(index);
      if (cached != null) {
        return cached;
      }

      const row = flat[index];
      if (!row) {
        return DEFAULT_MESSAGE_HEIGHT;
      }

      if (row.type === 'header') {
        return DEFAULT_HEADER_HEIGHT;
      }
      if (row.type === 'typing') {
        return DEFAULT_TYPING_HEIGHT;
      }

      if (row.msg) {
        const baseHeight = DEFAULT_MESSAGE_HEIGHT;
        let extraHeight = 0;

        if (row.msg.content && row.msg.content.length > 100) {
          extraHeight += Math.min(Math.floor(row.msg.content.length / 100) * 20, 200);
        }

        if (row.msg.attachments && row.msg.attachments.length > 0) {
          extraHeight += row.msg.attachments.length * 60;
        }

        if (row.msg.reactions) {
          const reactionCount = Array.isArray(row.msg.reactions)
            ? row.msg.reactions.length
            : Object.values(row.msg.reactions).flat().length;
          if (reactionCount > 0) {
            extraHeight += 30;
          }
        }

        const totalHeight = Math.min(baseHeight + extraHeight, MAX_MESSAGE_HEIGHT);
        sizeCacheRef.current.set(index, totalHeight);
        return totalHeight;
      }

      return DEFAULT_MESSAGE_HEIGHT;
    },
    [flat]
  );

  const rowVirtualizer = useVirtualizer({
    count: flat.length,
    getScrollElement: () => containerRef.current,
    estimateSize,
    overscan: useVirtualizedList ? OVERSCAN : 0,
    measureElement:
      typeof window !== 'undefined' && 'ResizeObserver' in window
        ? (element, entry, instance) => {
          if (!element) {
            return DEFAULT_MESSAGE_HEIGHT;
          }
          const index = parseInt(element.getAttribute('data-index') ?? '-1', 10);
          if (index >= 0) {
            const height = element.getBoundingClientRect().height;
            sizeCacheRef.current.set(index, height);
            return height;
          }
          return DEFAULT_MESSAGE_HEIGHT;
        }
        : undefined,
  });

  React.useEffect(() => {
    sizeCacheRef.current.clear();
    rowVirtualizer.measure();
  }, [messages.length, rowVirtualizer]);

  const headerFx = useEntryAnimation({ initialScale: 0.8, delay: 0 });

  if (!useVirtualizedList || flat.length < 50) {
    return (
      <div ref={containerRef} className={`flex-1 overflow-y-auto p-4 ${className ?? ''}`}>
        {groups.map((g) => (
          <React.Fragment key={g.date}>
            <AnimatedView style={headerFx.animatedStyle} className="flex justify-center py-2">
              <div className="glass-effect px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                {g.date}
              </div>
            </AnimatedView>
            {g.messages.map((m) => (
              <MessageItem
                key={m.id}
                message={m}
                isCurrentUser={m.senderId === currentUserId}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                delay={0}
                onReaction={onReaction}
                onTranslate={onTranslate}
              />
            ))}
          </React.Fragment>
        ))}
        {typingUsers.length > 0 && (
          <AnimatePresence>
            <TypingIndicatorComponent key="typing" users={typingUsers} />
          </AnimatePresence>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto p-4 ${className ?? ''}`}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      aria-atomic="false"
    >
      <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((vi) => {
          const row = flat[vi.index];
          if (!row) {
            return null;
          }

          return (
            <div
              key={row.key}
              data-index={vi.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${String(vi.start ?? '')}px)`,
              }}
            >
              {row.type === 'header' ? (
                <AnimatedView style={headerFx.animatedStyle} className="flex justify-center py-2">
                  <div className="glass-effect px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                    {row.date}
                  </div>
                </AnimatedView>
              ) : row.type === 'typing' ? (
                <AnimatePresence>
                  <TypingIndicatorComponent key="typing" users={typingUsers} />
                </AnimatePresence>
              ) : row.type === 'msg' && row.msg ? (
                <MessageItem
                  message={row.msg}
                  isCurrentUser={row.msg.senderId === currentUserId}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  delay={0}
                  onReaction={onReaction}
                  onTranslate={onTranslate}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
