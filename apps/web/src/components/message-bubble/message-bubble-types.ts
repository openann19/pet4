import type { Message, ReactionType } from '@/lib/chat-types';

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isClusterStart: boolean;
  isClusterEnd: boolean;
  index?: number;
  isNew?: boolean;
  isHighlighted?: boolean;
  isAIMessage?: boolean;
  variant?: 'ai-answer' | 'user-reply' | 'thread-message' | 'default';
  previousStatus?: Message['status'];
  roomType?: 'direct' | 'group';
  isAdmin?: boolean;
  onReact?: (messageId: string, reaction: ReactionType) => void;
  onReply?: (messageId: string) => void;
  onCopy?: (messageId: string) => void;
  onReport?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onUndo?: (messageId: string) => void;
  showTimestamp?: boolean;
}

export interface ReactionOption {
  type: ReactionType;
  icon: React.ComponentType;
  label: string;
}
