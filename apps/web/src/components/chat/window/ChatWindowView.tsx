import {
  AnnounceNewMessage,
  AnnounceTyping,
  SkipToComposer,
} from '@/components/chat/window/LiveRegions';
import { ChatWindowContent } from '@/components/chat/window/ChatWindowContent';
import type { ChatRoom } from '@/lib/chat-types';

interface ChatWindowViewProps {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  onBack?: () => void;
  chatWindowData: {
    inputHook: { inputRef: React.RefObject<HTMLInputElement> };
    lastMessageText: string | null;
    lastMessageSender: string | null;
    typingUser: string | null;
    multipleTypingUsers: boolean;
    typingUsers: Array<{ userId: string; userName?: string }>;
    messages: unknown;
    messageGroups: Array<{ date: string; messages: unknown[] }>;
    voiceMessages: Record<string, { blob: string; duration: number; waveform: number[] }> | undefined;
    playingVoice: string | null;
    useVirtualizedList: boolean;
    isRecording: boolean;
    setIsRecording: (recording: boolean) => void;
    headerStyle: unknown;
    typingContainerStyle: unknown;
    typingTextStyle: unknown;
    typingDotsStyle: unknown;
    videoButtonHover: { handleEnter: () => void; handleLeave: () => void };
    voiceButtonHover: { handleEnter: () => void; handleLeave: () => void };
    messageBubbleHover: { handleEnter: () => void; handleLeave: () => void };
    messageBubbleHoverStyle: unknown;
    voiceButtonHoverStyle: unknown;
    voiceButtonTapStyle: unknown;
    dateGroupStyle: unknown;
    messageItemStyle: unknown;
    typingIndicatorStyle: unknown;
    templatesStyle: unknown;
    templateButtonHoverStyle: unknown;
    templateButtonHover: { handleEnter: () => void; handleLeave: () => void };
    templateButtonTapStyle: unknown;
    templateButtonTap: { handlePress: () => void };
    stickerButtonTapStyle: unknown;
    stickerButtonHoverStyle: unknown;
    stickerButtonHover: { handleEnter: () => void; handleLeave: () => void };
    emojiButtonTapStyle: unknown;
    emojiButtonHoverStyle: unknown;
    emojiButtonHover: { handleEnter: () => void; handleLeave: () => void };
    sendButtonHoverStyle: unknown;
    sendButtonHover: { handleEnter: () => void; handleLeave: () => void };
    sendButtonTapStyle: unknown;
    inputHook: {
      inputValue: string;
      inputRef: React.RefObject<HTMLInputElement>;
      showTemplates: boolean;
      showStickers: boolean;
      setShowTemplates: (show: boolean) => void;
      setShowStickers: (show: boolean) => void;
      handleSendMessage: (content: string, type?: 'text' | 'sticker' | 'voice') => void;
      handleUseTemplate: (template: string) => void;
    };
    handleInputChange: (value: string) => void;
    handleVoiceRecorded: (audioBlob: Blob, duration: number, waveform: number[]) => void;
    handleVoiceCancel: () => void;
    toggleVoicePlayback: (messageId: string) => void;
    handleReaction: (messageId: string, emoji: string) => void;
    handleVoiceCall: () => void;
    handleVideoCall: () => void;
    activeCall: unknown;
    incomingCall: unknown;
    answerCall: () => void;
    declineCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
  };
}

/**
 * View component that renders the chat window UI
 */
