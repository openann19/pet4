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
        if (!acc[emoji]) {
          acc[emoji] = [];
        }
        acc[emoji].push(reaction);
        return acc;
      },
      {} as Record<string, MessageReaction[]>
    );
  }, [reactions]);

  if (reactions.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-1 mt-2', className)}>
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => (
        <Popover key={emoji}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={() => onReactionClick?.(emoji)}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full',
                'bg-white/10 hover:bg-white/20',
                'transition-colors cursor-pointer',
                'text-xs'
              )}
            >
              <span>{emoji}</span>
              {reactionList.length > 1 && (
                <span className="font-semibold">{reactionList.length}</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="space-y-2">
              <p className={cn(getTypographyClasses('caption'), 'font-medium mb-2')}>
                {emoji} Reactions
              </p>
              {reactionList.map((reaction, index) => (
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
        </Popover>
      ))}
    </div>
  );
}

