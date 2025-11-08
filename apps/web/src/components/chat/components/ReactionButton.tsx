/**
 * Reaction Button Component
 *
 * Interactive reaction button with hover animations
 */

import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useHoverAnimation } from '@/effects/reanimated/use-hover-animation';

export interface ReactionButtonProps {
  emoji: string;
  onClick?: () => void;
}

export function ReactionButton({ emoji, onClick }: ReactionButtonProps): JSX.Element {
  const hover = useHoverAnimation({ scale: 1.2 });

  return (
    <AnimatedView
      style={hover.animatedStyle}
      onMouseEnter={hover.handleMouseEnter}
      onMouseLeave={hover.handleMouseLeave}
      onMouseDown={hover.handleMouseDown}
      onMouseUp={hover.handleMouseUp}
      onClick={onClick}
      className="text-2xl p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
    >
      {emoji}
    </AnimatedView>
  );
}