export function ChatWindowView({
  room,
  currentUserId,
  currentUserName,
  onBack,
  chatWindowData,
}: ChatWindowViewProps) {
  return (
    <>
      <SkipToComposer inputRef={chatWindowData.inputHook.inputRef} />
      <AnnounceNewMessage
        lastText={chatWindowData.lastMessageText}
        senderName={chatWindowData.lastMessageSender}
      />
      <AnnounceTyping
        userName={chatWindowData.typingUser}
        multipleUsers={chatWindowData.multipleTypingUsers}
      />
      <ChatWindowContent
        room={room}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        typingUsers={chatWindowData.typingUsers}
        messages={chatWindowData.messages}
        messageGroups={chatWindowData.messageGroups}
        voiceMessages={chatWindowData.voiceMessages}
        playingVoice={chatWindowData.playingVoice}
        useVirtualizedList={chatWindowData.useVirtualizedList}
        isRecording={chatWindowData.isRecording}
        setIsRecording={chatWindowData.setIsRecording}
        headerStyle={chatWindowData.headerStyle}
        typingContainerStyle={chatWindowData.typingContainerStyle}
        typingTextStyle={chatWindowData.typingTextStyle}
        typingDotsStyle={chatWindowData.typingDotsStyle}
        videoButtonHover={chatWindowData.videoButtonHover}
        voiceButtonHover={chatWindowData.voiceButtonHover}
        messageBubbleHover={chatWindowData.messageBubbleHover}
        messageBubbleHoverStyle={chatWindowData.messageBubbleHoverStyle}
        voiceButtonHoverStyle={chatWindowData.voiceButtonHoverStyle}
        voiceButtonTapStyle={chatWindowData.voiceButtonTapStyle}
        dateGroupStyle={chatWindowData.dateGroupStyle}
        messageItemStyle={chatWindowData.messageItemStyle}
        typingIndicatorStyle={chatWindowData.typingIndicatorStyle}
        templatesStyle={chatWindowData.templatesStyle}
        templateButtonHover={{
          animatedStyle: chatWindowData.templateButtonHoverStyle,
          handleEnter: chatWindowData.templateButtonHover.handleEnter,
          handleLeave: chatWindowData.templateButtonHover.handleLeave,
        }}
        templateButtonTap={{
          animatedStyle: chatWindowData.templateButtonTapStyle,
          handlePress: chatWindowData.templateButtonTap.handlePress,
        }}
        stickerButtonTap={{ animatedStyle: chatWindowData.stickerButtonTapStyle }}
        stickerButtonHover={{
          animatedStyle: chatWindowData.stickerButtonHoverStyle,
          handleEnter: chatWindowData.stickerButtonHover.handleEnter,
          handleLeave: chatWindowData.stickerButtonHover.handleLeave,
        }}
        emojiButtonTap={{ animatedStyle: chatWindowData.emojiButtonTapStyle }}
        emojiButtonHover={{
          animatedStyle: chatWindowData.emojiButtonHoverStyle,
          handleEnter: chatWindowData.emojiButtonHover.handleEnter,
          handleLeave: chatWindowData.emojiButtonHover.handleLeave,
        }}
        sendButtonHover={{
          animatedStyle: chatWindowData.sendButtonHoverStyle,
          handleEnter: chatWindowData.sendButtonHover.handleEnter,
          handleLeave: chatWindowData.sendButtonHover.handleLeave,
        }}
        sendButtonTap={{ animatedStyle: chatWindowData.sendButtonTapStyle }}
        inputValue={chatWindowData.inputHook.inputValue}
        inputRef={chatWindowData.inputHook.inputRef}
        showTemplates={chatWindowData.inputHook.showTemplates}
        showStickers={chatWindowData.inputHook.showStickers}
        setShowTemplates={chatWindowData.inputHook.setShowTemplates}
        setShowStickers={chatWindowData.inputHook.setShowStickers}
        handleInputChange={chatWindowData.handleInputChange}
        handleSendMessage={chatWindowData.inputHook.handleSendMessage}
        handleUseTemplate={chatWindowData.inputHook.handleUseTemplate}
        handleVoiceRecorded={chatWindowData.handleVoiceRecorded}
        handleVoiceCancel={chatWindowData.handleVoiceCancel}
        toggleVoicePlayback={chatWindowData.toggleVoicePlayback}
        handleReaction={chatWindowData.handleReaction}
        handleVoiceCall={chatWindowData.handleVoiceCall}
        handleVideoCall={chatWindowData.handleVideoCall}
        activeCall={chatWindowData.activeCall}
        incomingCall={chatWindowData.incomingCall}
        answerCall={(): void => {
          void chatWindowData.answerCall();
        }}
        declineCall={chatWindowData.declineCall}
        endCall={chatWindowData.endCall}
        toggleMute={chatWindowData.toggleMute}
        toggleVideo={chatWindowData.toggleVideo}
        onBack={onBack}
      />
    </>
  );
}

