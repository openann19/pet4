/**
 * Multi-Touch Gestures Hook (Mobile)
 *
 * Provides multi-touch gesture support:
 * - Pinch-to-zoom
 * - Rotate
 * - Pan
 * - Gesture combination support
 * - Haptic feedback on gesture completion
 *
 * Location: apps/mobile/src/effects/gestures/use-multi-touch.ts
 */

import { useCallback, useRef } from 'react';
import React from 'react';
import { useSharedValue, withSpring, type SharedValue } from '@petspark/motion';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { triggerHapticByContext } from '../chat/core/haptic-manager';
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate';
import { adaptiveAnimationConfigs } from '../core/adaptive-animation-config';
import { useUIConfig } from '@/hooks/use-ui-config';
import { useSoundFeedback } from '@/hooks/use-sound-feedback';

/**
 * Multi-touch gesture options
 */
export interface UseMultiTouchOptions {
  enabled?: boolean;
  minScale?: number;
  maxScale?: number;
  onScaleChange?: (scale: number) => void;
  onRotationChange?: (rotation: number) => void;
  onPanChange?: (x: number, y: number) => void;
  onGestureComplete?: (gesture: 'pinch' | 'rotate' | 'pan') => void;
}

/**
 * Multi-touch gesture return type
 */
export interface UseMultiTouchReturn {
  scale: SharedValue<number>;
  rotation: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  GestureComponent: React.ComponentType<{ children: React.ReactNode }>;
}

const DEFAULT_ENABLED = true;
const DEFAULT_MIN_SCALE = 0.5;
const DEFAULT_MAX_SCALE = 3.0;

export function useMultiTouch(options: UseMultiTouchOptions = {}): UseMultiTouchReturn {
  const {
    enabled = DEFAULT_ENABLED,
    minScale = DEFAULT_MIN_SCALE,
    maxScale = DEFAULT_MAX_SCALE,
    onScaleChange,
    onRotationChange,
    onPanChange,
    onGestureComplete,
  } = options;

  const { hz } = useDeviceRefreshRate();
  const { feedback } = useUIConfig();
  const { playSwipe } = useSoundFeedback();

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const lastScale = useRef(1);
  const lastRotation = useRef(0);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .enabled(enabled)
    .onUpdate((event) => {
      const eventScale = event.scale ?? 1;
      const newScale = Math.max(
        minScale,
        Math.min(maxScale, lastScale.current * eventScale)
      );
      scale.value = newScale;
      onScaleChange?.(newScale);
    })
    .onEnd(() => {
      lastScale.current = scale.value;

      // Snap to bounds with spring animation
      const config = adaptiveAnimationConfigs.smoothEntry((hz === 60 || hz === 120 || hz === 240 ? hz : 60) as 60 | 120 | 240);
      if (scale.value < 1) {
        scale.value = withSpring(1, { stiffness: config.stiffness, damping: config.damping, mass: config.mass });
        lastScale.current = 1;
      } else if (scale.value > maxScale) {
        scale.value = withSpring(maxScale, { stiffness: config.stiffness, damping: config.damping, mass: config.mass });
        lastScale.current = maxScale;
      }

      // Haptic feedback on gesture completion
      if (feedback.haptics) {
        triggerHapticByContext('threshold');
      }
      if (feedback.sound) {
        playSwipe().catch(() => {
          // Silent fail
        });
      }

      onGestureComplete?.('pinch');
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .enabled(enabled)
    .onUpdate((event) => {
      const eventRotation = event.rotation ?? 0;
      const newRotation = lastRotation.current + eventRotation;
      rotation.value = newRotation;
      onRotationChange?.(newRotation);
    })
    .onEnd(() => {
      lastRotation.current = rotation.value;

      // Snap to nearest 90-degree angle
      const snapAngle = Math.round(rotation.value / (Math.PI / 2)) * (Math.PI / 2);
      const config = adaptiveAnimationConfigs.smoothEntry((hz === 60 || hz === 120 || hz === 240 ? hz : 60) as 60 | 120 | 240);
      rotation.value = withSpring(snapAngle, { stiffness: config.stiffness, damping: config.damping, mass: config.mass });
      lastRotation.current = snapAngle;

      // Haptic feedback
      if (feedback.haptics) {
        triggerHapticByContext('threshold');
      }
      if (feedback.sound) {
        playSwipe().catch(() => {
          // Silent fail
        });
      }

      onGestureComplete?.('rotate');
    });

  // Pan gesture
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onUpdate((event) => {
      translateX.value = lastTranslateX.current + event.translationX;
      translateY.value = lastTranslateY.current + event.translationY;
      onPanChange?.(translateX.value, translateY.value);
    })
    .onEnd(() => {
      lastTranslateX.current = translateX.value;
      lastTranslateY.current = translateY.value;

      // Haptic feedback
      if (feedback.haptics) {
        triggerHapticByContext('swipe');
      }
      if (feedback.sound) {
        playSwipe().catch(() => {
          // Silent fail
        });
      }

      onGestureComplete?.('pan');
    });

  // Combine gestures (simultaneous)
  const combinedGesture = Gesture.Simultaneous(pinchGesture, rotationGesture, panGesture);

  const GestureComponent = useCallback(
    ({ children }: { children: React.ReactNode }): React.JSX.Element => {
      return React.createElement(
        GestureDetector,
        { gesture: combinedGesture, children },
        children
      );
    },
    [combinedGesture]
  );

  return {
    scale,
    rotation,
    translateX,
    translateY,
    GestureComponent,
  };
}
