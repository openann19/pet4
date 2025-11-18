import { VirtualMessageList } from '@/components/chat/window/VirtualMessageList';
import { ChatMessageRenderer } from '@/components/chat/window/ChatMessageRenderer';
import type { ChatMessage, TypingUser } from '@/lib/chat-types';
import type  from '@petspark/motion';

interface ChatMessageListSectionProps {
  useVirtualizedList: boolean;
  messages: ChatMessage[] | undefined;
  messageGroups: { date: string; messages: ChatMessage[] }[];
  currentUserId: string;
  currentUserName: string;
  typingUsers: TypingUser[] | { userId: string; userName?: string }[];
  voiceMessages: Record<string, { blob: string; duration: number; waveform: number[] }> | undefined;
  playingVoice: string | null;
  messageBubbleHover: { handleEnter: () => void; handleLeave: () => void };
  messageBubbleHoverStyle: AnimatedStyle;
  voiceButtonHover: { handleEnter: () => void; handleLeave: () => void };
  voiceButtonHoverStyle: AnimatedStyle;
  voiceButtonTapStyle: AnimatedStyle;
  dateGroupStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  typingIndicatorStyle: AnimatedStyle;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleVoicePlayback: (messageId: string) => void;
}

/**
 * Renders the message list section (either virtualized or standard)
 */
export function ChatMessageListSection({
  useVirtualizedList,
  messages,
  messageGroups,
  currentUserId,
  currentUserName,
  typingUsers,
  voiceMessages,
  playingVoice,
  messageBubbleHover,
  messageBubbleHoverStyle,
  voiceButtonHover,
  voiceButtonHoverStyle,
  voiceButtonTapStyle,
  dateGroupStyle,
  messageItemStyle,
  typingIndicatorStyle,
  onReaction,
  onToggleVoicePlayback,
}: ChatMessageListSectionProps) {
  if (useVirtualizedList) {
    return (
      <VirtualMessageList
        messages={messages ?? []}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        typingUsers={typingUsers as TypingUser[]}
        onReaction={onReaction}
        onTranslate={(): void => {
          // Translation not implemented yet
        }}
      />
    );
  }

  return (
    <ChatMessageRenderer
      messageGroups={messageGroups}
      currentUserId={currentUserId}
      voiceMessages={voiceMessages}
      playingVoice={playingVoice}
      messageBubbleHover={messageBubbleHover}
      messageBubbleHoverStyle={messageBubbleHoverStyle}
      voiceButtonHover={voiceButtonHover}
      voiceButtonHoverStyle={voiceButtonHoverStyle}
      voiceButtonTapStyle={voiceButtonTapStyle}
      dateGroupStyle={dateGroupStyle}
      messageItemStyle={messageItemStyle}
      typingIndicatorStyle={typingIndicatorStyle}
      typingUsers={typingUsers}
      onToggleVoicePlayback={onToggleVoicePlayback}
    />
  );
}

