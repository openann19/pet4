import React from 'react';
import { ChatHeader } from '@/components/chat/window/ChatHeader';
import { ChatInputBar } from '@/components/chat/window/ChatInputBar';
import { ChatCallNotifications } from '@/components/chat/window/ChatCallNotifications';
import { ChatMessageListSection } from '@/components/chat/window/ChatMessageListSection';
import type { ChatRoom, ChatMessage } from '@/lib/chat-types';
import type { Call, CallSession } from '@/lib/call-types';
import { haptics } from '@/lib/haptics';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import type { InputRef } from '@/components/ui/input';
import type { SharedValue } from '@petspark/motion';

interface ChatWindowContentProps {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  typingUsers: { userId: string; userName?: string }[];
  messages: ChatMessage[] | undefined;
  messageGroups: { date: string; messages: ChatMessage[] }[];
  voiceMessages: Record<string, { blob: string; duration: number; waveform: number[] }> | undefined;
  playingVoice: string | null;
  useVirtualizedList: boolean;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  headerStyle: AnimatedStyle;
  typingContainerStyle: AnimatedStyle;
  typingTextStyle: AnimatedStyle;
  typingDotsStyle: AnimatedStyle;
  videoButtonHover: { scale: unknown; translateY: unknown; handleEnter: () => void; handleLeave: () => void };
  voiceButtonHover: { scale: unknown; translateY: unknown; handleEnter: () => void; handleLeave: () => void };
  messageBubbleHover: { handleEnter: () => void; handleLeave: () => void };
  messageBubbleHoverStyle: AnimatedStyle;
  voiceButtonHoverStyle: AnimatedStyle;
  voiceButtonTapStyle: AnimatedStyle;
  dateGroupStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  typingIndicatorStyle: AnimatedStyle;
  templatesStyle: AnimatedStyle;
  templateButtonHover: { animatedStyle: AnimatedStyle; handleEnter: () => void; handleLeave: () => void };
  templateButtonTap: { animatedStyle: AnimatedStyle; handlePress: () => void };
  stickerButtonTap: { animatedStyle: AnimatedStyle };
  stickerButtonHover: { animatedStyle: AnimatedStyle; handleEnter: () => void; handleLeave: () => void };
  emojiButtonTap: { animatedStyle: AnimatedStyle };
  emojiButtonHover: { animatedStyle: AnimatedStyle; handleEnter: () => void; handleLeave: () => void };
  sendButtonHover: { animatedStyle: AnimatedStyle; handleEnter: () => void; handleLeave: () => void };
  sendButtonTap: { animatedStyle: AnimatedStyle };
  inputValue: string;
  inputRef: React.RefObject<InputRef>;
  showTemplates: boolean;
  showStickers: boolean;
  setShowTemplates: (show: boolean) => void;
  setShowStickers: (show: boolean) => void;
  handleInputChange: (value: string) => void;
  handleSendMessage: (content: string, type?: 'text' | 'sticker' | 'voice') => void;
  handleUseTemplate: (template: string) => void;
  handleVoiceRecorded: (audioBlob: Blob, duration: number, waveform: number[]) => void;
  handleVoiceCancel: () => void;
  toggleVoicePlayback: (messageId: string) => void;
  handleReaction: (messageId: string, emoji: string) => void;
  handleVoiceCall: () => void;
  handleVideoCall: () => void;
  activeCall: CallSession | null | undefined;
  incomingCall: Call | null | undefined;
  answerCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  onBack?: () => void;
}

function useChatHeaderStyles({
  headerStyle,
  typingContainerStyle,
  typingTextStyle,
  typingDotsStyle,
}: {
  headerStyle: AnimatedStyle;
  typingContainerStyle: AnimatedStyle;
  typingTextStyle: AnimatedStyle;
  typingDotsStyle: AnimatedStyle;
}) {
  return {
    headerStyleValue: useAnimatedStyleValue(headerStyle),
    typingContainerStyleValue: useAnimatedStyleValue(typingContainerStyle),
    typingTextStyleValue: useAnimatedStyleValue(typingTextStyle),
    typingDotsStyleValue: useAnimatedStyleValue(typingDotsStyle),
  };
}

