import type { Message } from '@/lib/chat-types';
import type { DeleteAnimationContext } from '@/hooks/use-delete-bubble-animation';

export function useDeleteContext(
  message: Message,
  isOwn: boolean,
  isAdmin: boolean,
  roomType: 'direct' | 'group'
): DeleteAnimationContext {
  if (isAdmin && !isOwn) {
    return 'admin-delete';
  }
  if (
    message.type === 'sticker' ||
    (message.type === 'text' && /^[\p{Emoji}]+$/u.test(message.content))
  ) {
    return 'emoji-media';
  }
  if (roomType === 'group') {
    return 'group-chat';
  }
  return 'self-delete';
}

