/**
 * Sticker Button Component
 * 
 * Interactive sticker button with hover animations
 */

import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useHoverAnimation } from '@/effects/reanimated/use-hover-animation'

export interface StickerButtonProps {
  sticker: { id: string; emoji: string }
  onSelect: (emoji: string) => void
}

export function StickerButton({ sticker, onSelect }: StickerButtonProps): JSX.Element {
  const hover = useHoverAnimation({ scale: 1.2 })
  
  return (
    <AnimatedView
      style={hover.animatedStyle}
      onMouseEnter={hover.handleMouseEnter}
      onMouseLeave={hover.handleMouseLeave}
      onMouseDown={hover.handleMouseDown}
      onMouseUp={hover.handleMouseUp}
      onClick={() => { onSelect(sticker.emoji); }}
      className="text-3xl p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
    >
      {sticker.emoji}
    </AnimatedView>
  )
}
