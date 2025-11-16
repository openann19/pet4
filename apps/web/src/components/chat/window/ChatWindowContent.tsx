import { MotionView } from '@petspark/motion';
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence';
import CallInterface from '@/components/call/CallInterface';
import IncomingCallNotification from '@/components/call/IncomingCallNotification';
import { ChatHeader } from '@/components/chat/window/ChatHeader';
import { VirtualMessageList } from '@/components/chat/window/VirtualMessageList';
import { ChatMessageRenderer } from '@/components/chat/window/ChatMessageRenderer';
import { ChatInputBar } from '@/components/chat/window/ChatInputBar';
import type { ChatRoom, ChatMessage } from '@/lib/chat-types';
import { haptics } from '@/lib/haptics';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

interface ChatWindowContentProps {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  typingUsers: Array<{ userId: string; userName?: string }>;
  messages: ChatMessage[] | undefined;
  messageGroups: Array<{ date: string; messages: ChatMessage[] }>;
  voiceMessages: Record<string, { blob: string; duration: number; waveform: number[] }> | undefined;
  playingVoice: string | null;
  useVirtualizedList: boolean;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  headerStyle: AnimatedStyle;
  typingContainerStyle: AnimatedStyle;
  typingTextStyle: AnimatedStyle;
  typingDotsStyle: AnimatedStyle;
  videoButtonHover: { handleEnter: () => void; handleLeave: () => void };
  voiceButtonHover: { handleEnter: () => void; handleLeave: () => void };
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
  inputRef: React.RefObject<HTMLInputElement>;
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
  activeCall: unknown;
  incomingCall: unknown;
  answerCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  onBack?: () => void;
}

/**
 * Main content component for chat window
 */
export function ChatWindowContent({
  room,
  currentUserId,
  currentUserName,
  typingUsers,
  messages,
  messageGroups,
  voiceMessages,
  playingVoice,
  useVirtualizedList,
  isRecording,
  setIsRecording,
  headerStyle,
  typingContainerStyle,
  typingTextStyle,
  typingDotsStyle,
  videoButtonHover,
  voiceButtonHover,
  messageBubbleHover,
  messageBubbleHoverStyle,
  voiceButtonHoverStyle,
  voiceButtonTapStyle,
  dateGroupStyle,
  messageItemStyle,
  typingIndicatorStyle,
  templatesStyle,
  templateButtonHover,
  templateButtonTap,
  stickerButtonTap,
  stickerButtonHover,
  emojiButtonTap,
  emojiButtonHover,
  sendButtonHover,
  sendButtonTap,
  inputValue,
  inputRef,
  showTemplates,
  showStickers,
  setShowTemplates,
  setShowStickers,
  handleInputChange,
  handleSendMessage,
  handleUseTemplate,
  handleVoiceRecorded,
  handleVoiceCancel,
  toggleVoicePlayback,
  handleReaction,
  handleVoiceCall,
  handleVideoCall,
  activeCall,
  incomingCall,
  answerCall,
  declineCall,
  endCall,
  toggleMute,
  toggleVideo,
  onBack,
}: ChatWindowContentProps) {
  const incomingCallPresence = useAnimatePresence({
    isVisible: !!(incomingCall && room.matchedPetName),
  });
  const activeCallPresence = useAnimatePresence({ isVisible: !!activeCall });

  return (
    <>
      {incomingCallPresence.shouldRender && incomingCall && room.matchedPetName && (
        <MotionView animatedStyle={incomingCallPresence.animatedStyle}>
          <IncomingCallNotification
            call={incomingCall}
            callerName={room.matchedPetName ?? ''}
            {...(room.matchedPetPhoto ? { callerAvatar: room.matchedPetPhoto } : {})}
            onAccept={answerCall}
            onDecline={declineCall}
          />
        </MotionView>
      )}
      {activeCallPresence.shouldRender && activeCall && (
        <MotionView animatedStyle={activeCallPresence.animatedStyle}>
          <CallInterface
            session={activeCall}
            onEndCall={endCall}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
          />
        </MotionView>
      )}
      <div className="flex flex-col h-full">
        <ChatHeader
          room={room}
          typingUsers={typingUsers}
          headerStyle={headerStyle}
          typingContainerStyle={typingContainerStyle}
          typingTextStyle={typingTextStyle}
          typingDotsStyle={typingDotsStyle}
          videoButtonHover={videoButtonHover}
          voiceButtonHover={voiceButtonHover}
          onBack={onBack}
          onVideoCall={handleVideoCall}
          onVoiceCall={handleVoiceCall}
        />

        {useVirtualizedList ? (
          <VirtualMessageList
            messages={messages ?? []}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            typingUsers={typingUsers}
            onReaction={handleReaction}
            onTranslate={(): void => {
              // Translation not implemented yet
            }}
          />
        ) : (
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
            onToggleVoicePlayback={toggleVoicePlayback}
          />
        )}

        <ChatInputBar
          inputValue={inputValue}
          inputRef={inputRef}
          showTemplates={showTemplates}
          showStickers={showStickers}
          isRecording={isRecording}
          templatesStyle={templatesStyle}
          templateButtonHover={templateButtonHover}
          templateButtonTap={templateButtonTap}
          stickerButtonTap={stickerButtonTap}
          stickerButtonHover={stickerButtonHover}
          emojiButtonTap={emojiButtonTap}
          emojiButtonHover={emojiButtonHover}
          sendButtonHover={sendButtonHover}
          sendButtonTap={sendButtonTap}
          onInputChange={handleInputChange}
          onSendMessage={handleSendMessage}
          onUseTemplate={handleUseTemplate}
          onVoiceRecorded={handleVoiceRecorded}
          onVoiceCancel={handleVoiceCancel}
          onStartRecording={() => {
            haptics.trigger('medium');
            setIsRecording(true);
          }}
          setShowTemplates={setShowTemplates}
          setShowStickers={setShowStickers}
        />
      </div>
    </>
  );
}

