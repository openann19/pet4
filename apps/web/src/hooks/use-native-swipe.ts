'use client';

import type { AnimatedStyle } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { platformHaptics, type PlatformHaptics } from '@/lib/platform-haptics';
import { useCallback, useRef } from 'react';
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from '@petspark/motion';

export interface UseNativeSwipeOptions {
  cardWidth: number;
  commitThreshold?: number;
  velocityThreshold?: number;
  hapticFeedback?: boolean;
  haptics?: PlatformHaptics;
  onCommit?: (direction: 'left' | 'right', velocity: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  reduceMotion?: boolean;
}

export interface GestureHandlers {
  onDragStart?: (event: { x: number; y: number }) => void;
  onDrag?: (event: { translationX: number; translationY: number; velocityX: number }) => void;
  onDragEnd?: (event: { translationX: number; translationY: number; velocityX: number }) => void;
}

export interface UseNativeSwipeReturn {
  translationX: SharedValue<number>;
  translationY: SharedValue<number>;
  rotation: SharedValue<number>;
  opacity: SharedValue<number>;
  likeOpacity: SharedValue<number>;
  passOpacity: SharedValue<number>;
  scale: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  badgeStyle: AnimatedStyle;
  gestureHandlers: GestureHandlers;
  reset: () => void;
  commit: (direction: 'left' | 'right') => void;
}

const DEFAULT_COMMIT_THRESHOLD = 0.3;
const DEFAULT_VELOCITY_THRESHOLD = 800;
const DEFAULT_HAPTIC_FEEDBACK = true;
const MAX_ROTATION = 12;
const MAX_VERTICAL_DRAG = 30;

export function useNativeSwipe(options: UseNativeSwipeOptions): UseNativeSwipeReturn {
  const {
    cardWidth,
    commitThreshold = DEFAULT_COMMIT_THRESHOLD,
    velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    haptics: customHaptics,
    onCommit,
    onDragStart,
    onDragEnd,
    reduceMotion = false,
  } = options;

  const haptics = customHaptics || platformHaptics;
  const threshold = cardWidth * commitThreshold;

  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const likeOpacity = useSharedValue(0);
  const passOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const isCommittedRef = useRef(false);
  const hasCrossedThresholdRef = useRef(false);

  const triggerHaptic = useCallback(
    (type: 'selection' | 'light' | 'medium' | 'success') => {
      if (!hapticFeedback) return;

      switch (type) {
        case 'selection':
          haptics.selection();
          break;
        case 'light':
          haptics.impact('light');
          break;
        case 'medium':
          haptics.impact('medium');
          break;
        case 'success':
          haptics.success();
          break;
      }
    },
    [hapticFeedback, haptics]
  );

  const updateAnimation = useCallback(
    (translationXValue: number, translationYValue: number) => {
      const clampedX = Math.max(-cardWidth * 1.5, Math.min(cardWidth * 1.5, translationXValue));
      const clampedY = Math.max(
        -MAX_VERTICAL_DRAG,
        Math.min(MAX_VERTICAL_DRAG, translationYValue * 0.3)
      );

      translationX.value = clampedX;
      translationY.value = clampedY;

      const absX = Math.abs(clampedX);
      if (absX > threshold && !hasCrossedThresholdRef.current) {
        hasCrossedThresholdRef.current = true;
        triggerHaptic('medium');
      }
    },
    [cardWidth, threshold, translationX, translationY, triggerHaptic]
  );

  const handleCommit = useCallback(
    (direction: 'left' | 'right', velocity: number) => {
      if (isCommittedRef.current) return;
      isCommittedRef.current = true;

      triggerHaptic(direction === 'right' ? 'success' : 'light');

      const exitX = direction === 'right' ? cardWidth * 1.2 : -cardWidth * 1.2;
      const exitRotation = reduceMotion
        ? 0
        : direction === 'right'
          ? MAX_ROTATION + 5
          : -(MAX_ROTATION + 5);

      translationX.value = withSpring(exitX, {
        damping: 20,
        stiffness: 300,
        mass: 0.9,
      });

      rotation.value = withSpring(exitRotation, {
        damping: 20,
        stiffness: 300,
        mass: 0.9,
      });

      opacity.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
        mass: 0.9,
      });

      onCommit?.(direction, velocity);
    },
    [cardWidth, translationX, rotation, opacity, reduceMotion, triggerHaptic, onCommit]
  );

  const handleDragStart = useCallback(() => {
    if (isCommittedRef.current) return;
    triggerHaptic('selection');
    onDragStart?.();
    hasCrossedThresholdRef.current = false;
  }, [triggerHaptic, onDragStart]);

  const handleDrag = useCallback(
    (translationXValue: number, translationYValue: number) => {
      if (isCommittedRef.current) return;
      updateAnimation(translationXValue, translationYValue);
    },
    [updateAnimation]
  );

  const handleDragEnd = useCallback(
    (translationXValue: number, velocityX: number) => {
      if (isCommittedRef.current) return;

      const absX = Math.abs(translationXValue);
      const absVelocityX = Math.abs(velocityX);

      const shouldCommit = absX > threshold || absVelocityX > velocityThreshold;

      onDragEnd?.();

      if (shouldCommit) {
        const direction: 'left' | 'right' = translationXValue > 0 ? 'right' : 'left';
        handleCommit(direction, absVelocityX);
      } else {
        translationX.value = withSpring(0, springConfigs.smooth);
        translationY.value = withSpring(0, springConfigs.smooth);
        rotation.value = withSpring(0, springConfigs.smooth);
        likeOpacity.value = withSpring(0, springConfigs.smooth);
        passOpacity.value = withSpring(0, springConfigs.smooth);
        scale.value = withSpring(1, springConfigs.smooth);
        hasCrossedThresholdRef.current = false;
      }
    },
    [
      threshold,
      velocityThreshold,
      onDragEnd,
      handleCommit,
      translationX,
      translationY,
      rotation,
      likeOpacity,
      passOpacity,
      scale,
    ]
  );

  const gestureHandlers: GestureHandlers = {
    onDragStart: () => {
      handleDragStart();
    },
    onDrag: (event) => {
      handleDrag(event.translationX, event.translationY);
    },
    onDragEnd: (event) => {
      handleDragEnd(event.translationX, event.velocityX);
    },
  };

  const reset = useCallback(() => {
    isCommittedRef.current = false;
    hasCrossedThresholdRef.current = false;
    translationX.value = 0;
    translationY.value = 0;
    rotation.value = 0;
    opacity.value = 1;
    likeOpacity.value = 0;
    passOpacity.value = 0;
    scale.value = 1;
  }, [translationX, translationY, rotation, opacity, likeOpacity, passOpacity, scale]);

  const commit = useCallback(
    (direction: 'left' | 'right') => {
      handleCommit(direction, 0);
    },
    [handleCommit]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const clampedX = translationX.value;
    const rotationValue = reduceMotion
      ? 0
      : interpolate(
          clampedX,
          [-cardWidth, 0, cardWidth],
          [-MAX_ROTATION, 0, MAX_ROTATION],
          Extrapolation.CLAMP
        );

    const likeOpacityValue = interpolate(clampedX, [0, threshold], [0, 1], Extrapolation.CLAMP);

    const passOpacityValue = interpolate(clampedX, [-threshold, 0], [1, 0], Extrapolation.CLAMP);

    likeOpacity.value = likeOpacityValue;
    passOpacity.value = passOpacityValue;

    const progress = Math.abs(clampedX) / threshold;
    const scaleValue = interpolate(progress, [0, 1], [1, 0.96], Extrapolation.CLAMP);

    scale.value = scaleValue;

    return {
      transform: `translateX(${translationX.value}px) translateY(${translationY.value}px) rotate(${rotationValue}deg) scale(${scaleValue})`,
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  const badgeStyle = useAnimatedStyle(() => {
    const maxOpacity = Math.max(likeOpacity.value, passOpacity.value);
    return {
      opacity: maxOpacity,
      transform: [
        {
          scale: interpolate(maxOpacity, [0, 1], [0.8, 1], Extrapolation.CLAMP),
        },
      ],
    };
  }) as AnimatedStyle;

  return {
    translationX,
    translationY,
    rotation,
    opacity,
    likeOpacity,
    passOpacity,
    scale,
    animatedStyle,
    badgeStyle,
    gestureHandlers,
    reset,
    commit,
  };
}
