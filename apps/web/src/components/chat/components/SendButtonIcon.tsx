/**
 * Send Button Icon Component
 *
 * Animated send button icon with spring animation
 */

import { useEffect } from 'react';
import { useSharedValue, usewithSpring, MotionView   type AnimatedStyle,
} from '@petspark/motion';
import { PaperPlaneRight } from '@phosphor-icons/react';
import { springConfigs } from '@/effects/reanimated/transitions';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface SendButtonIconProps {
  isActive?: boolean;
}

export function SendButtonIcon({ isActive = false }: SendButtonIconProps): JSX.Element {
    const _uiConfig = useUIConfig();
    const translateX = useSharedValue<number>(0);
  const scale = useSharedValue<number>(1);

  const iconStyle = useAnimatedStyle(() => {
    const translateXVal = translateX.value;
    const scaleVal = scale.value;
    return {
      transform: [{ translateX: translateXVal, scale: scaleVal }],
    };
  });

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
    <MotionView style={iconStyle}>
      <PaperPlaneRight size={20} weight="fill" />
    </MotionView>
  );
}
