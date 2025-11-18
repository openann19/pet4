import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';
import { normalizeError } from '@/lib/error-utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ChatWindowInput');

interface UseChatInputProps {
  sendChatMessage: (content: string) => { id: string } | null;
  handleTypingMessageSend: () => void;
}

/**
 * Hook for managing chat input state and message sending
 */
export function useChatInput({ sendChatMessage, handleTypingMessageSend }: UseChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = (content: string, type: 'text' | 'sticker' | 'voice' = 'text') => {
    if (!content.trim() && type === 'text') return;

    try {
      haptics.trigger('light');

      // sendChatMessage returns ChatMessage | null synchronously
      const newMessage = sendChatMessage(content);
      if (!newMessage) {
        logger.warn('ChatWindowNew sendMessage returned null', { content, type });
        return;
      }

      setInputValue('');
      setShowStickers(false);
      handleTypingMessageSend();

      if (type === 'text') {
        toast.success('Message sent!', {
          duration: 1500,
          position: 'top-center',
        });
      }
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('ChatWindowNew handleSendMessage _error', err, { content, type });
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleUseTemplate = (template: string) => {
    setInputValue(template);
    setShowTemplates(false);
    inputRef.current?.focus();
  };

  return {
    inputValue,
    setInputValue,
    showStickers,
    setShowStickers,
    showTemplates,
    setShowTemplates,
    inputRef,
    handleSendMessage,
    handleInputChange,
    handleUseTemplate,
  };
}

