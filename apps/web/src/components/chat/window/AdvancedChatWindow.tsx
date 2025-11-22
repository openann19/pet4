'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { realtime } from '@/lib/realtime';
import type {
  ChatMessage,
  ChatRoom,
} from '@/lib/chat-types';
import { useTypingManager } from '@/hooks/use-typing-manager';
import { useStorage } from '@/hooks/use-storage';
import { useScrollFabMagnetic } from '@/effects/chat/ui/use-scroll-fab-magnetic';
import { Button } from '@/components/ui/button';
import { PaperPlaneRight } from '@phosphor-icons/react';

import { chatApi } from '@/api/chat-api';
import { ChatHeader } from '../components/ChatHeader';
import { MessageList } from './MessageList';
import { VirtualMessageList } from './VirtualMessageList';
import { ChatInputBar } from './ChatInputBar';
import { Overlays } from './Overlays';
import { ChatErrorBoundary } from './ChatErrorBoundary';
import { AnnounceNewMessage, AnnounceTyping } from './LiveRegions';
import { useOutbox } from '@petspark/chat-core';
import { flags } from '@petspark/config';
import { useInteractiveAnimations } from '@/hooks/useInteractiveAnimations';
import { useChatKeyboardShortcuts } from '@/hooks/chat/use-chat-keyboard-shortcuts';
import { useMessageHandling } from '@/hooks/chat/use-message-handling';

import type { InputRef } from '@/components/ui/input';

export interface AdvancedChatWindowProps {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onBack?: () => void;
}

export default function AdvancedChatWindow({
  room,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onBack,
}: AdvancedChatWindowProps): JSX.Element {
  const [messages, setMessages] = useStorage<ChatMessage[]>(`chat-messages-${room.id}`, []);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [awayMode, setAwayMode] = useStorage<boolean>(`away-mode-${currentUserId}`, false);
  const [scrollFabVisible, setScrollFabVisible] = useState(false);
  const [previousBadgeCount, setPreviousBadgeCount] = useState(0);
  const [lastIncomingText, setLastIncomingText] = useState<string | null>(null);
  const inputRef = useRef<InputRef>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    templatesStyle,
    templateButtonHover,
    templateButtonTap,
    stickerButtonHover,
    stickerButtonTap,
    emojiButtonHover,
    emojiButtonTap,
    sendButtonHover,
    sendButtonTap,
  } = useInteractiveAnimations();

  const { enqueue } = useOutbox({
    sendFn: async (payload: unknown) => {
      const p = payload as {
        messageId: string;
        roomId: string;
        content: string;
        senderId: string;
        type: string;
        timestamp: string;
      };
      await chatApi.sendMessage(p.roomId, {
        type: p.type as ChatMessage['type'],
        content: p.content,
      });
    },
  });

  const {
    typingUsers,
    handleInputChange: typingChange,
    handleMessageSend: typingSend,
  } = useTypingManager({
    roomId: room.id,
    currentUserId,
    currentUserName,
    realtimeClient: realtime,
  });

  const {
    onSend,
    onReaction,
    onTranslate,
    inputValue,
    setInputValue,
    showStickers,
    setShowStickers,
    showTemplates,
    setShowTemplates,
    confettiSeed,
    burstSeed,
  } = useMessageHandling(
    messages,
    (value) => void setMessages(value),
    currentUserId,
    currentUserName,
    enqueue,
    room,
    typingSend,
    currentUserAvatar
  );

  useEffect(() => {
    const lastMsg = messages?.[messages.length - 1];
    if (lastMsg && lastMsg.senderId !== currentUserId && lastMsg.content) {
      setLastIncomingText(lastMsg.content);
    }
  }, [messages, currentUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const c = messages?.length ?? 0;
    if (c > previousBadgeCount) {
      setPreviousBadgeCount(c);
    }
  }, [messages, previousBadgeCount]);

  useEffect(() => {
    if (typingUsers.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [typingUsers]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setScrollFabVisible(!nearBottom);
    };

    el.addEventListener('scroll', onScroll);
    onScroll();

    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, [messages]);

  const scrollFab = useScrollFabMagnetic({
    enabled: true,
    isVisible: scrollFabVisible,
    badgeCount: messages?.length ?? 0,
    previousBadgeCount,
  });

  // Register keyboard shortcuts for chat actions
  useChatKeyboardShortcuts({
    enabled: true,
    context: 'chat',
    onSend: () => {
      if (inputValue.trim()) {
        onSend(inputValue, 'text');
      }
    },
    onReply: undefined,
    onDelete: undefined,
    onReact: undefined,
    onScrollToBottom: () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    },
    onFocusInput: () => {
      inputRef.current?.focus();
    },
    onClose: onBack,
    inputRef,
    messageFocused: false,
  });

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
          awayMode={awayMode}
          {...(onBack ? { onBack } : {})}
          onToggleAwayMode={() => void setAwayMode(!awayMode)}
          onBlockUser={() => {
            // TODO: Implement block user functionality
            toast.info('Block user functionality not yet implemented');
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
            onTranslate={onTranslate}
          />
        ) : (
          <MessageList
            messages={messages ?? []}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            typingUsers={typingUsers}
            onReaction={onReaction}
            onTranslate={onTranslate}
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
            style={scrollFab.animatedStyle as never}
            size="icon"
            className="rounded-full shadow-lg bg-primary hover:bg-primary/90"
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }
            }}
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
          setShowTemplates={setShowTemplates}
          showStickers={showStickers}
          setShowStickers={setShowStickers}
          isRecording={isRecordingVoice}
          onStartRecording={() => setIsRecordingVoice(true)}
          onVoiceCancel={() => setIsRecordingVoice(false)}
          onVoiceRecorded={(blob, duration, waveform) => {
            onSend('', 'voice', [], {
              voiceNote: {
                duration,
                waveform,
              },
            });
            setIsRecordingVoice(false);
          }}
          onInputChange={typingChange}
          onSendMessage={onSend}
          onUseTemplate={(template) => {
            setInputValue(template);
            inputRef.current?.focus();
          }}
          templatesStyle={templatesStyle}
          templateButtonHover={templateButtonHover}
          templateButtonTap={templateButtonTap}
          stickerButtonHover={stickerButtonHover}
          stickerButtonTap={stickerButtonTap}
          emojiButtonHover={emojiButtonHover}
          emojiButtonTap={emojiButtonTap}
          sendButtonHover={sendButtonHover}
          sendButtonTap={sendButtonTap}
        />
      </ChatErrorBoundary>
    </div>
  );
}
