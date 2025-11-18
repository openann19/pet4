'use client';

import { MotionView } from "@petspark/motion";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';
import { buildLLMPrompt } from '@/lib/llm-prompt';
import { llmService } from '@/lib/llm-service';
import { parseLLMError } from '@/lib/llm-utils';
import { createLogger } from '@/lib/logger';
import { realtime } from '@/lib/realtime';
import type {
  ChatMessage,
  ChatRoom,
  MessageReaction,
  ReactionType,
  SmartSuggestion,
  MessageTemplate,
} from '@/lib/chat-types';
import { generateMessageId } from '@/lib/chat-utils';
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
import { useChatKeyboardShortcuts } from '@/hooks/chat/use-chat-keyboard-shortcuts';
import { useChatInputAnimations } from './hooks/useChatInputAnimations';

const logger = createLogger('AdvancedChatWindow');

function useMessageHandling(
  messages: ChatMessage[],
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  currentUserId: string,
  currentUserName: string,
  enqueue: (id: string, payload: unknown) => void,
  room: ChatRoom,
  currentUserAvatar: string | undefined,
  setInputValue: Dispatch<SetStateAction<string>>,
  setShowStickers: Dispatch<SetStateAction<boolean>>,
  setShowTemplates: Dispatch<SetStateAction<boolean>>,
  typingSend: () => void,
  setConfettiSeed: Dispatch<SetStateAction<number>>,
  setBurstSeed: Dispatch<SetStateAction<number>>
) {
  const onSend = async (
    content: string,
    type: ChatMessage['type'] = 'text',
    attachments?: ChatMessage['attachments'],
    metadata?: ChatMessage['metadata']
  ): Promise<void> => {
    if (!content.trim() && type === 'text' && !attachments?.length) {
      return;
    }

    haptics.trigger('light');

    const msg: ChatMessage = {
      id: generateMessageId(),
      roomId: room.id,
      senderId: currentUserId,
      senderName: currentUserName,
      ...(currentUserAvatar ? { senderAvatar: currentUserAvatar } : {}),
      content: type === 'text' ? content.trim() : content,
      type,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'sent',
      reactions: [],
      ...(attachments ? { attachments } : {}),
      ...(metadata ? { metadata } : {}),
    };

    setMessages((cur: ChatMessage[]) => [...(cur ?? []), msg]);
    setInputValue('');
    setShowStickers(false);
    setShowTemplates(false);
    typingSend();

    enqueue(msg.id, {
      messageId: msg.id,
      roomId: room.id,
      content: msg.content,
      senderId: currentUserId,
      type: msg.type,
      timestamp: msg.timestamp,
    });

    toast.success('Message sent!', { duration: 1500, position: 'top-center' });

    if (type === 'sticker' || type === 'pet-card') {
      setConfettiSeed((s: number) => s + 1);
    }
  };

  const onReaction = (messageId: string, emoji: string): void => {
    haptics.trigger('selection');

    setMessages((cur: ChatMessage[]) =>
      (cur ?? []).map((m: ChatMessage) => {
        if (m.id !== messageId) {
          return m;
        }

        const reactions = Array.isArray(m.reactions) ? m.reactions : [];

        const existing = reactions.find((r: MessageReaction) => r.userId === currentUserId);

        if (existing?.emoji === emoji) {
          return { ...m, reactions: reactions.filter((r: MessageReaction) => r.userId !== currentUserId) };
        } else if (existing) {
          return {
            ...m,
            reactions: reactions.map((r: MessageReaction) =>
              r.userId !== currentUserId ? { ...r, emoji, timestamp: new Date().toISOString() } : r
            ),
          };
        }

        const newReaction = {
          emoji: emoji as ReactionType,
          userId: currentUserId,
          userName: currentUserName,
          timestamp: new Date().toISOString(),
          ...(currentUserAvatar ? { userAvatar: currentUserAvatar } : {}),
        } as MessageReaction;

        return { ...m, reactions: [...reactions, newReaction] };
      })
    );

    setBurstSeed((s: number) => s + 1);
  };

  const onTranslate = async (messageId: string): Promise<void> => {
    const m = (messages ?? []).find((x) => x.id === messageId);
    if (!m) {
      return;
    }

    try {
      const prompt = buildLLMPrompt`Translate to English, return text only: "${m.content}"`;
      const translated = await llmService.llm(prompt, 'gpt-4o-mini');

      setMessages((cur: ChatMessage[]) =>
        (cur ?? []).map((x: ChatMessage) =>
          x.id === messageId
            ? {
              ...x,
              metadata: {
                ...x.metadata,
                translation: {
                  originalLang: 'auto',
                  targetLang: 'en',
                  translatedText: translated,
                },
              },
            }
            : x
        )
      );

      toast.success('Message translated!');
    } catch (e) {
      const info = parseLLMError(e);
      const err = e instanceof Error ? e : new Error(String(e));
      logger.error('Translation failed', err, { technicalMessage: info.technicalMessage });
      toast.error('Translation failed', { description: info.userMessage, duration: 5000 });
    }
  };

  return { onSend, onReaction, onTranslate };
}

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
  const [inputValue, setInputValue] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [awayMode, setAwayMode] = useStorage<boolean>(`away-mode-${currentUserId}`, false);
  const [scrollFabVisible, setScrollFabVisible] = useState(false);
  const [previousBadgeCount, setPreviousBadgeCount] = useState(0);
  const [burstSeed, setBurstSeed] = useState(0);
  const [confettiSeed, setConfettiSeed] = useState(0);
  const [lastIncomingText, setLastIncomingText] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null) as React.RefObject<import('@/components/ui/input').InputRef>;

  const scrollRef = useRef<HTMLDivElement>(null);

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
      setPreviousBadgeCount(previousBadgeCount);
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

  const { onSend, onReaction, onTranslate } = useMessageHandling(
    messages,
    setMessages,
    currentUserId,
    currentUserName,
    enqueue,
    room,
    currentUserAvatar,
    setInputValue,
    setShowStickers,
    setShowTemplates,
    typingSend,
    setConfettiSeed,
    setBurstSeed
  );

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
  const inputAnimations = useChatInputAnimations(showTemplates);

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
          onToggleAwayMode={() => setAwayMode(!awayMode)}
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
          onInputChange={(v: string) => {
            setInputValue(v);
            typingChange(v);
          }}
          onSendMessage={(content: string, type?: 'text' | 'sticker' | 'voice') => {
            onSend(content, type ?? 'text');
          }}
          onUseTemplate={(template: string) => {
            setInputValue(template);
            setShowTemplates(false);
          }}
          onVoiceRecorded={(_audioBlob: Blob, _duration: number, _waveform: number[]) => {
            setIsRecordingVoice(false);
            onSend('Voice message', 'voice');
          }}
          onVoiceCancel={() => {
            setIsRecordingVoice(false);
          }}
          onStartRecording={() => {
            setIsRecordingVoice(true);
          }}
          setShowTemplates={setShowTemplates}
          setShowStickers={setShowStickers}
        />
      </ChatErrorBoundary>
    </div>
  );
}

