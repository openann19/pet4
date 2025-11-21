/**
 * Send "Warp" Effect Hook
 *
 * Creates a premium send animation with:
 * - Composer spawn state (opacity 0, translateY motionTheme distance, scale press)
 * - Deterministic lift-and-slide intro that respects reduced/off motion
 * - Optional glow/bloom trail tied to motion preferences
 * - Haptic feedback (Selection at send, Light when status flips to "sent")
 *
 * Location: apps/web/src/effects/chat/bubbles/use-send-warp.ts
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  type MotionStyle,
  type SharedValue,
} from '@petspark/motion';
import { motionTheme } from '@/config/motionTheme';
import type { PresenceMotion } from '@/effects/reanimated/types';
import {
  useMotionPreferences,
  type MotionHookOptions,
} from '@/effects/reanimated/useMotionPreferences';
import { triggerHaptic } from '../core/haptic-manager';
import { logEffectEnd, logEffectStart } from '../core/telemetry';
import { useUIConfig } from '@/hooks/use-ui-config';

export interface UseSendWarpOptions extends MotionHookOptions {
  enabled?: boolean;
  spawnOffsetY?: number;
  spawnScale?: number;
  travelX?: number;
  onComplete?: () => void;
  onStatusChange?: (status: 'sending' | 'sent') => void;
  enableGlow?: boolean;
}

export interface UseSendWarpReturn extends PresenceMotion<MotionStyle> {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
  opacityValue: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  glowScale: SharedValue<number>;
  bloomIntensity: SharedValue<number>;
  trigger: () => void;
  triggerStatusChange: (status: 'sent') => void;
}

const DEFAULT_ENABLED = true;
const DEFAULT_TRAVEL_X = 76;

export function useSendWarp(options: UseSendWarpOptions = {}): UseSendWarpReturn {
  const {
    enabled = DEFAULT_ENABLED,
    spawnOffsetY = motionTheme.distance.listStaggerY ?? 12,
    spawnScale = motionTheme.scale.press,
    travelX = DEFAULT_TRAVEL_X,
    onComplete,
    onStatusChange,
    enableGlow = true,
    preferences: overridePreferences,
    respectPreferences = true,
  } = options;

  const { visual, animation, feedback } = useUIConfig();
  const preferences = overridePreferences ?? useMotionPreferences();
  const isOff = respectPreferences && preferences.isOff;
  const isReduced = respectPreferences && preferences.isReduced && !preferences.isOff;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(spawnOffsetY);
  const scale = useSharedValue(spawnScale);
  const opacityValue = useSharedValue(isOff ? 1 : 0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const bloomIntensity = useSharedValue(0);

  const animatedStyle = useMemo<MotionStyle>(() => {
    return {
      opacity: opacityValue,
      x: translateX,
      y: translateY,
      scale,
    } satisfies MotionStyle;
  }, [opacityValue, scale, translateX, translateY]);

  const effectIdRef = useRef<string | null>(null);
  const hasTriggeredRef = useRef(false);

  const resetValues = useCallback(() => {
    translateX.value = 0;
    translateY.value = isOff ? 0 : spawnOffsetY;
    scale.value = isOff ? 1 : spawnScale;
    opacityValue.value = isOff ? 1 : 0;
    glowOpacity.value = 0;
    glowScale.value = 1;
    bloomIntensity.value = 0;
  }, [
    bloomIntensity,
    glowOpacity,
    glowScale,
    isOff,
    opacityValue,
    scale,
    spawnOffsetY,
    spawnScale,
    translateX,
    translateY,
  ]);

  useEffect(() => {
    resetValues();
    hasTriggeredRef.current = false;
  }, [enabled, resetValues]);

  const runGlowTrail = useCallback(() => {
    if (!enableGlow || !visual.enableGlow || isReduced) {
      return;
    }

    const glowDurationMs = motionTheme.durations.fast;
    const bloomDurationMs = motionTheme.durations.normal;

    glowOpacity.value = withSequence(
      withTiming(1, { duration: glowDurationMs, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: glowDurationMs, easing: Easing.in(Easing.ease) })
    );

    glowScale.value = withSequence(
      withTiming(1.05, { duration: glowDurationMs, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: glowDurationMs, easing: Easing.in(Easing.ease) })
    );

    if (animation.showParticles) {
      bloomIntensity.value = withSequence(
        withTiming(0.9, { duration: bloomDurationMs, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: bloomDurationMs, easing: Easing.in(Easing.cubic) })
      );
    }
  }, [
    animation.showParticles,
    enableGlow,
    glowOpacity,
    glowScale,
    isReduced,
    visual.enableGlow,
    bloomIntensity,
  ]);

  const trigger = useCallback(() => {
    if (!enabled || hasTriggeredRef.current) {
      return;
    }

    hasTriggeredRef.current = true;

    const effectId = logEffectStart('send-warp', {
      reducedMotion: isReduced,
      level: preferences.level,
    });
    effectIdRef.current = effectId;

    if (feedback.haptics) {
      triggerHaptic('selection');
    }

    if (isOff) {
      opacityValue.value = 1;
      translateY.value = 0;
      scale.value = 1;
      onComplete?.();
      if (effectId) {
        logEffectEnd(effectId, { durationMs: 0, success: true });
      }
      return;
    }

    const spring = isReduced ? motionTheme.spring.settled : motionTheme.spring.bouncy;
    const liftDurationMs = isReduced ? motionTheme.durations.fast : motionTheme.durations.normal;
    const travelDurationMs = isReduced
      ? motionTheme.durations.fast
      : (motionTheme.durations.slow ?? motionTheme.durations.normal);
    const travelDistance = isReduced ? travelX * 0.5 : travelX;

    opacityValue.value = withTiming(1, {
      duration: liftDurationMs,
      easing: Easing.out(Easing.cubic),
    });

    translateY.value = withTiming(0, {
      duration: liftDurationMs,
      easing: Easing.out(Easing.cubic),
    });

    scale.value = withSpring(1, {
      damping: spring.damping,
      stiffness: spring.stiffness,
    });

    translateX.value = withSequence(
      withTiming(travelDistance, {
        duration: travelDurationMs,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(0, {
        duration: motionTheme.durations.fast,
        easing: Easing.inOut(Easing.ease),
      })
    );

    runGlowTrail();

    const totalDuration = Math.max(liftDurationMs, travelDurationMs);

    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, totalDuration);
    }

    setTimeout(() => {
      if (effectIdRef.current) {
        logEffectEnd(effectIdRef.current, {
          durationMs: totalDuration,
          success: true,
        });
        effectIdRef.current = null;
      }
    }, totalDuration);
  }, [
    enabled,
    feedback.haptics,
    isOff,
    isReduced,
    onComplete,
    preferences.level,
    runGlowTrail,
    scale,
    translateX,
    translateY,
    travelX,
    opacityValue,
  ]);

  const triggerStatusChange = useCallback(
    (status: 'sent') => {
      if (feedback.haptics) {
        triggerHaptic('light');
      }
      onStatusChange?.(status);
    },
    [feedback.haptics, onStatusChange]
  );

  return {
    kind: 'presence',
    isVisible: !isOff,
    animatedStyle,
    translateX,
    translateY,
    scale,
    opacityValue,
    glowOpacity,
    glowScale,
    bloomIntensity,
    trigger,
    triggerStatusChange,
  };
}

export function useMessageSendMotion(options: UseSendWarpOptions = {}): UseSendWarpReturn {
  return useSendWarp(options);
}
