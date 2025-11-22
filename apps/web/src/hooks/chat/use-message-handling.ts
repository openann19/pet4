'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';
import { buildLLMPrompt } from '@/lib/llm-prompt';
import { llmService } from '@/lib/llm-service';
import { parseLLMError } from '@/lib/llm-utils';
import { createLogger } from '@/lib/logger';
import type { ChatMessage, ChatRoom, MessageReaction, ReactionType } from '@/lib/chat-types';
import { generateMessageId } from '@/lib/chat-utils';

const logger = createLogger('useMessageHandling');

export function useMessageHandling(
  messages: ChatMessage[],
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  currentUserId: string,
  currentUserName: string,
  enqueue: (id: string, payload: unknown) => void,
  room: ChatRoom,
  typingSend: () => void,
  currentUserAvatar?: string
) {
  const [inputValue, setInputValue] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [confettiSeed, setConfettiSeed] = useState(0);
  const [burstSeed, setBurstSeed] = useState(0);

  const onSend = (
    content: string,
    type: ChatMessage['type'] = 'text',
    attachments?: ChatMessage['attachments'],
    metadata?: ChatMessage['metadata']
  ): void => {
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

    void setMessages((cur) => [...(cur ?? []), msg]);
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
      setConfettiSeed((s) => s + 1);
    }
  };

  const onReaction = (messageId: string, emoji: string): void => {
    haptics.trigger('selection');

    void setMessages((cur) =>
      (cur ?? []).map((m) => {
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

  const onTranslate = (messageId: string): void => {
    const m = (messages ?? []).find((x) => x.id === messageId);
    if (!m) {
      return;
    }

    const doTranslate = async () => {
      try {
        const prompt = buildLLMPrompt`Translate to English, return text only: "${m.content}"`;
        const translated = await llmService.llm(prompt, 'gpt-4o-mini');

        void setMessages((cur) =>
          (cur ?? []).map((x) =>
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
    void doTranslate();
  };

  return {
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
  };
}
