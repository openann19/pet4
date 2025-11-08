/**
 * Send "Warp" Effect Hook
 *
 * Creates a premium send animation with:
 * - Cubic bezier slide out (220ms)
 * - CSS glow trail with bloom effect (140ms decay)
 * - Haptic feedback (Selection at send, Light when status flips to "sent")
 *
 * Location: apps/web/src/effects/chat/bubbles/use-send-warp.ts
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { createLogger } from '@/lib/logger';
import { triggerHaptic } from '../core/haptic-manager';
import { getReducedMotionDuration, useReducedMotionSV } from '../core/reduced-motion';
import { logEffectEnd, logEffectStart } from '../core/telemetry';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

const logger = createLogger('send-warp');

/**
 * Cubic bezier easing: (0.17, 0.84, 0.44, 1)
 * Custom easing for send warp slide
 */
const SEND_WARP_EASING = Easing.bezier(0.17, 0.84, 0.44, 1);

/**
 * Send warp effect options
 */
export interface UseSendWarpOptions {
  enabled?: boolean;
  onComplete?: () => void;
  onStatusChange?: (status: 'sending' | 'sent') => void;
}

/**
 * Send warp effect return type
 */
export interface UseSendWarpReturn {
  translateX: SharedValue<number>;
  opacity: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  bloomIntensity: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  trigger: () => void;
  triggerStatusChange: (status: 'sent') => void;
}

const DEFAULT_ENABLED = true;
const SLIDE_DURATION = 220; // ms
const GLOW_DECAY_DURATION = 140; // ms

export function useSendWarp(options: UseSendWarpOptions = {}): UseSendWarpReturn {
  const { enabled = DEFAULT_ENABLED, onComplete, onStatusChange } = options;

  const reducedMotion = useReducedMotionSV();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const bloomIntensity = useSharedValue(0);

  const effectIdRef = useRef<string | null>(null);
  const hasTriggeredRef = useRef(false);

  const trigger = useCallback(() => {
    if (!enabled || hasTriggeredRef.current) {
      return;
    }

    hasTriggeredRef.current = true;

    // Check reduced motion
    const isReducedMotion = reducedMotion.value;
    const slideDuration = getReducedMotionDuration(SLIDE_DURATION, isReducedMotion);

    // Log effect start
    const effectId = logEffectStart('send-warp', {
      reducedMotion: isReducedMotion,
    });
    effectIdRef.current = effectId;

    // Trigger haptic: Selection at send
    triggerHaptic('selection');

    // Slide out animation
    translateX.value = withTiming(
      100, // slide right
      {
        duration: slideDuration,
        easing: isReducedMotion ? Easing.linear : SEND_WARP_EASING,
      }
    );

    // Fade out
    opacity.value = withTiming(0, {
      duration: slideDuration,
      easing: isReducedMotion ? Easing.linear : SEND_WARP_EASING,
    });

    // Glow trail animation (only if not reduced motion)
    if (!isReducedMotion) {
      glowOpacity.value = withTiming(
        1,
        {
          duration: 50, // quick fade in
          easing: Easing.out(Easing.ease),
        },
        () => {
          // Fade out after peak
          glowOpacity.value = withTiming(0, {
            duration: GLOW_DECAY_DURATION,
            easing: Easing.in(Easing.ease),
          });
        }
      );

      // Bloom animation - quick pulse then decay
      bloomIntensity.value = withTiming(
        0.9,
        {
          duration: 60,
          easing: Easing.out(Easing.ease),
        },
        () => {
          // Decay
          bloomIntensity.value = withTiming(0, {
            duration: 160,
            easing: Easing.in(Easing.ease),
          });
        }
      );
    }

    // Call onComplete after animation
    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, slideDuration);
    }

    // Log effect end
    setTimeout(() => {
      if (effectIdRef.current) {
        logEffectEnd(effectIdRef.current, {
          durationMs: slideDuration,
          success: true,
        });
        effectIdRef.current = null;
      }
    }, slideDuration);
  }, [enabled, reducedMotion, translateX, opacity, glowOpacity, bloomIntensity, onComplete]);

  const triggerStatusChange = useCallback(
    (status: 'sent') => {
      if (status === 'sent') {
        // Trigger haptic: Light when status flips to "sent"
        triggerHaptic('light');
        onStatusChange?.(status);
      }
    },
    [onStatusChange]
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  // Reset hasTriggeredRef when component unmounts or enabled changes
  useEffect(() => {
    if (!enabled) {
      hasTriggeredRef.current = false;
    }
  }, [enabled]);

  return {
    translateX,
    opacity,
    glowOpacity,
    bloomIntensity,
    animatedStyle,
    trigger,
    triggerStatusChange,
  };
}
