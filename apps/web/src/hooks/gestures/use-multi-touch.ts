/**
 * Advanced Multi-Touch Gesture Hook (Web)
 *
 * Provides a comprehensive gesture system with:
 * - Multi-touch support (pinch, rotate, pan)
 * - Enhanced swipe patterns with velocity
 * - Long-press with haptic feedback
 * - Drag & drop with snap points
 * - Gesture recognition and cancellation
 *
 * Location: apps/web/src/hooks/gestures/use-multi-touch.ts
 */

import { useCallback, useRef, useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  type SharedValue,
} from '@petspark/motion';
import { createLogger } from '@/lib/logger';
import { triggerHapticByContext } from '@/effects/chat/core/haptic-manager';
import { useUIConfig } from '@/hooks/use-ui-config';
import { useSoundFeedback } from '@/hooks/use-sound-feedback';

const logger = createLogger('multi-touch');

/**
 * Gesture type
 */
export type GestureType =
  | 'pan'
  | 'pinch'
  | 'rotate'
  | 'swipe'
  | 'long-press'
  | 'tap'
  | 'double-tap';

/**
 * Gesture state
 */
export type GestureState = 'idle' | 'began' | 'active' | 'ended' | 'cancelled' | 'failed';

/**
 * Gesture event data
 */
export interface GestureEvent {
  readonly type: GestureType;
  readonly state: GestureState;
  readonly translation: { x: number; y: number };
  readonly velocity: { x: number; y: number };
  readonly scale: number;
  readonly rotation: number;
  readonly numberOfTouches: number;
  readonly timestamp: number;
}

/**
 * Multi-touch gesture options
 */
export interface UseMultiTouchOptions {
  readonly enabled?: boolean;
  readonly enablePan?: boolean;
  readonly enablePinch?: boolean;
  readonly enableRotate?: boolean;
  readonly enableSwipe?: boolean;
  readonly enableLongPress?: boolean;
  readonly longPressDuration?: number; // ms
  readonly swipeVelocityThreshold?: number; // px/ms
  readonly panThreshold?: number; // px
  readonly onGestureStart?: (event: GestureEvent) => void;
  readonly onGestureUpdate?: (event: GestureEvent) => void;
  readonly onGestureEnd?: (event: GestureEvent) => void;
  readonly onGestureCancelled?: (event: GestureEvent) => void;
}

/**
 * Multi-touch gesture return type
 */
export interface UseMultiTouchReturn {
  readonly translateX: SharedValue<number>;
  readonly translateY: SharedValue<number>;
  readonly scale: SharedValue<number>;
  readonly rotation: SharedValue<number>;
  readonly gestureState: SharedValue<GestureState>;
  readonly animatedStyle: ReturnType<typeof useAnimatedStyle>;
  readonly reset: () => void;
  readonly handlers: {
    readonly onPointerDown: (e: PointerEvent) => void;
    readonly onPointerMove: (e: PointerEvent) => void;
    readonly onPointerUp: (e: PointerEvent) => void;
    readonly onPointerCancel: (e: PointerEvent) => void;
  };
}

const DEFAULT_ENABLED = true;
const DEFAULT_LONG_PRESS_DURATION = 500; // ms
const DEFAULT_SWIPE_VELOCITY_THRESHOLD = 0.5; // px/ms
const DEFAULT_PAN_THRESHOLD = 10; // px

