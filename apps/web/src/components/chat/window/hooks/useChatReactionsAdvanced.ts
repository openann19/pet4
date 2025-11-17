import { haptics } from '@/lib/haptics';
import type { ChatMessage, MessageReaction, ReactionType } from '@/lib/chat-types';

interface UseChatReactionsAdvancedProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setBurstSeed: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Hook for managing message reactions with burst animations
 */
export function useChatReactionsAdvanced({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  setMessages,
  setBurstSeed,
}: UseChatReactionsAdvancedProps) {
  const handleReaction = (messageId: string, emoji: string): void => {
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

  return { handleReaction };
}