function ChatCallNotificationsWrapper(props: {
  room: ChatRoom;
  incomingCall: Call | null | undefined;
  activeCall: CallSession | null | undefined;
  answerCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}): React.JSX.Element {
  return (
    <ChatCallNotifications
      room={props.room}
      incomingCall={props.incomingCall}
      activeCall={props.activeCall}
      answerCall={props.answerCall}
      declineCall={props.declineCall}
      endCall={props.endCall}
      toggleMute={props.toggleMute}
      toggleVideo={props.toggleVideo}
    />
  );
}

function ChatHeaderWrapper({
  room,
  typingUsers,
  headerStyleValue,
  typingContainerStyleValue,
  typingTextStyleValue,
  typingDotsStyleValue,
  videoButtonHover,
  voiceButtonHover,
  onBack,
  handleVideoCall,
  handleVoiceCall,
}: {
  room: ChatRoom;
  typingUsers: { userId: string; userName?: string }[];
  headerStyleValue: React.CSSProperties;
  typingContainerStyleValue: React.CSSProperties;
  typingTextStyleValue: React.CSSProperties;
  typingDotsStyleValue: React.CSSProperties;
  videoButtonHover: { scale: unknown; translateY: unknown; handleEnter: () => void; handleLeave: () => void };
  voiceButtonHover: { scale: unknown; translateY: unknown; handleEnter: () => void; handleLeave: () => void };
  onBack?: () => void;
  handleVideoCall: () => void;
  handleVoiceCall: () => void;
}): React.JSX.Element {
  return (
    <ChatHeader
      room={room}
      typingUsers={typingUsers}
      headerStyle={headerStyleValue}
      typingContainerStyle={typingContainerStyleValue}
      typingTextStyle={typingTextStyleValue}
      typingDotsStyle={typingDotsStyleValue}
      videoButtonHover={videoButtonHover as { scale: number | SharedValue<number>; translateY: number | SharedValue<number>; handleEnter: () => void; handleLeave: () => void }}
      voiceButtonHover={voiceButtonHover as { scale: number | SharedValue<number>; translateY: number | SharedValue<number>; handleEnter: () => void; handleLeave: () => void }}
      onBack={onBack}
      onVideoCall={handleVideoCall}
      onVoiceCall={handleVoiceCall}
    />
  );
}

function ChatInputBarWrapper(props: {
  inputValue: string;
  inputRef: React.RefObject<InputRef>;
  showTemplates: boolean;
  showStickers: boolean;
  isRecording: boolean;
  templatesStyle: AnimatedStyle;
  templateButtonHover: { animatedStyle: AnimatedStyle; handleEnter: () => void; handleLeave: () => void };
  templateButtonTap: { animatedStyle: AnimatedStyle; handlePress: () => void };
  stickerButtonTap: { animatedStyle: AnimatedStyle };
  stickerButtonHover: { animatedStyle: AnimatedStyle; handleEnter: () => void; handleLeave: () => void };
  emojiButtonTap: { animatedStyle: AnimatedStyle };
  emojiButtonHover: { animatedStyle: AnimatedStyle; handleEnter: () => void; handleLeave: () => void };
  sendButtonHover: { animatedStyle: AnimatedStyle; handleEnter: () => void; handleLeave: () => void };
  sendButtonTap: { animatedStyle: AnimatedStyle };
  onInputChange: (value: string) => void;
  onSendMessage: (content: string, type?: 'text' | 'sticker' | 'voice') => void;
  onUseTemplate: (template: string) => void;
  onVoiceRecorded: (audioBlob: Blob, duration: number, waveform: number[]) => void;
  onVoiceCancel: () => void;
  setIsRecording: (recording: boolean) => void;
  setShowTemplates: (show: boolean) => void;
  setShowStickers: (show: boolean) => void;
}): React.JSX.Element {
  return (
    <ChatInputBar
      inputValue={props.inputValue}
      inputRef={props.inputRef}
      showTemplates={props.showTemplates}
      showStickers={props.showStickers}
      isRecording={props.isRecording}
      templatesStyle={props.templatesStyle}
      templateButtonHover={props.templateButtonHover}
      templateButtonTap={props.templateButtonTap}
      stickerButtonTap={props.stickerButtonTap}
      stickerButtonHover={props.stickerButtonHover}
      emojiButtonTap={props.emojiButtonTap}
      emojiButtonHover={props.emojiButtonHover}
      sendButtonHover={props.sendButtonHover}
      sendButtonTap={props.sendButtonTap}
      onInputChange={props.onInputChange}
      onSendMessage={props.onSendMessage}
      onUseTemplate={props.onUseTemplate}
      onVoiceRecorded={props.onVoiceRecorded}
      onVoiceCancel={props.onVoiceCancel}
      onStartRecording={() => {
        haptics.trigger('medium');
        props.setIsRecording(true);
      }}
      setShowTemplates={props.setShowTemplates}
      setShowStickers={props.setShowStickers}
    />
  );
}

