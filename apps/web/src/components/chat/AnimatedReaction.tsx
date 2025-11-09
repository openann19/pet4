'use client';

import { useReactionAnimation } from '@/hooks/use-reaction-animation';
import { AnimatedView, type AnimatedStyle } from '@/effects/reanimated/animated-view';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface AnimatedReactionProps {
  emoji: string;
  onAnimationComplete?: () => void;
  className?: string;
}

export function AnimatedReaction({
  emoji,
  onAnimationComplete,
  className,
}: AnimatedReactionProps): React.JSX.Element {
    const uiConfig = useUIConfig();
    const { animatedStyle: rawAnimatedStyle, animate } = useReactionAnimation({
        hapticFeedback: true,
      });

  const animatedStyle = rawAnimatedStyle as AnimatedStyle;

  const handleAnimationComplete = (): void => {
    if (onAnimationComplete) {
      setTimeout(() => {
        onAnimationComplete();
      }, 800);
    }
  };

  const handleClick = (): void => {
    animate(emoji);
    handleAnimationComplete();
  };

  return (
    <AnimatedView
      style={animatedStyle}
      onClick={handleClick}
      className={cn('text-2xl cursor-pointer select-none', className)}
    >
      {emoji}
    </AnimatedView>
  );
}
