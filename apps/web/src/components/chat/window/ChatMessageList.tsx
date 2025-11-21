/**
 * Chat Message List Component
 * Message list with date groups, typing indicators, and virtualized list support
 */

import { MotionView } from '@petspark/motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { WebBubbleWrapper } from '@/components/chat/WebBubbleWrapper';
import { VirtualMessageList } from '@/components/chat/window/VirtualMessageList';
import type { ChatMessage, TypingUser } from '@/lib/chat-types';
import type { AnimatedStyle } from '@petspark/motion';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import { ChatMessageBubble } from './ChatMessageBubble';

export interface ChatMessageListProps {
  useVirtualizedList: boolean;
  messages: ChatMessage[];
  messageGroups: { date: string; messages: ChatMessage[] }[];
  currentUserId: string;
  currentUserName: string;
  typingUsers: { userName?: string | null; userId?: string | null }[];
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

function VirtualizedMessageListWrapper({
  messages,
  currentUserId,
  currentUserName,
  typingUsers,
  onReaction,
}: {
  messages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  typingUsers: { userName?: string | null; userId?: string | null }[];
  onReaction: (messageId: string, emoji: string) => void;
}): React.JSX.Element {
  const typedTypingUsers: TypingUser[] = typingUsers
    .filter((u) => Boolean(u.userName ?? u.userId))
    .map((u) => ({
      userName: u.userName ?? '',
      userId: u.userId ?? '',
      startedAt: new Date().toISOString(),
    }));
  return (
    <VirtualMessageList
      messages={messages ?? []}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      typingUsers={typedTypingUsers}
      onReaction={onReaction}
      onTranslate={() => {
        // Translation not implemented yet
      }}
    />
  );
}

function TypingIndicatorView({
  typingUsers,
  style,
}: {
  typingUsers: { userName?: string | null }[];
  style: React.CSSProperties;
}): React.JSX.Element | null {
  if (typingUsers.length === 0) return null;
  
  return (
    <MotionView
      key="typing-indicators"
      className="flex items-end gap-2 flex-row p-4"
      style={style}
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
  );
}

function DateGroupHeader({ date, style }: { date: string; style: React.CSSProperties }): React.JSX.Element {
  return (
    <MotionView className="flex justify-center" style={style}>
      <div className="glass-effect px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
        {date}
      </div>
    </MotionView>
  );
}

function MessageBubbleItem({
  message,
  currentUserId,
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
  onReaction,
  onToggleVoicePlayback,
  onShowReactions,
}: {
  message: ChatMessage;
  currentUserId: string;
  voiceMessages?: Record<string, { blob: string; duration: number; waveform: number[] }>;
  playingVoice: string | null;
  showReactions: string | null;
  messageBubbleHover: ChatMessageListProps['messageBubbleHover'];
  voiceButtonHover: ChatMessageListProps['voiceButtonHover'];
  voiceButtonTap: ChatMessageListProps['voiceButtonTap'];
  reactionButtonHover: ChatMessageListProps['reactionButtonHover'];
  reactionButtonTap: ChatMessageListProps['reactionButtonTap'];
  reactionContainerStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleVoicePlayback: (messageId: string) => void;
  onShowReactions: (messageId: string | null) => void;
}): React.JSX.Element {
  const isCurrentUser = message.senderId === currentUserId;
  return (
    <ChatMessageBubble
      key={message.id}
      message={message}
      isCurrentUser={isCurrentUser}
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
}

function MessageGroupList({
  messages,
  currentUserId,
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
  onReaction,
  onToggleVoicePlayback,
  onShowReactions,
}: {
  messages: ChatMessage[];
  currentUserId: string;
  voiceMessages?: Record<string, { blob: string; duration: number; waveform: number[] }>;
  playingVoice: string | null;
  showReactions: string | null;
  messageBubbleHover: ChatMessageListProps['messageBubbleHover'];
  voiceButtonHover: ChatMessageListProps['voiceButtonHover'];
  voiceButtonTap: ChatMessageListProps['voiceButtonTap'];
  reactionButtonHover: ChatMessageListProps['reactionButtonHover'];
  reactionButtonTap: ChatMessageListProps['reactionButtonTap'];
  reactionContainerStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleVoicePlayback: (messageId: string) => void;
  onShowReactions: (messageId: string | null) => void;
}): React.JSX.Element {
  return (
    <>
      {messages.map((message: ChatMessage) => (
        <MessageBubbleItem
          key={message.id}
          message={message}
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
      ))}
    </>
  );
}

function MessageDateGroup({
  group,
  currentUserId,
  dateGroupStyleValue,
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
  onReaction,
  onToggleVoicePlayback,
  onShowReactions,
}: {
  group: { date: string; messages: ChatMessage[] };
  currentUserId: string;
  dateGroupStyleValue: React.CSSProperties;
  voiceMessages?: Record<string, { blob: string; duration: number; waveform: number[] }>;
  playingVoice: string | null;
  showReactions: string | null;
  messageBubbleHover: ChatMessageListProps['messageBubbleHover'];
  voiceButtonHover: ChatMessageListProps['voiceButtonHover'];
  voiceButtonTap: ChatMessageListProps['voiceButtonTap'];
  reactionButtonHover: ChatMessageListProps['reactionButtonHover'];
  reactionButtonTap: ChatMessageListProps['reactionButtonTap'];
  reactionContainerStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleVoicePlayback: (messageId: string) => void;
  onShowReactions: (messageId: string | null) => void;
}): React.JSX.Element {
  return (
    <div className="space-y-4">
      <DateGroupHeader date={group.date} style={dateGroupStyleValue} />
      <MessageGroupList
        messages={group.messages}
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
    </div>
  );
}

function MessageGroupItem({
  group,
  currentUserId,
  dateGroupStyleValue,
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
  onReaction,
  onToggleVoicePlayback,
  onShowReactions,
}: {
  group: { date: string; messages: ChatMessage[] };
  currentUserId: string;
  dateGroupStyleValue: React.CSSProperties;
  voiceMessages?: Record<string, { blob: string; duration: number; waveform: number[] }>;
  playingVoice: string | null;
  showReactions: string | null;
  messageBubbleHover: ChatMessageListProps['messageBubbleHover'];
  voiceButtonHover: ChatMessageListProps['voiceButtonHover'];
  voiceButtonTap: ChatMessageListProps['voiceButtonTap'];
  reactionButtonHover: ChatMessageListProps['reactionButtonHover'];
  reactionButtonTap: ChatMessageListProps['reactionButtonTap'];
  reactionContainerStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleVoicePlayback: (messageId: string) => void;
  onShowReactions: (messageId: string | null) => void;
}): React.JSX.Element {
  return (
    <MessageDateGroup
      key={group.date}
      group={group}
      currentUserId={currentUserId}
      dateGroupStyleValue={dateGroupStyleValue}
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
}

function MessageGroupsList(props: {
  messageGroups: { date: string; messages: ChatMessage[] }[];
  currentUserId: string;
  dateGroupStyleValue: React.CSSProperties;
  voiceMessages?: Record<string, { blob: string; duration: number; waveform: number[] }>;
  playingVoice: string | null;
  showReactions: string | null;
  messageBubbleHover: ChatMessageListProps['messageBubbleHover'];
  voiceButtonHover: ChatMessageListProps['voiceButtonHover'];
  voiceButtonTap: ChatMessageListProps['voiceButtonTap'];
  reactionButtonHover: ChatMessageListProps['reactionButtonHover'];
  reactionButtonTap: ChatMessageListProps['reactionButtonTap'];
  reactionContainerStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleVoicePlayback: (messageId: string) => void;
  onShowReactions: (messageId: string | null) => void;
}): React.JSX.Element {
  return (
    <>
      {props.messageGroups.map((group) => (
        <MessageGroupItem
          key={group.date}
          group={group}
          currentUserId={props.currentUserId}
          dateGroupStyleValue={props.dateGroupStyleValue}
          voiceMessages={props.voiceMessages}
          playingVoice={props.playingVoice}
          showReactions={props.showReactions}
          messageBubbleHover={props.messageBubbleHover}
          voiceButtonHover={props.voiceButtonHover}
          voiceButtonTap={props.voiceButtonTap}
          reactionButtonHover={props.reactionButtonHover}
          reactionButtonTap={props.reactionButtonTap}
          reactionContainerStyle={props.reactionContainerStyle}
          messageItemStyle={props.messageItemStyle}
          onReaction={props.onReaction}
          onToggleVoicePlayback={props.onToggleVoicePlayback}
          onShowReactions={props.onShowReactions}
        />
      ))}
    </>
  );
}

function MessageScrollContainer({
  scrollRef,
  children,
}: {
  scrollRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
      {children}
    </div>
  );
}

function MessageListContent({
  messageGroups,
  currentUserId,
  dateGroupStyleValue,
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
  onReaction,
  onToggleVoicePlayback,
  onShowReactions,
}: {
  messageGroups: { date: string; messages: ChatMessage[] }[];
  currentUserId: string;
  dateGroupStyleValue: React.CSSProperties;
  voiceMessages?: Record<string, { blob: string; duration: number; waveform: number[] }>;
  playingVoice: string | null;
  showReactions: string | null;
  messageBubbleHover: ChatMessageListProps['messageBubbleHover'];
  voiceButtonHover: ChatMessageListProps['voiceButtonHover'];
  voiceButtonTap: ChatMessageListProps['voiceButtonTap'];
  reactionButtonHover: ChatMessageListProps['reactionButtonHover'];
  reactionButtonTap: ChatMessageListProps['reactionButtonTap'];
  reactionContainerStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleVoicePlayback: (messageId: string) => void;
  onShowReactions: (messageId: string | null) => void;
}): React.JSX.Element {
  return (
    <MessageGroupsList
      messageGroups={messageGroups}
      currentUserId={currentUserId}
      dateGroupStyleValue={dateGroupStyleValue}
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
}

function StandardMessageList(props: {
  messageGroups: { date: string; messages: ChatMessage[] }[];
  currentUserId: string;
  dateGroupStyleValue: React.CSSProperties;
  typingIndicatorStyleValue: React.CSSProperties;
  voiceMessages?: Record<string, { blob: string; duration: number; waveform: number[] }>;
  playingVoice: string | null;
  showReactions: string | null;
  messageBubbleHover: ChatMessageListProps['messageBubbleHover'];
  voiceButtonHover: ChatMessageListProps['voiceButtonHover'];
  voiceButtonTap: ChatMessageListProps['voiceButtonTap'];
  reactionButtonHover: ChatMessageListProps['reactionButtonHover'];
  reactionButtonTap: ChatMessageListProps['reactionButtonTap'];
  reactionContainerStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  typingUsers: { userName?: string | null; userId?: string | null }[];
  scrollRef: React.RefObject<HTMLDivElement>;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleVoicePlayback: (messageId: string) => void;
  onShowReactions: (messageId: string | null) => void;
}): React.JSX.Element {
  return (
    <>
      <MessageScrollContainer scrollRef={props.scrollRef}>
        <MessageListContent
          messageGroups={props.messageGroups}
          currentUserId={props.currentUserId}
          dateGroupStyleValue={props.dateGroupStyleValue}
          voiceMessages={props.voiceMessages}
          playingVoice={props.playingVoice}
          showReactions={props.showReactions}
          messageBubbleHover={props.messageBubbleHover}
          voiceButtonHover={props.voiceButtonHover}
          voiceButtonTap={props.voiceButtonTap}
          reactionButtonHover={props.reactionButtonHover}
          reactionButtonTap={props.reactionButtonTap}
          reactionContainerStyle={props.reactionContainerStyle}
          messageItemStyle={props.messageItemStyle}
          onReaction={props.onReaction}
          onToggleVoicePlayback={props.onToggleVoicePlayback}
          onShowReactions={props.onShowReactions}
        />
      </MessageScrollContainer>
      <TypingIndicatorView typingUsers={props.typingUsers} style={props.typingIndicatorStyleValue} />
    </>
  );
}

export function ChatMessageList(props: ChatMessageListProps) {
  if (props.useVirtualizedList) {
    return (
      <VirtualizedMessageListWrapper
        messages={props.messages}
        currentUserId={props.currentUserId}
        currentUserName={props.currentUserName}
        typingUsers={props.typingUsers}
        onReaction={props.onReaction}
      />
    );
  }

  const dateGroupStyleValue = useAnimatedStyleValue(props.dateGroupStyle);
  const typingIndicatorStyleValue = useAnimatedStyleValue(props.typingIndicatorStyle);

  return (
    <StandardMessageList
      messageGroups={props.messageGroups}
      currentUserId={props.currentUserId}
      dateGroupStyleValue={dateGroupStyleValue}
      typingIndicatorStyleValue={typingIndicatorStyleValue}
      voiceMessages={props.voiceMessages}
      playingVoice={props.playingVoice}
      showReactions={props.showReactions}
      messageBubbleHover={props.messageBubbleHover}
      voiceButtonHover={props.voiceButtonHover}
      voiceButtonTap={props.voiceButtonTap}
      reactionButtonHover={props.reactionButtonHover}
      reactionButtonTap={props.reactionButtonTap}
      reactionContainerStyle={props.reactionContainerStyle}
      messageItemStyle={props.messageItemStyle}
      typingUsers={props.typingUsers}
      scrollRef={props.scrollRef}
      onReaction={props.onReaction}
      onToggleVoicePlayback={props.onToggleVoicePlayback}
      onShowReactions={props.onShowReactions}
    />
  );
}
