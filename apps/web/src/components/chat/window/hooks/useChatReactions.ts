import { useState } from 'react';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';
import { normalizeError } from '@/lib/error-utils';
import { createLogger } from '@/lib/logger';
import type { ReactionType } from '@/lib/chat-types';

const logger = createLogger('ChatWindowReactions');

interface UseChatReactionsProps {
  addChatReaction: (messageId: string, emoji: ReactionType) => Promise<void>;
}

/**
 * Hook for managing message reactions
 */
export function useChatReactions({ addChatReaction }: UseChatReactionsProps) {
  const [showReactions, setShowReactions] = useState<string | null>(null);

  const handleReaction = (messageId: string, emoji: string) => {
    try {
      haptics.trigger('selection');
      void addChatReaction(messageId, emoji as ReactionType).catch((error) => {
        const err = normalizeError(error);
        logger.error('ChatWindowNew handleReaction error', err, { messageId, emoji });
        void toast.error('Failed to add reaction. Please try again.');
      });
      setShowReactions(null);
    } catch (error) {
      const err = normalizeError(error);
      logger.error('ChatWindowNew handleReaction sync error', err, { messageId, emoji });
      setShowReactions(null);
    }
  };

  return {
    showReactions,
    setShowReactions,
    handleReaction,
  };
}