function ChatMessageListSectionWrapper(props: {
  useVirtualizedList: boolean;
  messages: ChatMessage[] | undefined;
  messageGroups: { date: string; messages: ChatMessage[] }[];
  currentUserId: string;
  currentUserName: string;
  typingUsers: { userId: string; userName?: string }[];
  voiceMessages: Record<string, { blob: string; duration: number; waveform: number[] }> | undefined;
  playingVoice: string | null;
  messageBubbleHover: { handleEnter: () => void; handleLeave: () => void };
  messageBubbleHoverStyle: AnimatedStyle;
  voiceButtonHover: { scale: unknown; translateY: unknown; handleEnter: () => void; handleLeave: () => void };
  voiceButtonHoverStyle: AnimatedStyle;
  voiceButtonTapStyle: AnimatedStyle;
  dateGroupStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  typingIndicatorStyle: AnimatedStyle;
  handleReaction: (messageId: string, emoji: string) => void;
  toggleVoicePlayback: (messageId: string) => void;
}): React.JSX.Element {
  return (
    <ChatMessageListSection
      useVirtualizedList={props.useVirtualizedList}
      messages={props.messages}
      messageGroups={props.messageGroups}
      currentUserId={props.currentUserId}
      currentUserName={props.currentUserName}
      typingUsers={props.typingUsers}
      voiceMessages={props.voiceMessages}
      playingVoice={props.playingVoice}
      messageBubbleHover={props.messageBubbleHover}
      messageBubbleHoverStyle={props.messageBubbleHoverStyle}
      voiceButtonHover={props.voiceButtonHover}
      voiceButtonHoverStyle={props.voiceButtonHoverStyle}
      voiceButtonTapStyle={props.voiceButtonTapStyle}
      dateGroupStyle={props.dateGroupStyle}
      messageItemStyle={props.messageItemStyle}
      typingIndicatorStyle={props.typingIndicatorStyle}
      onReaction={props.handleReaction}
      onToggleVoicePlayback={props.toggleVoicePlayback}
    />
  );
}

function ChatInputBarSection(props: {
  inputValue: string;
  inputRef: React.RefObject<InputRef>;
  showTemplates: boolean;
  showStickers: boolean;
  isRecording: boolean;
  templatesStyle: AnimatedStyle;
  templateButtonHover: { animatedStyle: AnimatedStyle; handleEnter: () => void; handleLeave: () => void };
  templateButtonTap: { animatedStyle: AnimatedStyle; handlePress: () => void };
  stickerButtonTap: { animatedStyle: AnimatedStyle };
  stickerButtonHover: { animatedStyle: AnimatedStyle; handleEnter: () => void; handleLeave: () => void };
  emojiButtonTap: { animatedStyle: AnimatedStyle };
  emojiButtonHover: { animatedStyle: AnimatedStyle; handleEnter: () => void; handleLeave: () => void };
  sendButtonHover: { animatedStyle: AnimatedStyle; handleEnter: () => void; handleLeave: () => void };
  sendButtonTap: { animatedStyle: AnimatedStyle };
  handleInputChange: (value: string) => void;
  handleSendMessage: (content: string, type?: 'text' | 'sticker' | 'voice') => void;
  handleUseTemplate: (template: string) => void;
  handleVoiceRecorded: (audioBlob: Blob, duration: number, waveform: number[]) => void;
  handleVoiceCancel: () => void;
  setIsRecording: (recording: boolean) => void;
  setShowTemplates: (show: boolean) => void;
  setShowStickers: (show: boolean) => void;
}): React.JSX.Element {
  return (
    <ChatInputBarWrapper
      inputValue={props.inputValue}
      inputRef={props.inputRef}
      showTemplates={props.showTemplates}
      showStickers={props.showStickers}
      isRecording={props.isRecording}
      templatesStyle={props.templatesStyle}
      templateButtonHover={props.templateButtonHover}
      templateButtonTap={props.templateButtonTap}
      stickerButtonTap={props.stickerButtonTap}
      stickerButtonHover={props.stickerButtonHover}
      emojiButtonTap={props.emojiButtonTap}
      emojiButtonHover={props.emojiButtonHover}
      sendButtonHover={props.sendButtonHover}
      sendButtonTap={props.sendButtonTap}
      onInputChange={props.handleInputChange}
      onSendMessage={props.handleSendMessage}
      onUseTemplate={props.handleUseTemplate}
      onVoiceRecorded={props.handleVoiceRecorded}
      onVoiceCancel={props.handleVoiceCancel}
      setIsRecording={props.setIsRecording}
      setShowTemplates={props.setShowTemplates}
      setShowStickers={props.setShowStickers}
    />
  );
}

