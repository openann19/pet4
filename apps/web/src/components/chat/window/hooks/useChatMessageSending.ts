import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { chatApi } from '@/api/chat-api';
import { useOutbox, type UseOutboxReturn } from '@petspark/chat-core';
import type { ChatMessage, ChatRoom } from '@/lib/chat-types';
import { generateMessageId } from '@/lib/chat-utils';
import type { InputRef } from '@/components/ui/input';

const logger = createLogger('useChatMessageSending');

interface UseChatMessageSendingProps {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setInputValue: (value: string) => void;
  setShowStickers: (show: boolean) => void;
  setShowTemplates: (show: boolean) => void;
  setConfettiSeed: React.Dispatch<React.SetStateAction<number>>;
  typingSend: () => void;
  inputRef: React.RefObject<InputRef>;
}

/**
 * Hook for managing message sending logic with outbox
 */
export function useChatMessageSending({
  room,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  setMessages,
  setInputValue,
  setShowStickers,
  setShowTemplates,
  setConfettiSeed,
  typingSend,
  inputRef,
}: UseChatMessageSendingProps) {
  // TypeScript may show error type warnings here, but useOutbox is properly typed
   
  const outbox = useOutbox({
    sendFn: async (payload: unknown): Promise<void> => {
      try {
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
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('Failed to send message', err);
      }
    },
  });
  // TypeScript may show error type warnings here, but outbox is properly typed
   
  const { enqueue } = outbox;

  const sendMessage = (
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
    void typingSend();

     
    void enqueue(msg.id, {
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

  return { sendMessage };
}

