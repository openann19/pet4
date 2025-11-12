'use client';

import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useHoverAnimation } from '@/effects/reanimated/use-hover-animation';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { PaperPlaneRight } from '@phosphor-icons/react';

export interface StickerButtonProps {
  sticker: { id: string; emoji: string };
  onSelect: (emoji: string) => void;
}

export function StickerButton({ sticker, onSelect }: StickerButtonProps): JSX.Element {
  const hover = useHoverAnimation({ scale: 1.2 });

  return (
    <AnimatedView
      style={hover.animatedStyle}
      onMouseEnter={hover.handleMouseEnter}
      onMouseLeave={hover.handleMouseLeave}
      onMouseDown={hover.handleMouseDown}
      onMouseUp={hover.handleMouseUp}
      onClick={() => {
        onSelect(sticker.emoji);
      }}
      className="text-3xl p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
    >
      {sticker.emoji}
    </AnimatedView>
  );
}

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

export function SendButtonIcon(): JSX.Element {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  })) as AnimatedStyle;

  return (
    <AnimatedView
      style={iconStyle}
      onMouseEnter={() => {
        translateX.value = withSpring(5, springConfigs.smooth);
      }}
      onMouseLeave={() => {
        translateX.value = withSpring(0, springConfigs.smooth);
      }}
      onMouseDown={() => {
        scale.value = withSpring(0.9, springConfigs.smooth);
      }}
      onMouseUp={() => {
        scale.value = withSpring(1, springConfigs.smooth);
      }}
    >
      <PaperPlaneRight size={20} weight="fill" />
    </AnimatedView>
  );
}
