/**
 * Reaction Picker
 *
 * 12 emoji picker for message reactions
 */

'use client';

import { useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { MotionView } from '@petspark/motion';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

const REACTION_EMOJIS = ['❤️', '😂', '👍', '👎', '🔥', '🙏', '⭐', '🎉', '😮', '😢', '😡', '💯'] as const;

export interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
  className?: string;
}

export function ReactionPicker({
  onSelect,
  trigger,
  className,
}: ReactionPickerProps): React.JSX.Element {
  const handleSelect = useCallback(
    (emoji: string) => {
      haptics.selection();
      onSelect(emoji);
    },
    [onSelect]
  );

  const defaultTrigger = (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="rounded-full"
      aria-label="Add reaction"
    >
      <span className="text-lg">😊</span>
    </Button>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? defaultTrigger}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <PremiumCard variant="glass" className="p-2">
          <div className="grid grid-cols-6 gap-1">
            {REACTION_EMOJIS.map((emoji) => (
              <EmojiButton key={emoji} emoji={emoji} onSelect={handleSelect} />
            ))}
          </div>
        </PremiumCard>
      </PopoverContent>
    </Popover>
  );
}

interface EmojiButtonProps {
  emoji: string;
  onSelect: (emoji: string) => void;
}

function EmojiButton({ emoji, onSelect }: EmojiButtonProps): React.JSX.Element {
  const bounce = useBounceOnTap({
    onPress: () => onSelect(emoji),
    hapticFeedback: true,
    scale: 0.9,
  });

  return (
    <MotionView
      onClick={bounce.handlePress}
      className={cn(
        'w-10 h-10 rounded-lg',
        'flex items-center justify-center',
        'text-2xl cursor-pointer',
        'hover:bg-white/20 transition-colors'
      )}
    >
      {emoji}
    </MotionView>
  );
}

