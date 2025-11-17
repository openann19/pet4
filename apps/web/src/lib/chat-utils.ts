/**
 * Chat Utilities
 *
 * Helper functions for chat operations
 */

import type { Message, MessageReaction, ReactionType, ChatRoom } from './chat-types';

type ReactionsRecord = Record<ReactionType, string[]>;

/**
 * Normalize reactions to array format
 */
export function normalizeReactions(
  reactions: ReactionsRecord | MessageReaction[] | undefined
): MessageReaction[] {
  if (!reactions) {
    return [];
  }

  // If it's already an array, return it
  if (Array.isArray(reactions)) {
    return reactions;
  }

  // Convert Record format to MessageReaction array
  const result: MessageReaction[] = [];
  for (const [emoji, userIds] of Object.entries(reactions)) {
    if (Array.isArray(userIds)) {
      result.push({
        emoji: emoji as ReactionType,
        userIds,
        count: userIds.length,
      });
    }
  }

  return result;
}

/**
 * Check if user has reacted with a specific emoji
 */
export function hasUserReacted(
  reactions: ReactionsRecord | MessageReaction[] | undefined,
  userId: string,
  emoji: ReactionType
): boolean {
  const normalized = normalizeReactions(reactions);
  const reaction = normalized.find((r) => r.emoji === emoji);
  return reaction ? (reaction.userIds?.includes(userId) ?? false) : false;
}

/**
 * Get all reactions as an array
 */
export function getReactionsArray(
  reactions: ReactionsRecord | MessageReaction[] | undefined
): MessageReaction[] {
  return normalizeReactions(reactions);
}

/**
 * Get reaction count for a specific emoji
 */
export function getReactionCount(
  reactions: ReactionsRecord | MessageReaction[] | undefined,
  emoji: ReactionType
): number {
  const normalized = normalizeReactions(reactions);
  const reaction = normalized.find((r) => r.emoji === emoji);
  return reaction ? (reaction.count ?? 0) : 0;
}

/**
 * Format message timestamp for display
 */
export function formatMessageTime(timestamp: string | number | Date | undefined): string {
  if (!timestamp) return '';

  const date =
    typeof timestamp === 'string' || typeof timestamp === 'number'
      ? new Date(timestamp)
      : timestamp;

  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format chat timestamp for display (alias for formatMessageTime)
 */
export const formatChatTime = formatMessageTime;

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Group messages by date
 */
export function groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups = new Map<string, Message[]>();

  for (const message of messages) {
    const timestamp = message.timestamp ?? message.createdAt;
    if (!timestamp) continue;

    const date = new Date(timestamp);
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(message);
  }

  return Array.from(groups.entries()).map(([date, messages]) => ({ date, messages }));
}

/**
 * Chat stickers
 */
/**
 * Create a chat room from a match
 */
export function createChatRoom(
  matchId: string,
  petId1: string,
  petId2: string,
  _petName1: string,
  petName2: string,
  _petPhoto1: string | undefined,
  petPhoto2?: string
): ChatRoom {
  const now = new Date().toISOString();

  return {
    id: `chat-${String(matchId ?? '')}`,
    participantIds: [petId1, petId2],
    type: 'direct',
    matchId,
    matchedPetId: petId2,
    matchedPetName: petName2,
    ...(petPhoto2 ? { matchedPetPhoto: petPhoto2 } : {}),
    unreadCount: {},
    createdAt: now,
    updatedAt: now,
  };
}

export const CHAT_STICKERS = [
  { id: 'dog', emoji: '🐕', name: 'Dog', label: 'Dog' },
  { id: 'cat', emoji: '🐈', name: 'Cat', label: 'Cat' },
  { id: 'paw', emoji: '🐾', name: 'Paw', label: 'Paw' },
  { id: 'heart', emoji: '❤️', name: 'Heart', label: 'Heart' },
  { id: 'happy', emoji: '😊', name: 'Happy', label: 'Happy' },
  { id: 'ball', emoji: '🎾', name: 'Ball', label: 'Ball' },
  { id: 'bone', emoji: '🦴', name: 'Bone', label: 'Bone' },
  { id: 'dog-face', emoji: '🐶', name: 'Dog Face', label: 'Dog Face' },
  { id: 'cat-face', emoji: '🐱', name: 'Cat Face', label: 'Cat Face' },
  { id: 'star', emoji: '⭐', name: 'Star', label: 'Star' },
] as const;
