import { toast } from 'sonner';
import { flags } from '@petspark/config';
import { Button } from '@/components/ui/button';
import { PaperPlaneRight } from '@phosphor-icons/react';
import type { ChatRoom } from '@/lib/chat-types';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { VirtualMessageList } from './VirtualMessageList';
import { ChatInputBar } from './ChatInputBar';
import { Overlays } from './Overlays';
import { ChatErrorBoundary } from './ChatErrorBoundary';
import { AnnounceNewMessage, AnnounceTyping } from './LiveRegions';
import type { ChatMessage } from '@/lib/chat-types';
import type { InputRef } from '@/components/ui/input';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

interface AdvancedChatWindowContentProps {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  messages: ChatMessage[] | undefined;
  typingUsers: { userName?: string | null }[];
  inputValue: string;
  inputRef: React.RefObject<InputRef>;
  showTemplates: boolean;
  showStickers: boolean;
  isRecordingVoice: boolean;
  scrollFabVisible: boolean;
  scrollFabStyleValue: unknown;
  lastIncomingText: string | null;
  burstSeed: number;
  confettiSeed: number;
  scrollRef: React.RefObject<HTMLDivElement>;
  headerAnimations: {
    headerStyle: React.CSSProperties;
    typingContainerStyle: React.CSSProperties;
    typingTextStyle: React.CSSProperties;
    typingDotsStyle: React.CSSProperties;
    videoButtonHover: {
      scale: unknown;
      translateY: unknown;
      handleEnter: () => void;
      handleLeave: () => void;
    };
    voiceButtonHover: {
      scale: unknown;
      translateY: unknown;
      handleEnter: () => void;
      handleLeave: () => void;
    };
  };
  inputAnimations: {
    templatesStyle: AnimatedStyle;
    templateButtonHover: {
      animatedStyle: AnimatedStyle;
      handleEnter: () => void;
      handleLeave: () => void;
    };
    templateButtonTap: {
      animatedStyle: AnimatedStyle;
      handlePress: () => void;
    };
    stickerButtonTap: { animatedStyle: AnimatedStyle };
    stickerButtonHover: {
      animatedStyle: AnimatedStyle;
      handleEnter: () => void;
      handleLeave: () => void;
    };
    emojiButtonTap: { animatedStyle: AnimatedStyle };
    emojiButtonHover: {
      animatedStyle: AnimatedStyle;
      handleEnter: () => void;
      handleLeave: () => void;
    };
    sendButtonHover: {
      animatedStyle: AnimatedStyle;
      handleEnter: () => void;
      handleLeave: () => void;
    };
    sendButtonTap: { animatedStyle: AnimatedStyle };
  };
  onBack?: () => void;
  onSendMessage: (content: string, type?: 'text' | 'sticker' | 'voice') => void;
  onReaction: (messageId: string, emoji: string) => void;
  onTranslate: (messageId: string) => Promise<void>;
  onInputChange: (value: string) => void;
  onUseTemplate: (template: string) => void;
  onVoiceRecorded: (audioBlob: Blob, duration: number, waveform: number[]) => void;
  onVoiceCancel: () => void;
  onStartRecording: () => void;
  setShowTemplates: (show: boolean) => void;
  setShowStickers: (show: boolean) => void;
  scrollToBottom: () => void;
}

export function AdvancedChatWindowContent({
  room,
  currentUserId,
  currentUserName,
  messages,
  typingUsers,
  inputValue,
  inputRef,
  showTemplates,
  showStickers,
  isRecordingVoice,
  scrollFabVisible,
  scrollFabStyleValue,
  lastIncomingText,
  burstSeed,
  confettiSeed,
  scrollRef,
  headerAnimations,
  inputAnimations,
  onBack,
  onSendMessage,
  onReaction,
  onTranslate,
  onInputChange,
  onUseTemplate,
  onVoiceRecorded,
  onVoiceCancel,
  onStartRecording,
  setShowTemplates,
  setShowStickers,
  scrollToBottom,
}: AdvancedChatWindowContentProps): JSX.Element {
  const useVirtualization = flags().chat.virtualization;

  return (
    <div className="flex flex-col h-full relative">
      <a
        href="#composer"
        className="sr-only focus:not-sr-only focus:absolute focus:p-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:rounded"
      >
        Skip to composer
      </a>
      <ChatErrorBoundary>
        <ChatHeader
          room={room}
          typingUsers={typingUsers}
          headerStyle={headerAnimations.headerStyle}
          typingContainerStyle={headerAnimations.typingContainerStyle}
          typingTextStyle={headerAnimations.typingTextStyle}
          typingDotsStyle={headerAnimations.typingDotsStyle}
          videoButtonHover={headerAnimations.videoButtonHover}
          voiceButtonHover={headerAnimations.voiceButtonHover}
          onBack={onBack}
          onVideoCall={(): void => {
            toast.info('Video call feature coming soon');
          }}
          onVoiceCall={(): void => {
            toast.info('Voice call feature coming soon');
          }}
        />
      </ChatErrorBoundary>

      <ChatErrorBoundary>
        {useVirtualization ? (
          <VirtualMessageList
            messages={messages ?? []}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            typingUsers={typingUsers}
            onReaction={onReaction}
            onTranslate={(messageId: string): void => {
              void onTranslate(messageId);
            }}
          />
        ) : (
          <MessageList
            messages={messages ?? []}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            typingUsers={typingUsers}
            onReaction={onReaction}
            onTranslate={(messageId: string): void => {
              void onTranslate(messageId);
            }}
            scrollRef={scrollRef}
          />
        )}
      </ChatErrorBoundary>

      <AnnounceNewMessage lastText={lastIncomingText} />
      <AnnounceTyping userName={typingUsers[0]?.userName ?? null} />

      <ChatErrorBoundary>
        <Overlays burstSeed={burstSeed} confettiSeed={confettiSeed} roomId={room.id} />
      </ChatErrorBoundary>

      {scrollFabVisible && (
        <div className="fixed bottom-24 right-6 z-40">
          <Button
            style={scrollFabStyleValue}
            size="sm"
            className="rounded-full shadow-lg bg-primary hover:bg-primary/90 w-10 h-10 p-0"
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <PaperPlaneRight size={20} weight="fill" />
          </Button>
        </div>
      )}

      <ChatErrorBoundary>
        <ChatInputBar
          inputValue={inputValue}
          inputRef={inputRef}
          showTemplates={showTemplates}
          showStickers={showStickers}
          isRecording={isRecordingVoice}
          templatesStyle={inputAnimations.templatesStyle}
          templateButtonHover={inputAnimations.templateButtonHover}
          templateButtonTap={inputAnimations.templateButtonTap}
          stickerButtonTap={inputAnimations.stickerButtonTap}
          stickerButtonHover={inputAnimations.stickerButtonHover}
          emojiButtonTap={inputAnimations.emojiButtonTap}
          emojiButtonHover={inputAnimations.emojiButtonHover}
          sendButtonHover={inputAnimations.sendButtonHover}
          sendButtonTap={inputAnimations.sendButtonTap}
          onInputChange={onInputChange}
          onSendMessage={onSendMessage}
          onUseTemplate={onUseTemplate}
          onVoiceRecorded={onVoiceRecorded}
          onVoiceCancel={onVoiceCancel}
          onStartRecording={onStartRecording}
          setShowTemplates={setShowTemplates}
          setShowStickers={setShowStickers}
        />
      </ChatErrorBoundary>
    </div>
  );
}

