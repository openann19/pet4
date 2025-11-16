import { cn } from '@/lib/utils';
import type { Message, ReactionType } from '@/lib/chat-types';

function renderArrayReactions(
  reactions: Array<{ emoji: string }>,
  isOwn: boolean,
  onReact: (reaction: ReactionType) => void
) {
  if (reactions.length === 0) {
    return null;
  }

  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      const emoji = reaction.emoji;
      acc[emoji] ??= [];
      const emojiArray = acc[emoji];
      if (emojiArray) {
        emojiArray.push(reaction);
      }
      return acc;
    },
    {} as Record<string, typeof reactions>
  );

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(groupedReactions).map(([reaction, reactionArray]) => (
        <button
          key={reaction}
          className={cn(
            'px-2 py-0.5 rounded-full text-xs flex items-center gap-1',
            isOwn ? 'bg-white/20' : 'bg-muted'
          )}
          onClick={() => {
            onReact(reaction as ReactionType);
          }}
        >
          <span>{reaction}</span>
          {reactionArray.length > 1 && <span>{reactionArray.length}</span>}
        </button>
      ))}
    </div>
  );
}

function renderRecordReactions(
  reactions: Record<string, string[]>,
  isOwn: boolean,
  onReact: (reaction: ReactionType) => void
) {
  const entries = Object.entries(reactions);
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([emoji, userIds]) => (
        <button
          key={emoji}
          className={cn(
            'px-2 py-0.5 rounded-full text-xs flex items-center gap-1',
            isOwn ? 'bg-white/20' : 'bg-muted'
          )}
          onClick={() => {
            onReact(emoji as ReactionType);
          }}
        >
          <span>{emoji}</span>
          {userIds.length > 1 && <span>{userIds.length}</span>}
        </button>
      ))}
    </div>
  );
}

interface MessageReactionsProps {
  message: Message;
  isOwn: boolean;
  onReact: (reaction: ReactionType) => void;
}

export function MessageReactions({ message, isOwn, onReact }: MessageReactionsProps) {
  if (!message.reactions) {
    return null;
  }

  // Handle both MessageReaction[] and Record<ReactionType, string[]>
  if (Array.isArray(message.reactions)) {
    return renderArrayReactions(message.reactions, isOwn, onReact);
  }

  // Record<ReactionType, string[]>
  return renderRecordReactions(message.reactions, isOwn, onReact);
}

