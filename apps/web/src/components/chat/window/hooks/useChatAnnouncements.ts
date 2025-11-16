import type { ChatMessage } from '@/lib/chat-types';

interface TypingUser {
  userId: string;
  userName?: string;
}

/**
 * Hook for computing announcement data for screen readers
 */
export function useChatAnnouncements(
  messages: ChatMessage[] | undefined,
  typingUsers: TypingUser[],
  currentUserId: string
) {
  const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMessageText =
    lastMessage && lastMessage.senderId !== currentUserId ? lastMessage.content : null;
  const lastMessageSender =
    lastMessage && lastMessage.senderId !== currentUserId ? (lastMessage.senderName ?? null) : null;

  const typingUser =
    typingUsers.length > 0 && typingUsers[0]?.userId !== currentUserId
      ? (typingUsers[0]?.userName ?? null)
      : null;
  const multipleTypingUsers = typingUsers.filter((u) => u.userId !== currentUserId).length > 1;

  return {
    lastMessageText,
    lastMessageSender,
    typingUser,
    multipleTypingUsers,
  };
}

