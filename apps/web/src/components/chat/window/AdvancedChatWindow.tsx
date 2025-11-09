'use client';

import { useEffect, useRef, useState } from 'react';
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

import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { VirtualMessageList } from './VirtualMessageList';
import { ChatInputBar } from './ChatInputBar';
import { Overlays } from './Overlays';
import { ChatErrorBoundary } from './ChatErrorBoundary';
import { AnnounceNewMessage, AnnounceTyping } from './LiveRegions';
import { useOutbox } from '@petspark/chat-core';
import { flags } from '@petspark/config';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { LiquidDots } from '../LiquidDots';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUIConfig } from "@/hooks/use-ui-config";
import { useChatKeyboardShortcuts } from '@/hooks/chat/use-chat-keyboard-shortcuts';

const logger = createLogger('AdvancedChatWindow');

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
  const uiConfig = useUIConfig();
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
  const inputRef = useRef<HTMLInputElement>(null);

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

    setMessages((cur) => [...(cur || []), msg]);
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

    inputRef.current?.focus();

    toast.success('Message sent!', { duration: 1500, position: 'top-center' });

    if (type === 'sticker' || type === 'pet-card') {
      setConfettiSeed((s) => s + 1);
    }
  };

  const onReaction = (messageId: string, emoji: string): void => {
    haptics.trigger('selection');

    setMessages((cur) =>
      (cur || []).map((m) => {
        if (m.id !== messageId) {
          return m;
        }

        const reactions = Array.isArray(m.reactions) ? m.reactions : [];

        const existing = reactions.find((r) => r.userId === currentUserId);

        if (existing?.emoji === emoji) {
          return { ...m, reactions: reactions.filter((r) => r.userId !== currentUserId) };
        } else if (existing) {
          return {
            ...m,
            reactions: reactions.map((r) =>
              r.userId === currentUserId ? { ...r, emoji, timestamp: new Date().toISOString() } : r
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

    setBurstSeed((s) => s + 1);
  };

  const onTranslate = async (messageId: string): Promise<void> => {
    const m = (messages || []).find((x) => x.id === messageId);
    if (!m) {
      return;
    }

    try {
      const prompt = buildLLMPrompt`Translate to English, return text only: "${m.content}"`;
      const translated = await llmService.llm(prompt, 'gpt-4o-mini');

      setMessages((cur) =>
        (cur || []).map((x) =>
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

  const scrollFab = useScrollFabMagnetic({
    enabled: true,
    isVisible: scrollFabVisible,
    badgeCount: messages?.length ?? 0,
    previousBadgeCount,
  });

  // Register keyboard shortcuts for chat actions
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const focusedMessage = focusedMessageId ? messages?.find((m) => m.id === focusedMessageId) : null;

  useChatKeyboardShortcuts({
    enabled: true,
    context: 'chat',
    onSend: () => {
      if (inputValue.trim()) {
        onSend(inputValue, 'text');
      }
    },
    onReply: focusedMessage
      ? () => {
        // Focus input and add reply context
        inputRef.current?.focus();
        setInputValue(`@${focusedMessage.senderName || 'User'} `);
      }
      : undefined,
    onDelete: focusedMessage
      ? () => {
        // Delete focused message
        setMessages((cur) => (cur || []).filter((m) => m.id !== focusedMessageId));
      }
      : undefined,
    onReact: focusedMessage
      ? () => {
        // Open reaction picker for focused message
        // This would typically open a reaction menu
        onReaction(focusedMessage.id, '❤️');
      }
      : undefined,
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
    messageFocused: focusedMessageId !== null,
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
          {...(onBack ? { onBack } : {})}
          awayMode={awayMode}
          setAwayMode={setAwayMode}
          typingIndicator={
            typingUsers.length > 0 ? <TypingIndicator typingUsers={typingUsers} /> : null
          }
        />
      </ChatErrorBoundary>

      <ChatErrorBoundary>
        {useVirtualization ? (
          <VirtualMessageList
            messages={messages || []}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            typingUsers={typingUsers}
            onReaction={onReaction}
            onTranslate={onTranslate}
          />
        ) : (
          <MessageList
            messages={messages || []}
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
          setInputValue={(v) => {
            setInputValue(v);
            typingChange(v);
          }}
          inputRef={inputRef}
          showStickers={showStickers}
          setShowStickers={setShowStickers}
          showTemplates={showTemplates}
          setShowTemplates={setShowTemplates}
          isRecordingVoice={isRecordingVoice}
          setIsRecordingVoice={setIsRecordingVoice}
          onSend={onSend}
          onSuggestion={(s: SmartSuggestion) => {
            onSend(s.text, 'text');
          }}
          onShareLocation={() => {
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  onSend('Shared my location', 'location', undefined, {
                    location: {
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                      latitude: pos.coords.latitude,
                      longitude: pos.coords.longitude,
                      address: 'Current Location',
                    },
                  });
                  toast.success('Location shared!');
                },
                () => {
                  toast.error('Unable to access location');
                }
              );
            } else {
              toast.error('Geolocation not supported');
            }
          }}
          onTemplate={(t: MessageTemplate) => {
            setInputValue(t.content || t.text || '');
          }}
          onQuickReaction={(emoji) => {
            const lastMessage = messages?.[messages.length - 1];
            if (lastMessage && lastMessage.senderId !== currentUserId) {
              onReaction(lastMessage.id, emoji);
            }
          }}
        />
      </ChatErrorBoundary>
    </div>
  );
}

interface TypingIndicatorProps {
  typingUsers: { userName?: string }[];
}

function TypingIndicator({ typingUsers }: TypingIndicatorProps): JSX.Element {
  const anim = useEntryAnimation({ initialY: 20, delay: 0 });

  return (
    <AnimatedView style={anim.animatedStyle} className="flex items-end gap-2 flex-row">
      <Avatar className="w-8 h-8 ring-2 ring-white/20 shrink-0">
        <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
          {typingUsers[0]?.userName?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="rounded-xl px-2.5 py-1.5 bg-white/10 border border-white/10">
        <LiquidDots enabled dotColor="#9ca3af" />
      </div>
    </AnimatedView>
  );
}
