import { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { motion } from '../tokens';
import { useReducedMotionSV } from '../reduced-motion';

// Optional gesture handler import (may not be available in all environments)
let Gesture: {
  Pan: () => {
    onUpdate: (handler: (e: { absoluteX: number; absoluteY: number }) => void) => unknown;
    onEnd: (handler: () => void) => unknown;
  };
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RNGH = require('react-native-gesture-handler');
  Gesture = RNGH.Gesture;
} catch {
  // react-native-gesture-handler not available (e.g., web environment)
}

export interface UseMagneticOptions {
  radius?: number;
  strength?: number;
}

export interface UseMagneticReturn {
  onLayout: (e: LayoutChangeEvent) => void;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  gesture?: unknown;
}

/**
 * Hook for magnetic attraction effect (follows pointer/finger).
 * Respects reduced motion preferences (no magnetic effect when enabled).
 */
export function useMagnetic(radius = 80, strength = 0.15): UseMagneticReturn {
  const reducedMotion = useReducedMotionSV();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const ref = useRef<{ layout?: { x: number; y: number; w: number; h: number } }>({});

  function onLayout(e: LayoutChangeEvent): void {
    const { x, y, width: w, height: h } = e.nativeEvent.layout;
    ref.current.layout = { x, y, w, h };
  }

  // Create gesture handler if available (React Native only)
  const gesture = Gesture
    ? (() => {
        const pan = Gesture.Pan();
        pan.onUpdate((e: { absoluteX: number; absoluteY: number }) => {
          if (reducedMotion.value) return; // No magnetic effect when reduced motion is enabled
          
          const L = ref.current.layout;
          if (!L) return;
          const cx = L.x + L.w / 2;
          const cy = L.y + L.h / 2;
          const dx = e.absoluteX - cx;
          const dy = e.absoluteY - cy;
          const d = Math.min(1, Math.hypot(dx, dy) / radius);
          tx.value = withSpring((1 - d) * dx * strength, motion.spring.soft);
          ty.value = withSpring((1 - d) * dy * strength, motion.spring.soft);
        });
        pan.onEnd(() => {
          tx.value = withSpring(0, motion.spring.smooth);
          ty.value = withSpring(0, motion.spring.smooth);
        });
        return pan;
      })()
    : undefined;

  const animatedStyle = useAnimatedStyle(() => {
    if (reducedMotion.value) {
      return {}; // No transform when reduced motion is enabled
    }
    return {
      transform: [{ translateX: tx.value }, { translateY: ty.value }],
    };
  });

  return { onLayout, animatedStyle, gesture };
}

