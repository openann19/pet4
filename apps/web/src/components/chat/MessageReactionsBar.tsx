/**
 * Message Reactions Bar
 *
 * Display bar for message reactions
 */

'use client';

import { useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import type { MessageReaction } from '@/lib/chat-types';

export interface MessageReactionsBarProps {
  reactions: MessageReaction[];
  onReactionClick?: (emoji: string) => void;
  className?: string;
}

function ReactionPopoverContent({ emoji, reactions }: { emoji: string; reactions: MessageReaction[] }): React.JSX.Element {
  return (
    <PopoverContent className="w-64 p-3">
      <div className="space-y-2">
        <p className={cn(getTypographyClasses('caption'), 'font-medium mb-2')}>
          {emoji} Reactions
        </p>
        {reactions.map((reaction, index) => (
          <div key={`${reaction.userId}-${index}`} className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={reaction.userAvatar ?? undefined} alt={reaction.userName ?? 'User'} />
              <AvatarFallback className="text-[10px]">
                {reaction.userName?.[0] ?? '?'}
              </AvatarFallback>
            </Avatar>
            <span className={cn(getTypographyClasses('body'), 'text-sm flex-1')}>
              {reaction.userName ?? 'Unknown'}
            </span>
          </div>
        ))}
      </div>
    </PopoverContent>
  );
}

function ReactionButton({ emoji, count, onClick }: { emoji: string; count: number; onClick: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full',
        'bg-white/10 hover:bg-white/20',
        'transition-colors cursor-pointer',
        'text-xs'
      )}
    >
      <span>{emoji}</span>
      {count > 1 && <span className="font-semibold">{count}</span>}
    </button>
  );
}

export function MessageReactionsBar({
  reactions,
  onReactionClick,
  className,
}: MessageReactionsBarProps): React.JSX.Element {
  const groupedReactions = useMemo(() => {
    return reactions.reduce(
      (acc, reaction) => {
        const emoji = reaction.emoji;
        if (!emoji) return acc;
        acc[emoji] ??= [];
        acc[emoji]?.push(reaction);
        return acc;
      },
      {} as Record<string, MessageReaction[]>
    );
  }, [reactions]);

  if (reactions.length === 0) {
    return <></>;
  }

  return (
    <div className={cn('flex flex-wrap gap-1 mt-2', className)}>
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => (
        <Popover key={emoji}>
          <PopoverTrigger asChild>
            <ReactionButton emoji={emoji} count={reactionList.length} onClick={() => onReactionClick?.(emoji)} />
          </PopoverTrigger>
          <ReactionPopoverContent emoji={emoji} reactions={reactionList} />
        </Popover>
      ))}
    </div>
  );
}

