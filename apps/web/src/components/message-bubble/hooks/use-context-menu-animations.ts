import { useEffect } from 'react';
import { useSharedValue, usewithSpring, withTiming   type AnimatedStyle,
} from '@petspark/motion';
import type { Transition   type AnimatedStyle,
} from '@petspark/motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';


export function useContextMenuAnimations(showContextMenu: boolean) {
  const contextMenuOpacity = useSharedValue<number>(0);
  const contextMenuScale = useSharedValue<number>(0.95);

  useEffect(() => {
    if (showContextMenu) {
      contextMenuOpacity.value = withSpring(1, springConfigs.smooth) as { target: 1; transition: Transition };
      contextMenuScale.value = withSpring(1, springConfigs.smooth) as { target: 1; transition: Transition };
    } else {
      contextMenuOpacity.value = withTiming(0, timingConfigs.fast) as { target: 0; transition: Transition };
      contextMenuScale.value = withTiming(0.95, timingConfigs.fast) as { target: 0.95; transition: Transition };
    }
  }, [showContextMenu, contextMenuOpacity, contextMenuScale]);

  const contextMenuStyle = useAnimatedStyle(() => ({
    opacity: contextMenuOpacity.value,
    transform: [{ scale: contextMenuScale.value }],
  })) as AnimatedStyle;

  return { contextMenuStyle };
}

