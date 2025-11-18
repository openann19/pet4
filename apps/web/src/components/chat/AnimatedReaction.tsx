'use client';;
import { MotionView, type MotionStyle } from "@petspark/motion";

import { useReactionAnimation } from '@/hooks/use-reaction-animation';
import { type AnimatedStyle } from '@/effects/reanimated/animated-view';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";
import { isTruthy } from '@petspark/shared';

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
    const _uiConfig = useUIConfig();
    const { animatedStyle: rawanimate } = useReactionAnimation({
        hapticFeedback: true,
      });

  const animatedStyle = rawAnimatedStyle as AnimatedStyle;

  const handleAnimationComplete = (): void => {
    if (isTruthy(onAnimationComplete)) {
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
    <MotionView
      style={animatedStyle as unknown as MotionStyle}
      onClick={() => void handleClick()}
      className={cn('text-2xl cursor-pointer select-none', className)}
    >
      {emoji}
    </MotionView>
  );
}
