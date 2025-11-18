import { MotionView } from "@petspark/motion";
/**
 * Scroll to Bottom FAB Component
 *
 * Floating action button to scroll to bottom
 */

import { PaperPlaneRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";
import type  from '@petspark/motion';

export interface ScrollToBottomFABProps {
  isVisible: boolean;
  badgeCount?: number;
  animatedStyle: AnimatedStyle;
  badgeAnimatedStyle?: AnimatedStyle;
  onClick: () => void;
}

export function ScrollToBottomFAB({
  isVisible,
  badgeCount = 0,
  animatedStyle,
  badge
  onClick,
}: ScrollToBottomFABProps): React.ReactElement | null {
    const _uiConfig = useUIConfig();
    if (!isVisible) {
        return null;
      }

  const style = useAnimatedStyleValue(animatedStyle);
  const badgeStyle = badgeAnimatedStyle ? useAnimatedStyleValue(badgeAnimatedStyle) : undefined;

  return (
    <MotionView style={style} className="fixed bottom-24 right-6 z-40">
      <Button
        size="sm"
        className="rounded-full shadow-lg bg-primary hover:bg-primary/90 w-10 h-10 p-0"
        onClick={() => void onClick()}
        aria-label="Scroll to bottom"
      >
        <PaperPlaneRight size={20} weight="fill" />
        {badgeCount > 0 && badgeStyle && (
          <MotionView
            style={badgeStyle}
            className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            <span>{badgeCount}</span>
          </MotionView>
        )}
      </Button>
    </MotionView>
  );
}
