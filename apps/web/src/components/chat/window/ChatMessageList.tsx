/**
 * Chat Message List Component
 * Message list with date groups, typing indicators, and virtualized list support
 */

import { MotionView } from '@petspark/motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { WebBubbleWrapper } from '@/components/chat/WebBubbleWrapper';
import { VirtualMessageList } from '@/components/chat/window/VirtualMessageList';
import type { ChatMessage } from '@/lib/chat-types';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { ChatMessageBubble } from './ChatMessageBubble';

export interface ChatMessageListProps {
  useVirtualizedList: boolean;
  messages: ChatMessage[];
  messageGroups: Array<{ date: string; messages: ChatMessage[] }>;
  currentUserId: string;
  currentUserName: string;
  typingUsers: Array<{ userName?: string | null; userId?: string | null }>;
  voiceMessages?: Record<string, { blob: string; duration: number; waveform: number[] }>;
  playingVoice: string | null;
  showReactions: string | null;
  messageBubbleHover: {
    animatedStyle: AnimatedStyle;
    handleEnter: () => void;
    handleLeave: () => void;
  };
  voiceButtonHover: {
    animatedStyle: AnimatedStyle;
    handleEnter: () => void;
    handleLeave: () => void;
  };
  voiceButtonTap: {
    animatedStyle: AnimatedStyle;
  };
  reactionButtonHover: {
    animatedStyle: AnimatedStyle;
    handleEnter: () => void;
    handleLeave: () => void;
  };
  reactionButtonTap: {
    animatedStyle: AnimatedStyle;
  };
  reactionContainerStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  dateGroupStyle: AnimatedStyle;
  typingIndicatorStyle: AnimatedStyle;
  scrollRef: React.RefObject<HTMLDivElement>;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleVoicePlayback: (messageId: string) => void;
  onShowReactions: (messageId: string | null) => void;
}

export function ChatMessageList({
  useVirtualizedList,
  messages,
  messageGroups,
  currentUserId,
  currentUserName,
  typingUsers,
  voiceMessages,
  playingVoice,
  showReactions,
  messageBubbleHover,
  voiceButtonHover,
  voiceButtonTap,
  reactionButtonHover,
  reactionButtonTap,
  reactionContainerStyle,
  messageItemStyle,
  dateGroupStyle,
  typingIndicatorStyle,
  scrollRef,
  onReaction,
  onToggleVoicePlayback,
  onShowReactions,
}: ChatMessageListProps) {
  if (useVirtualizedList) {
    return (
      <VirtualMessageList
        messages={messages ?? []}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        typingUsers={typingUsers}
        onReaction={onReaction}
        onTranslate={() => { }}
      />
    );
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messageGroups.map((group: { date: string; messages: ChatMessage[] }) => (
          <div key={group.date} className="space-y-4">
            <MotionView className="flex justify-center" style={dateGroupStyle}>
              <div className="glass-effect px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                {group.date}
              </div>
            </MotionView>

            {group.messages.map((message: ChatMessage) => {
              const isCurrentUser = message.senderId === currentUserId;

              return (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  isCurrentUser={isCurrentUser}
                  currentUserId={currentUserId}
                  voiceMessages={voiceMessages}
                  playingVoice={playingVoice}
                  showReactions={showReactions}
                  messageBubbleHover={messageBubbleHover}
                  voiceButtonHover={voiceButtonHover}
                  voiceButtonTap={voiceButtonTap}
                  reactionButtonHover={reactionButtonHover}
                  reactionButtonTap={reactionButtonTap}
                  reactionContainerStyle={reactionContainerStyle}
                  messageItemStyle={messageItemStyle}
                  onReaction={onReaction}
                  onToggleVoicePlayback={onToggleVoicePlayback}
                  onShowReactions={onShowReactions}
                />
              );
            })}
          </div>
        ))}
      </div>

      {typingUsers.length > 0 && (
        <MotionView
          key="typing-indicators"
          className="flex items-end gap-2 flex-row p-4"
          style={typingIndicatorStyle}
        >
          <Avatar className="w-8 h-8 ring-2 ring-white/20 shrink-0">
            <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
              {typingUsers[0]?.userName?.[0] ?? '?'}
            </AvatarFallback>
          </Avatar>
          <WebBubbleWrapper showTyping isIncoming>
            <div />
          </WebBubbleWrapper>
        </MotionView>
      )}
    </>
  );
}

