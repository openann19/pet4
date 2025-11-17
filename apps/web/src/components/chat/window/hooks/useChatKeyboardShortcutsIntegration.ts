import { useState } from 'react';
import { useChatKeyboardShortcuts } from '@/hooks/chat/use-chat-keyboard-shortcuts';
import type { ChatMessage } from '@/lib/chat-types';
import type { InputRef } from '@/components/ui/input';

interface UseChatKeyboardShortcutsIntegrationProps {
  inputValue: string;
  inputRef: React.RefObject<InputRef>;
  messages: ChatMessage[] | undefined;
  setInputValue: (value: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  scrollRef: React.RefObject<HTMLDivElement>;
  onSend: (content: string, type?: 'text' | 'sticker' | 'voice') => void;
  onReaction: (messageId: string, emoji: string) => void;
  onBack?: () => void;
}

/**
 * Hook for integrating keyboard shortcuts with chat actions
 */
export function useChatKeyboardShortcutsIntegration({
  inputValue,
  inputRef,
  messages,
  setInputValue,
  setMessages,
  scrollRef,
  onSend,
  onReaction,
  onBack,
}: UseChatKeyboardShortcutsIntegrationProps) {
  const [focusedMessageId] = useState<string | null>(null);
  const focusedMessage = focusedMessageId ? messages?.find((m) => m.id === focusedMessageId) : null;

  useChatKeyboardShortcuts({
    enabled: true,
    context: 'chat',
    onSend: (): void => {
      if (inputValue.trim()) {
        onSend(inputValue, 'text');
      }
    },
    onReply: focusedMessage
      ? () => {
          // Focus input and add reply context
          inputRef.current?.focus();
          setInputValue(`@${focusedMessage.senderName ?? 'User'} `);
        }
      : undefined,
    onDelete: focusedMessage
      ? () => {
          // Delete focused message
          void setMessages((cur) => (cur ?? []).filter((m) => m.id !== focusedMessageId));
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

  return { focusedMessageId, focusedMessage };
}