function ChatMainContent(
  props: ChatWindowContentProps & {
    headerStyleValue: React.CSSProperties;
    typingContainerStyleValue: React.CSSProperties;
    typingTextStyleValue: React.CSSProperties;
    typingDotsStyleValue: React.CSSProperties;
  }
): React.JSX.Element {
  return (
    <div className="flex flex-col h-full">
      <ChatHeaderWrapper
        room={props.room}
        typingUsers={props.typingUsers}
        headerStyleValue={props.headerStyleValue}
        typingContainerStyleValue={props.typingContainerStyleValue}
        typingTextStyleValue={props.typingTextStyleValue}
        typingDotsStyleValue={props.typingDotsStyleValue}
        videoButtonHover={props.videoButtonHover}
        voiceButtonHover={props.voiceButtonHover}
        onBack={props.onBack}
        handleVideoCall={props.handleVideoCall}
        handleVoiceCall={props.handleVoiceCall}
      />
      <ChatMessageListSectionWrapper
        useVirtualizedList={props.useVirtualizedList}
        messages={props.messages}
        messageGroups={props.messageGroups}
        currentUserId={props.currentUserId}
        currentUserName={props.currentUserName}
        typingUsers={props.typingUsers}
        voiceMessages={props.voiceMessages}
        playingVoice={props.playingVoice}
        messageBubbleHover={props.messageBubbleHover}
        messageBubbleHoverStyle={props.messageBubbleHoverStyle}
        voiceButtonHover={props.voiceButtonHover}
        voiceButtonHoverStyle={props.voiceButtonHoverStyle}
        voiceButtonTapStyle={props.voiceButtonTapStyle}
        dateGroupStyle={props.dateGroupStyle}
        messageItemStyle={props.messageItemStyle}
        typingIndicatorStyle={props.typingIndicatorStyle}
        handleReaction={props.handleReaction}
        toggleVoicePlayback={props.toggleVoicePlayback}
      />
      <ChatInputBarSection {...props} />
    </div>
  );
}

function useChatWindowStyles(props: {
  headerStyle: AnimatedStyle;
  typingContainerStyle: AnimatedStyle;
  typingTextStyle: AnimatedStyle;
  typingDotsStyle: AnimatedStyle;
}) {
  return useChatHeaderStyles({
    headerStyle: props.headerStyle,
    typingContainerStyle: props.typingContainerStyle,
    typingTextStyle: props.typingTextStyle,
    typingDotsStyle: props.typingDotsStyle,
  });
}

/**
 * Main content component for chat window
 */
export function ChatWindowContent(props: ChatWindowContentProps) {
  const styles = useChatWindowStyles({
    headerStyle: props.headerStyle,
    typingContainerStyle: props.typingContainerStyle,
    typingTextStyle: props.typingTextStyle,
    typingDotsStyle: props.typingDotsStyle,
  });

  return (
    <>
      <ChatCallNotificationsWrapper
        room={props.room}
        incomingCall={props.incomingCall}
        activeCall={props.activeCall}
        answerCall={props.answerCall}
        declineCall={props.declineCall}
        endCall={props.endCall}
        toggleMute={props.toggleMute}
        toggleVideo={props.toggleVideo}
      />
      <ChatMainContent {...props} {...styles} />
    </>
  );
}