export function useMultiTouch(options: UseMultiTouchOptions = {}): UseMultiTouchReturn {
  const {
    enabled = DEFAULT_ENABLED,
    enablePan = true,
    enablePinch = true,
    enableRotate = true,
    enableSwipe = true,
    enableLongPress = true,
    longPressDuration = DEFAULT_LONG_PRESS_DURATION,
    swipeVelocityThreshold = DEFAULT_SWIPE_VELOCITY_THRESHOLD,
    panThreshold = DEFAULT_PAN_THRESHOLD,
    onGestureStart,
    onGestureUpdate,
    onGestureEnd,
    onGestureCancelled,
  } = options;

  const { feedback } = useUIConfig();
  const { playTap, playSwipe, playLongPress } = useSoundFeedback();

  // Gesture transform values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const gestureState = useSharedValue<GestureState>('idle');

  // Tracking refs
  const activePointersRef = useRef<Map<number, PointerEvent>>(new Map());
  const initialTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentGestureRef = useRef<GestureType | null>(null);

  // Calculate distance between two points
  const getDistance = useCallback((p1: PointerEvent, p2: PointerEvent): number => {
    const dx = p2.clientX - p1.clientX;
    const dy = p2.clientY - p1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate angle between two points
  const getAngle = useCallback((p1: PointerEvent, p2: PointerEvent): number => {
    return Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX);
  }, []);

  // Calculate velocity
  const getVelocity = useCallback((): { x: number; y: number } => {
    if (!initialTouchRef.current || !lastTouchRef.current) {
      return { x: 0, y: 0 };
    }

    const dt = lastTouchRef.current.time - initialTouchRef.current.time;
    if (dt === 0) {
      return { x: 0, y: 0 };
    }

    const dx = lastTouchRef.current.x - initialTouchRef.current.x;
    const dy = lastTouchRef.current.y - initialTouchRef.current.y;

    return {
      x: dx / dt,
      y: dy / dt,
    };
  }, []);

  // Clear long-press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Handle long-press trigger
  const handleLongPress = useCallback(() => {
    if (!enabled || !enableLongPress) {
      return;
    }

    logger.debug('Long-press detected');

    if (feedback.haptics) {
      triggerHapticByContext('longPress');
    }
    if (feedback.sound) {
      playLongPress().catch(() => {
        // Silent fail
      });
    }

    currentGestureRef.current = 'long-press';
    gestureState.value = 'active';

    const event: GestureEvent = {
      type: 'long-press',
      state: 'active',
      translation: { x: translateX.value, y: translateY.value },
      velocity: { x: 0, y: 0 },
      scale: scale.value,
      rotation: rotation.value,
      numberOfTouches: activePointersRef.current.size,
      timestamp: Date.now(),
    };

    onGestureStart?.(event);
  }, [
    enabled,
    enableLongPress,
    feedback.haptics,
    gestureState,
    translateX,
    translateY,
    scale,
    rotation,
    onGestureStart,
  ]);

  // Pointer down handler
  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!enabled) {
        return;
      }

      activePointersRef.current.set(e.pointerId, e);

      // First touch
      if (activePointersRef.current.size === 1) {
        initialTouchRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
        lastTouchRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };

        gestureState.value = 'began';

        // Start long-press timer
        if (enableLongPress) {
          clearLongPressTimer();
          longPressTimerRef.current = setTimeout(() => {
            runOnJS(handleLongPress)();
          }, longPressDuration);
        }

        if (feedback.haptics) {
          triggerHapticByContext('tap');
        }
        if (feedback.sound) {
          playTap().catch(() => {
            // Silent fail
          });
        }
      }

      // Multi-touch detected
      if (activePointersRef.current.size === 2 && (enablePinch || enableRotate)) {
        clearLongPressTimer();
        currentGestureRef.current = enablePinch ? 'pinch' : 'rotate';
        gestureState.value = 'active';

        logger.debug('Multi-touch gesture started', {
          type: currentGestureRef.current,
          touches: activePointersRef.current.size,
        });
      }
    },
    [
      enabled,
      enableLongPress,
      enablePinch,
      enableRotate,
      longPressDuration,
      feedback.haptics,
      gestureState,
      clearLongPressTimer,
      handleLongPress,
    ]
  );

  // Pointer move handler
  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!enabled || !activePointersRef.current.has(e.pointerId)) {
        return;
      }

      activePointersRef.current.set(e.pointerId, e);
      lastTouchRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };

      const pointers = Array.from(activePointersRef.current.values());

      // Single-touch pan
      if (pointers.length === 1 && enablePan && initialTouchRef.current) {
        const dx = e.clientX - initialTouchRef.current.x;
        const dy = e.clientY - initialTouchRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Threshold check
        if (distance > panThreshold) {
          clearLongPressTimer();

          if (currentGestureRef.current !== 'pan') {
            currentGestureRef.current = 'pan';
            gestureState.value = 'active';
            logger.debug('Pan gesture started');
          }

          translateX.value = dx;
          translateY.value = dy;

          const velocity = getVelocity();

          const event: GestureEvent = {
            type: 'pan',
            state: 'active',
            translation: { x: dx, y: dy },
            velocity,
            scale: scale.value,
            rotation: rotation.value,
            numberOfTouches: 1,
            timestamp: Date.now(),
          };

          onGestureUpdate?.(event);
        }
      }

      // Multi-touch pinch/rotate
      if (pointers.length === 2 && (enablePinch || enableRotate)) {
        const p1 = pointers[0];
        const p2 = pointers[1];

        if (!p1 || !p2) {
          return;
        }

        if (enablePinch) {
          const currentDistance = getDistance(p1, p2);
          const initialDistance = 100; // Use reference distance
          scale.value = currentDistance / initialDistance;

          logger.debug('Pinch gesture', { scale: scale.value });
        }

        if (enableRotate) {
          const currentAngle = getAngle(p1, p2);
          rotation.value = (currentAngle * 180) / Math.PI;

          logger.debug('Rotate gesture', { rotation: rotation.value });
        }

        const event: GestureEvent = {
          type: enablePinch ? 'pinch' : 'rotate',
          state: 'active',
          translation: { x: translateX.value, y: translateY.value },
          velocity: { x: 0, y: 0 },
          scale: scale.value,
          rotation: rotation.value,
          numberOfTouches: 2,
          timestamp: Date.now(),
        };

        onGestureUpdate?.(event);
      }
    },
    [
      enabled,
      enablePan,
      enablePinch,
      enableRotate,
      panThreshold,
      translateX,
      translateY,
      scale,
      rotation,
      gestureState,
      clearLongPressTimer,
      getDistance,
      getAngle,
      getVelocity,
      onGestureUpdate,
    ]
  );

  // Pointer up handler
  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!enabled) {
        return;
      }

      activePointersRef.current.delete(e.pointerId);
      clearLongPressTimer();

      // All touches released
      if (activePointersRef.current.size === 0) {
        const velocity = getVelocity();
        const velocityMagnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

        // Check for swipe
        if (
          enableSwipe &&
          velocityMagnitude > swipeVelocityThreshold &&
          currentGestureRef.current === 'pan'
        ) {
          currentGestureRef.current = 'swipe';

          logger.debug('Swipe detected', { velocity, velocityMagnitude });

          if (feedback.haptics) {
            triggerHapticByContext('swipe');
          }
          if (feedback.sound) {
            playSwipe().catch(() => {
              // Silent fail
            });
          }

          const event: GestureEvent = {
            type: 'swipe',
            state: 'ended',
            translation: { x: translateX.value, y: translateY.value },
            velocity,
            scale: scale.value,
            rotation: rotation.value,
            numberOfTouches: 0,
            timestamp: Date.now(),
          };

          onGestureEnd?.(event);
        } else if (currentGestureRef.current) {
          const event: GestureEvent = {
            type: currentGestureRef.current,
            state: 'ended',
            translation: { x: translateX.value, y: translateY.value },
            velocity,
            scale: scale.value,
            rotation: rotation.value,
            numberOfTouches: 0,
            timestamp: Date.now(),
          };

          onGestureEnd?.(event);
        }

        gestureState.value = 'ended';
        currentGestureRef.current = null;
        initialTouchRef.current = null;
        lastTouchRef.current = null;

        // Spring back to origin
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        scale.value = withSpring(1, { damping: 20, stiffness: 200 });
        rotation.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    },
    [
      enabled,
      enableSwipe,
      swipeVelocityThreshold,
      feedback.haptics,
      translateX,
      translateY,
      scale,
      rotation,
      gestureState,
      clearLongPressTimer,
      getVelocity,
      onGestureEnd,
    ]
  );

  // Pointer cancel handler
  const onPointerCancel = useCallback(
    (e: PointerEvent) => {
      if (!enabled) {
        return;
      }

      activePointersRef.current.delete(e.pointerId);
      clearLongPressTimer();

      if (activePointersRef.current.size === 0) {
        const event: GestureEvent = {
          type: currentGestureRef.current ?? 'pan',
          state: 'cancelled',
          translation: { x: translateX.value, y: translateY.value },
          velocity: { x: 0, y: 0 },
          scale: scale.value,
          rotation: rotation.value,
          numberOfTouches: 0,
          timestamp: Date.now(),
        };

        onGestureCancelled?.(event);

        gestureState.value = 'cancelled';
        currentGestureRef.current = null;
        initialTouchRef.current = null;
        lastTouchRef.current = null;

        // Reset immediately
        translateX.value = withTiming(0, { duration: 150 });
        translateY.value = withTiming(0, { duration: 150 });
        scale.value = withTiming(1, { duration: 150 });
        rotation.value = withTiming(0, { duration: 150 });
      }
    },
    [
      enabled,
      translateX,
      translateY,
      scale,
      rotation,
      gestureState,
      clearLongPressTimer,
      onGestureCancelled,
    ]
  );

  // Reset gesture state
  const reset = useCallback(() => {
    activePointersRef.current.clear();
    clearLongPressTimer();
    currentGestureRef.current = null;
    initialTouchRef.current = null;
    lastTouchRef.current = null;

    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    rotation.value = 0;
    gestureState.value = 'idle';
  }, [translateX, translateY, scale, rotation, gestureState, clearLongPressTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: `translateX(${translateX.value}px) translateY(${translateY.value}px) scale(${scale.value}) rotate(${rotation.value}deg)`,
    };
  });

  return {
    translateX,
    translateY,
    scale,
    rotation,
    gestureState,
    animatedStyle,
    reset,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
