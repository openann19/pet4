'use client';

import { useState, useCallback, useRef } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from '@petspark/motion';
import { haptics } from '@/lib/haptics';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';

interface UseSwipeOptions {
  onSwipe?: (direction: 'left' | 'right') => void;
  swipeThreshold?: number;
  swipeVelocity?: number;
  hapticFeedback?: boolean;
}

export function useSwipe({
  onSwipe,
  swipeThreshold = 150,
  swipeVelocity = 500,
  hapticFeedback = true,
}: UseSwipeOptions = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const x = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const likeOpacity = useSharedValue(0);
  const passOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: x.value }, { rotate: `${rotate.value}deg` }],
      opacity: opacity.value,
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: likeOpacity.value,
      transform: [{ scale: likeOpacity.value }],
    };
  });

  const passOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: passOpacity.value,
      transform: [{ scale: passOpacity.value }],
    };
  });

  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleDragStart = useCallback(
    (clientX: number) => {
      setIsDragging(true);
      isDraggingRef.current = true;
      startXRef.current = clientX;
      if (hapticFeedback) {
        haptics.selection();
      }
    },
    [hapticFeedback]
  );

  const handleDrag = useCallback(
    (translationX: number) => {
      x.value = translationX;
      rotate.value = interpolate(translationX, [-300, 0, 300], [-30, 0, 30], Extrapolation.CLAMP);
      opacity.value = interpolate(
        translationX,
        [-300, -150, 0, 150, 300],
        [0, 1, 1, 1, 0],
        Extrapolation.CLAMP
      );
      likeOpacity.value = interpolate(translationX, [0, 150], [0, 1], Extrapolation.CLAMP);
      passOpacity.value = interpolate(translationX, [-150, 0], [1, 0], Extrapolation.CLAMP);

      const threshold = 80;
      if (
        hapticFeedback &&
        Math.abs(translationX) > threshold &&
        Math.abs(translationX) < threshold + 20
      ) {
        haptics.trigger('light');
      }
    },
    [hapticFeedback, x, rotate, opacity, likeOpacity, passOpacity]
  );

  const handleDragEnd = useCallback(
    (clientX: number, velocityX: number) => {
      setIsDragging(false);
      isDraggingRef.current = false;

      const translationX = clientX - startXRef.current;

      if (Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > swipeVelocity) {
        const action = translationX > 0 ? 'right' : 'left';
        setDirection(action);

        if (hapticFeedback) {
          haptics.trigger(action === 'right' ? 'success' : 'light');
        }

        onSwipe?.(action);

        // Animate out
        x.value = withSpring(action === 'right' ? 1000 : -1000, springConfigs.smooth);
        opacity.value = withTiming(0, timingConfigs.fast);

        // Reset after animation
        setTimeout(() => {
          x.value = 0;
          rotate.value = 0;
          opacity.value = 1;
          likeOpacity.value = 0;
          passOpacity.value = 0;
          setDirection(null);
        }, 300);
      } else {
        // Spring back
        x.value = withSpring(0, springConfigs.smooth);
        rotate.value = withSpring(0, springConfigs.smooth);
        opacity.value = withSpring(1, springConfigs.smooth);
        likeOpacity.value = withSpring(0, springConfigs.smooth);
        passOpacity.value = withSpring(0, springConfigs.smooth);
        if (hapticFeedback) {
          haptics.trigger('light');
        }
      }
    },
    [
      swipeThreshold,
      swipeVelocity,
      hapticFeedback,
      onSwipe,
      x,
      rotate,
      opacity,
      likeOpacity,
      passOpacity,
    ]
  );

  const handleSwipe = useCallback(
    (action: 'left' | 'right') => {
      setDirection(action);
      if (hapticFeedback) {
        haptics.trigger(action === 'right' ? 'success' : 'light');
      }
      onSwipe?.(action);

      // Animate out
      x.value = withSpring(action === 'right' ? 1000 : -1000, springConfigs.smooth);
      opacity.value = withTiming(0, timingConfigs.fast);

      // Reset after animation
      setTimeout(() => {
        x.value = 0;
        rotate.value = 0;
        opacity.value = 1;
        likeOpacity.value = 0;
        passOpacity.value = 0;
        setDirection(null);
      }, 300);
    },
    [hapticFeedback, onSwipe, x, rotate, opacity, likeOpacity, passOpacity]
  );

  const reset = useCallback(() => {
    x.value = withSpring(0, springConfigs.smooth);
    rotate.value = withSpring(0, springConfigs.smooth);
    opacity.value = withSpring(1, springConfigs.smooth);
    likeOpacity.value = withSpring(0, springConfigs.smooth);
    passOpacity.value = withSpring(0, springConfigs.smooth);
    setDirection(null);
    setIsDragging(false);
  }, [x, rotate, opacity, likeOpacity, passOpacity]);

  // Mouse/touch event handlers for web
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientX);
    },
    [handleDragStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;
      const translationX = e.clientX - startXRef.current;
      handleDrag(translationX);
    },
    [handleDrag]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;
      handleDragEnd(e.clientX, 0);
    },
    [handleDragEnd]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        handleDragStart(touch.clientX);
      }
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      const touch = e.touches[0];
      if (touch) {
        const translationX = touch.clientX - startXRef.current;
        handleDrag(translationX);
      }
    },
    [handleDrag]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      const touch = e.changedTouches[0];
      if (touch) {
        handleDragEnd(touch.clientX, 0);
      }
    },
    [handleDragEnd]
  );

  return {
    isDragging,
    direction,
    animatedStyle,
    likeOpacityStyle,
    passOpacityStyle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleSwipe,
    reset,
  };
}
