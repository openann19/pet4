/**
 * Send Button Icon Component
 *
 * Animated send button icon with spring animation
 */

import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { PaperPlaneRight } from '@phosphor-icons/react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface SendButtonIconProps {
  isActive?: boolean;
}

export function SendButtonIcon({ isActive = false }: SendButtonIconProps): JSX.Element {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  })) as AnimatedStyle;

  useEffect(() => {
    if (isActive) {
      translateX.value = withSpring(4, springConfigs.bouncy);
      scale.value = withSpring(1.1, springConfigs.bouncy);

      setTimeout(() => {
        translateX.value = withSpring(0, springConfigs.smooth);
        scale.value = withSpring(1, springConfigs.smooth);
      }, 150);
    }
  }, [isActive, translateX, scale]);

  return (
    <AnimatedView style={iconStyle}>
      <PaperPlaneRight size={20} weight="fill" />
    </AnimatedView>
  );
}
