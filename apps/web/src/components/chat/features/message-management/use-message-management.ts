'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useStorage } from '@/hooks/use-storage';
import type { ChatMessage, ChatRoom } from '@/lib/chat-types';
import { generateMessageId } from '@/lib/chat-utils';
import { haptics } from '@/lib/haptics';
import { toast } from 'sonner';
import { sendPing } from '@/effects/sound/SendPing';

export interface UseMessageManagementOptions {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string | null;
}

export interface UseMessageManagementReturn {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  scrollRef: React.RefObject<HTMLDivElement>;
  scrollToBottom: () => void;
  sendMessage: (
    content: string,
    type?: ChatMessage['type'],
    attachments?: ChatMessage['attachments'],
    metadata?: ChatMessage['metadata']
  ) => Promise<void>;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (messageId: string) => void;
}

export function useMessageManagement(
  options: UseMessageManagementOptions
): UseMessageManagementReturn {
  const { room, currentUserId, currentUserName, currentUserAvatar } = options;

  const [messages, setMessages] = useStorage<ChatMessage[]>(`chat-messages-${room.id}`, []);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((): void => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (
      content: string,
      type: ChatMessage['type'] = 'text',
      attachments?: ChatMessage['attachments'],
      metadata?: ChatMessage['metadata']
    ): Promise<void> => {
      if (!content.trim() && type === 'text' && !attachments?.length) return;

      haptics.trigger('light');
      sendPing().catch(() => {
        // Silently handle audio errors
      });

      const newMessage: ChatMessage = {
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

      setMessages((current) => [...(current || []), newMessage]);

      toast.success('Message sent!', {
        duration: 1500,
        position: 'top-center',
      });
    },
    [room.id, currentUserId, currentUserName, currentUserAvatar, setMessages]
  );

  const updateMessage = useCallback(
    (messageId: string, updates: Partial<ChatMessage>): void => {
      setMessages((current) =>
        (current || []).map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
      );
    },
    [setMessages]
  );

  const deleteMessage = useCallback(
    (messageId: string): void => {
      setMessages((current) => (current || []).filter((msg) => msg.id !== messageId));
    },
    [setMessages]
  );

  return {
    messages: messages || [],
    setMessages,
    scrollRef,
    scrollToBottom,
    sendMessage,
    updateMessage,
    deleteMessage,
  };
}
