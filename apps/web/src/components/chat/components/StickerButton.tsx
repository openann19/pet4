import { MotionView } from "@petspark/motion";
/**
 * Sticker Button Component
 *
 * Interactive sticker button with hover animations
 */

import { useEffect, useRef } from 'react';
import { useHoverAnimation } from '@/effects/reanimated/use-hover-animation';
import { useTargetSize } from '@/hooks/use-target-size';

export interface StickerButtonProps {
  sticker: { id: string; emoji: string };
  onSelect: (emoji: string) => void;
}

export function StickerButton({ sticker, onSelect }: StickerButtonProps): JSX.Element {
  const hover = useHoverAnimation({ scale: 1.2 });
  const containerRef = useRef<HTMLDivElement>(null);
  // Target size validation - ensures 44x44px minimum touch target
  const { ensure } = useTargetSize({ enabled: true, autoFix: true });

  useEffect(() => {
    if (containerRef.current) {
      const buttonElement = containerRef.current.querySelector('[role="button"]')!;
      if (buttonElement) {
        ensure(buttonElement);
      }
    }
  }, [ensure]);

  return (
    <div ref={containerRef}>
      <MotionView
        style={hover.animatedStyle}
        onMouseEnter={hover.handleMouseEnter}
        onMouseLeave={hover.handleMouseLeave}
        onMouseDown={hover.handleMouseDown}
        onMouseUp={hover.handleMouseUp}
        onClick={() => onSelect(sticker.emoji)}
        className="text-3xl p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer min-w-11 min-h-11 flex items-center justify-center"
        role="button"
        tabIndex={0}
      >
        {sticker.emoji}
      </MotionView>
    </div>
  );
}
