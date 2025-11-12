'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { useCallback, useRef } from 'react';
import { triggerHaptic } from '@/effects/chat/core/haptic-manager';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';

export interface UseBubbleGestureOptions {
  onPress?: () => void;
  onLongPress?: () => void;
  hapticFeedback?: boolean;
  longPressDelay?: number;
}

export interface UseBubbleGestureReturn {
  scale: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  glowScale: SharedValue<number>;
  reactionMenuOpacity: SharedValue<number>;
  reactionMenuScale: SharedValue<number>;
  reactionMenuTranslateY: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  glowStyle: ReturnType<typeof useAnimatedStyle>;
  reactionMenuStyle: ReturnType<typeof useAnimatedStyle>;
  handlePressIn: () => void;
  handlePressOut: () => void;
  handlePress: () => void;
  showReactionMenu: () => void;
  hideReactionMenu: () => void;
}

const DEFAULT_LONG_PRESS_DELAY = 500;
const DEFAULT_HAPTIC_FEEDBACK = true;

export function useBubbleGesture(options: UseBubbleGestureOptions = {}): UseBubbleGestureReturn {
  const {
    onPress,
    onLongPress,
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    longPressDelay = DEFAULT_LONG_PRESS_DELAY,
  } = options;

  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const reactionMenuOpacity = useSharedValue(0);
  const reactionMenuScale = useSharedValue(0.9);
  const reactionMenuTranslateY = useSharedValue(10);

  const longPressTimerRef = useRef<number | undefined>(undefined);
  const isPressedRef = useRef(false);

  const handlePressIn = useCallback(() => {
    isPressedRef.current = true;
    if (hapticFeedback) {
      triggerHaptic('selection');
    }

    scale.value = withSpring(0.96, {
      damping: 20,
      stiffness: 500,
    });

    glowOpacity.value = withSpring(0.3, springConfigs.smooth);

    if (onLongPress) {
      longPressTimerRef.current = window.setTimeout(() => {
        if (isPressedRef.current) {
          if (hapticFeedback) {
            triggerHaptic('medium');
          }
          glowOpacity.value = withSpring(1, springConfigs.smooth);
          glowScale.value = withSpring(1.15, springConfigs.smooth);
          onLongPress();
          longPressTimerRef.current = undefined;
        }
      }, longPressDelay);
    }
  }, [
    onLongPress,
    longPressDelay,
    hapticFeedback,
    scale,
    glowOpacity,
    glowScale,
  ]);

  const handlePressOut = useCallback(() => {
    isPressedRef.current = false;

    if (longPressTimerRef.current !== undefined) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }

    scale.value = withSpring(1, springConfigs.smooth);
    glowOpacity.value = withTiming(0, timingConfigs.fast);
    glowScale.value = withTiming(1, timingConfigs.fast);
  }, [scale, glowOpacity, glowScale]);

  const handlePress = useCallback(() => {
    if (!isPressedRef.current) {
      return;
    }

    scale.value = withSequence(
      withSpring(0.94, {
        damping: 15,
        stiffness: 600,
      }),
      withSpring(1, springConfigs.smooth)
    );

    handlePressOut();

    if (onPress) {
      onPress();
    }
  }, [onPress, scale, handlePressOut]);

  const showReactionMenu = useCallback(() => {
    reactionMenuOpacity.value = withSpring(1, springConfigs.smooth);
    reactionMenuScale.value = withSpring(1, springConfigs.bouncy);
    reactionMenuTranslateY.value = withSpring(0, springConfigs.smooth);
  }, [reactionMenuOpacity, reactionMenuScale, reactionMenuTranslateY]);

  const hideReactionMenu = useCallback(() => {
    reactionMenuOpacity.value = withTiming(0, timingConfigs.fast);
    reactionMenuScale.value = withTiming(0.9, timingConfigs.fast);
    reactionMenuTranslateY.value = withTiming(10, timingConfigs.fast);
  }, [reactionMenuOpacity, reactionMenuScale, reactionMenuTranslateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowOpacity.value, [0, 1], [0, 20], Extrapolation.CLAMP);
    const shadowOpacity = interpolate(glowOpacity.value, [0, 1], [0, 0.5], Extrapolation.CLAMP);

    return {
      opacity: glowOpacity.value,
      transform: [{ scale: glowScale.value }],
      boxShadow: `0 0 ${shadowRadius}px rgba(59, 130, 246, ${shadowOpacity})`,
    };
  });

  const reactionMenuStyle = useAnimatedStyle(() => {
    return {
      opacity: reactionMenuOpacity.value,
      transform: [{ scale: reactionMenuScale.value }, { translateY: reactionMenuTranslateY.value }],
    };
  });

  return {
    scale,
    glowOpacity,
    glowScale,
    reactionMenuOpacity,
    reactionMenuScale,
    reactionMenuTranslateY,
    animatedStyle,
    glowStyle,
    reactionMenuStyle,
    handlePressIn,
    handlePressOut,
    handlePress,
    showReactionMenu,
    hideReactionMenu,
  };
}
