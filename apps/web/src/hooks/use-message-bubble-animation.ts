'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Extrapolation,
  Easing,
  animateWithTiming,
  type SharedValue,
  type AnimatedStyle,
} from '@petspark/motion';
import { isTruthy } from '@petspark/shared';
import { useEffect, useCallback, useRef } from 'react';
import { haptics } from '@/lib/haptics';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { useReducedMotionSV, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion';

export interface UseMessageBubbleAnimationOptions {
  index?: number;
  staggerDelay?: number;
  isHighlighted?: boolean;
  isNew?: boolean;
  highlightedColor?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  hapticFeedback?: boolean;
}

export interface UseMessageBubbleAnimationReturn {
  opacity: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  glowScale: SharedValue<number>;
  backgroundOpacity: SharedValue<number>;
  reactionScale: SharedValue<number>;
  reactionTranslateY: SharedValue<number>;
  reactionOpacity: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  glowStyle: ReturnType<typeof useAnimatedStyle>;
  backgroundStyle: ReturnType<typeof useAnimatedStyle>;
  reactionStyle: ReturnType<typeof useAnimatedStyle>;
  handlePress: () => void;
  handlePressIn: () => void;
  handlePressOut: () => void;
  handleLongPressStart: () => void;
  handleLongPressEnd: () => void;
  animateReaction: (emoji: string) => void;
  animateHighlight: () => void;
}

const DEFAULT_STAGGER_DELAY = 50;
const DEFAULT_HIGHLIGHT_COLOR = 'rgba(255, 215, 0, 0.3)';

export function useMessageBubbleAnimation(
  options: UseMessageBubbleAnimationOptions = {}
): UseMessageBubbleAnimationReturn {
  const {
    index = 0,
    staggerDelay = DEFAULT_STAGGER_DELAY,
    isHighlighted = false,
    isNew = true,
    highlightedColor = DEFAULT_HIGHLIGHT_COLOR,
    onPress,
    onLongPress,
    hapticFeedback = true,
  } = options;

  const reducedMotion = useReducedMotionSV();

  // Initialize values - ensure initial state is set correctly before animations
  const opacity = useSharedValue(isNew ? 0 : 1);
  const translateY = useSharedValue(isNew ? 20 : 0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const backgroundOpacity = useSharedValue(0);
  const reactionScale = useSharedValue(1);
  const reactionTranslateY = useSharedValue(0);
  const reactionOpacity = useSharedValue(0);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isPressedRef = useRef(false);

  // Entry animation effect
  useEffect(() => {
    if (isNew) {
      const isReducedMotion = reducedMotion.value;
      const delay = isReducedMotion ? 0 : index * staggerDelay;
      const duration = getReducedMotionDuration(300, Boolean(isReducedMotion));

      if (isReducedMotion) {
        // Reduced motion: instant state change
        opacity.value = withTiming(1, {
          duration: duration,
          easing: Easing.linear,
        });
        translateY.value = withTiming(0, {
          duration: duration,
          easing: Easing.linear,
        });
      } else {
        // Normal motion: staggered spring animation
        opacity.value = withDelay(delay, withSpring(1, springConfigs.smooth));
        translateY.value = withDelay(
          delay,
          withSpring(0, {
            damping: 25,
            stiffness: 400,
          })
        );
      }
    } else {
      // Ensure values are set correctly when not new
      opacity.value = 1;
      translateY.value = 0;
    }

    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [isNew, index, staggerDelay, opacity, translateY, reducedMotion]);

  // Highlight animation effect
  useEffect(() => {
    const isReducedMotion = reducedMotion.value;
    const fastDuration = getReducedMotionDuration(150, Boolean(isReducedMotion));
    const smoothDuration = getReducedMotionDuration(300, Boolean(isReducedMotion));

    if (isHighlighted) {
      if (isReducedMotion) {
        // Reduced motion: instant highlight, quick fade
        backgroundOpacity.value = withSequence(
          withTiming(1, {
            duration: fastDuration,
            easing: Easing.linear,
          }),
          withDelay(
            1500,
            withTiming(0, {
              duration: smoothDuration,
              easing: Easing.linear,
            })
          )
        );
      } else {
        // Normal motion: smooth sequence
        backgroundOpacity.value = withSequence(
          withTiming(1, timingConfigs.fast),
          withDelay(2000, withTiming(0, timingConfigs.smooth))
        );
      }
    } else {
      backgroundOpacity.value = withTiming(0, {
        duration: fastDuration,
        easing: Easing.linear,
      });
    }
  }, [isHighlighted, backgroundOpacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Record<string, string | number>[] = [];
    
    const translateYValue = translateY.get();
    if (translateYValue !== 0) transforms.push({ translateY: translateYValue });
    
    const scaleValue = scale.get();
    if (scaleValue !== 1) transforms.push({ scale: scaleValue });

    return {
      opacity: opacity.get(),
      transform: transforms,
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

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: backgroundOpacity.value > 0 ? highlightedColor : 'transparent',
      opacity: backgroundOpacity.value,
    };
  });

  const reactionStyle = useAnimatedStyle(() => {
    const transforms: Record<string, string | number>[] = [];
    
    const scaleValue = reactionScale.get();
    if (scaleValue !== 1) transforms.push({ scale: scaleValue });
    
    const translateYValue = reactionTranslateY.get();
    if (translateYValue !== 0) transforms.push({ translateY: translateYValue });

    return {
      transform: transforms,
      opacity: reactionOpacity.get(),
    };
  });

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback) {
      haptics.selection();
    }
  }, [hapticFeedback]);

  const triggerLongPress = useCallback(() => {
    if (onLongPress) {
      onLongPress();
    }
  }, [onLongPress]);

  const handlePressIn = useCallback(() => {
    triggerHaptic();
    isPressedRef.current = true;
    const isReducedMotion = reducedMotion.value;

    if (isReducedMotion) {
      const duration = getReducedMotionDuration(120, true);
      scale.value = withTiming(0.96, {
        duration: duration,
        easing: Easing.linear,
      });
      glowOpacity.value = withTiming(1, {
        duration: duration,
        easing: Easing.linear,
      });
      glowScale.value = withTiming(1.05, {
        duration: duration,
        easing: Easing.linear,
      });
    } else {
      scale.value = withSpring(0.96, {
        damping: 20,
        stiffness: 500,
      });
      glowOpacity.value = withSpring(1, springConfigs.smooth);
      glowScale.value = withSpring(1.05, springConfigs.smooth);
    }

    if (isTruthy(onLongPress)) {
      longPressTimerRef.current = setTimeout(() => {
        if (isPressedRef.current) {
          triggerLongPress();
        }
      }, 500);
    }
  }, [scale, glowOpacity, glowScale, onLongPress, triggerHaptic, triggerLongPress, reducedMotion]);

  const handlePressOut = useCallback(() => {
    isPressedRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }

    const isReducedMotion = reducedMotion.value;
    const fastDuration = getReducedMotionDuration(150, Boolean(isReducedMotion));

    if (isReducedMotion) {
      scale.value = withTiming(1, {
        duration: fastDuration,
        easing: Easing.linear,
      });
      glowOpacity.value = withTiming(0, {
        duration: fastDuration,
        easing: Easing.linear,
      });
      glowScale.value = withTiming(1, {
        duration: fastDuration,
        easing: Easing.linear,
      });
    } else {
      scale.value = withSpring(1, springConfigs.smooth);
      glowOpacity.value = withTiming(0, timingConfigs.fast);
      glowScale.value = withTiming(1, timingConfigs.fast);
    }
  }, [scale, glowOpacity, glowScale, reducedMotion]);

  const handlePress = useCallback(() => {
    if (!isPressedRef.current) {
      return;
    }

    if (onPress) {
      onPress();
    }

    const isReducedMotion = reducedMotion.value;

    if (isReducedMotion) {
      const duration = getReducedMotionDuration(120, true);
      void animateWithTiming(scale, 0.94, {
        duration: duration,
        easing: Easing.linear,
      }).then(() => {
        scale.value = withTiming(1, {
          duration: duration,
          easing: Easing.linear,
        });
      });
    } else {
      scale.value = withSequence(
        withSpring(0.94, {
          damping: 15,
          stiffness: 600,
        }),
        withSpring(1, springConfigs.smooth)
      );
    }

    handlePressOut();
  }, [onPress, scale, handlePressOut, reducedMotion]);

  const handleLongPressStart = useCallback(() => {
    handlePressIn();
  }, [handlePressIn]);

  const handleLongPressEnd = useCallback(() => {
    handlePressOut();
  }, [handlePressOut]);

  const animateReaction = useCallback(
    (_emoji: string) => {
      const isReducedMotion = reducedMotion.value;
      const fastDuration = getReducedMotionDuration(150, Boolean(isReducedMotion));
      const smoothDuration = getReducedMotionDuration(300, Boolean(isReducedMotion));

      reactionScale.value = 1;
      reactionTranslateY.value = 0;
      reactionOpacity.value = 1;

      if (isReducedMotion) {
        // Reduced motion: simplified animation
        void animateWithTiming(reactionScale, 1.2, {
          duration: fastDuration,
          easing: Easing.linear,
        }).then(() => {
          reactionScale.value = withTiming(1, {
            duration: smoothDuration,
            easing: Easing.linear,
          });
        });
        reactionTranslateY.value = withTiming(-15, {
          duration: fastDuration,
          easing: Easing.linear,
        });
        reactionOpacity.value = withSequence(
          withTiming(1, {
            duration: fastDuration,
            easing: Easing.linear,
          }),
          withDelay(
            300,
            withTiming(0, {
              duration: smoothDuration,
              easing: Easing.linear,
            })
          )
        );
      } else {
        // Normal motion: full spring animation
        reactionScale.value = withSequence(
          withSpring(1.5, {
            damping: 10,
            stiffness: 400,
          }),
          withSpring(1.2, springConfigs.bouncy)
        );

        reactionTranslateY.value = withTiming(-30, {
          duration: 800,
        });

        reactionOpacity.value = withSequence(
          withTiming(1, timingConfigs.fast),
          withDelay(400, withTiming(0, timingConfigs.smooth))
        );
      }

      triggerHaptic();
    },
    [reactionScale, reactionTranslateY, reactionOpacity, triggerHaptic, reducedMotion]
  );

  const animateHighlight = useCallback(() => {
    const isReducedMotion = reducedMotion.value;
    const fastDuration = getReducedMotionDuration(150, Boolean(isReducedMotion));
    const smoothDuration = getReducedMotionDuration(300, Boolean(isReducedMotion));

    if (isReducedMotion) {
      backgroundOpacity.value = withSequence(
        withTiming(1, {
          duration: fastDuration,
          easing: Easing.linear,
        }),
        withDelay(
          1500,
          withTiming(0, {
            duration: smoothDuration,
            easing: Easing.linear,
          })
        )
      );
    } else {
      backgroundOpacity.value = withSequence(
        withTiming(1, timingConfigs.fast),
        withDelay(1500, withTiming(0, timingConfigs.smooth))
      );
    }
  }, [backgroundOpacity, reducedMotion]);

  return {
    opacity,
    translateY,
    scale,
    glowOpacity,
    glowScale,
    backgroundOpacity,
    reactionScale,
    reactionTranslateY,
    reactionOpacity,
    animatedStyle,
    glowStyle,
    backgroundStyle,
    reactionStyle,
    handlePress,
    handlePressIn,
    handlePressOut,
    handleLongPressStart,
    handleLongPressEnd,
    animateReaction,
    animateHighlight,
  };
}
