import { MotionView   type AnimatedStyle,
} from '@petspark/motion';
import { cn } from '@/lib/utils';

import { REACTIONS } from '../message-bubble-constants';
import type { ReactionType } from '@/lib/chat-types';

interface ReactionsPickerProps {
  isOwn: boolean;
  reactionsPickerStyle: AnimatedStyle;
  onReact: (reaction: ReactionType) => void;
}

export function ReactionsPicker({
  isOwn,
  reactionsPickerStyle,
  onReact,
}: ReactionsPickerProps) {
  return (
    <MotionView
      style={reactionsPickerStyle}
      className={cn(
        'absolute z-50 bg-card border border-border rounded-full shadow-lg p-2',
        'flex items-center gap-2',
        isOwn ? 'right-0' : 'left-0',
        '-top-12'
      )}
    >
      {REACTIONS.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => {
            onReact(type);
          }}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          aria-label={label}
        >
          <span className="text-xl">{type}</span>
        </button>
      ))}
    </MotionView>
  );
}

