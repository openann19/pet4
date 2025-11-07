/**
 * Scroll to Bottom FAB Component
 * 
 * Floating action button to scroll to bottom
 */

import { PaperPlaneRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export interface ScrollToBottomFABProps {
  isVisible: boolean
  badgeCount?: number
  animatedStyle: AnimatedStyle
  badgeAnimatedStyle?: AnimatedStyle
  onClick: () => void
}

export function ScrollToBottomFAB({
  isVisible,
  badgeCount = 0,
  animatedStyle,
  badgeAnimatedStyle,
  onClick
}: ScrollToBottomFABProps): React.ReactElement | null {
  if (!isVisible) {
    return null
  }

  return (
    <AnimatedView
      style={animatedStyle}
      className="fixed bottom-24 right-6 z-40"
    >
      <Button
        size="icon"
        className="rounded-full shadow-lg bg-primary hover:bg-primary/90"
        onClick={onClick}
      >
        <PaperPlaneRight size={20} weight="fill" />
        {badgeCount > 0 && badgeAnimatedStyle && (
          <AnimatedView
            style={badgeAnimatedStyle}
            className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            <span>{badgeCount}</span>
          </AnimatedView>
        )}
      </Button>
    </AnimatedView>
  )
}
