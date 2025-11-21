/**
 * Message Status Motion Hook (Web)
 *
 * Produces the animated style and color transitions for chat status icons
 * (sending → sent → delivered → read) while respecting motion preferences.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
  type MotionStyle,
} from '@petspark/motion';
import { motionTheme } from '@/config/motionTheme';
import type { StatusMotion } from '@/effects/reanimated/types';
import {
  useMotionPreferences,
  type MotionHookOptions,
} from '@/effects/reanimated/useMotionPreferences';
import { triggerHaptic } from '../core/haptic-manager';
import type { MessageStatus } from '@/lib/chat-types';

const STATUS_COLORS: Record<MessageStatus | 'failed', string> = {
  sending: '#CBD5F5',
  sent: '#A8B2C8',
  delivered: '#94A3B8',
  read: '#3B82F6',
  failed: '#EF4444',
};

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return [r || 0, g || 0, b || 0];
};

const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b]
    .map((value) => {
      const clamped = Math.max(0, Math.min(255, Math.round(value)));
      const hex = clamped.toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    })
    .join('')}`;

export interface UseMessageStatusMotionOptions extends MotionHookOptions {
  status: MessageStatus;
  previousStatus?: MessageStatus;
  isOwnMessage?: boolean;
}

export interface UseMessageStatusMotionReturn extends StatusMotion<MotionStyle> {
  readonly color: string;
}

export function useMessageStatusMotion(
  options: UseMessageStatusMotionOptions
): UseMessageStatusMotionReturn {
  const {
    status,
    previousStatus,
    isOwnMessage = false,
    preferences: overridePreferences,
    respectPreferences = true,
  } = options;

  const preferences = overridePreferences ?? useMotionPreferences();
  const isReduced = respectPreferences && preferences.isReduced && !preferences.isOff;
  const isOff = respectPreferences && preferences.isOff;

  const opacity = useSharedValue(status === 'sending' ? 0.85 : 1);
  const scale = useSharedValue(1);

  const colorRef = useRef<string>(STATUS_COLORS[status] ?? '#94A3B8');
  const [color, setColor] = useState<string>(colorRef.current);

  const animateColor = useCallback((fromHex: string, toHex: string, duration: number) => {
    if (typeof window === 'undefined') {
      setColor(toHex);
      return undefined;
    }

    const [fromR, fromG, fromB] = hexToRgb(fromHex);
    const [toR, toG, toB] = hexToRgb(toHex);
    const start = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const progress = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      const currentR = fromR + (toR - fromR) * progress;
      const currentG = fromG + (toG - fromG) * progress;
      const currentB = fromB + (toB - fromB) * progress;
      setColor(rgbToHex(currentR, currentG, currentB));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pulseStatus = useCallback(() => {
    if (isOff) {
      opacity.value = 1;
      scale.value = 1;
      return;
    }

    const pulseDuration = isReduced ? motionTheme.durations.fast : motionTheme.durations.normal;
    const bounceDuration = motionTheme.durations.fast;

    opacity.value = withSequence(
      withTiming(0.75, {
        duration: pulseDuration / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      withTiming(1, {
        duration: pulseDuration / 2,
        easing: Easing.inOut(Easing.ease),
      })
    );

    scale.value = withSequence(
      withTiming(1.08, {
        duration: bounceDuration,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1, {
        duration: bounceDuration,
        easing: Easing.in(Easing.cubic),
      })
    );

    if (
      isOwnMessage &&
      previousStatus === 'delivered' &&
      status === 'read' &&
      !isReduced &&
      !preferences.isOff
    ) {
      triggerHaptic('selection');
    }
  }, [isOff, isOwnMessage, isReduced, opacity, preferences.isOff, previousStatus, scale, status]);

  useEffect(() => {
    pulseStatus();
  }, [pulseStatus, status]);

  useEffect(() => {
    const nextColor = STATUS_COLORS[status] ?? '#94A3B8';
    if (colorRef.current === nextColor) {
      return;
    }

    if (isOff) {
      colorRef.current = nextColor;
      setColor(nextColor);
      return;
    }

    const duration = isReduced ? motionTheme.durations.fast : motionTheme.durations.normal;
    const cancel = animateColor(colorRef.current, nextColor, duration);
    colorRef.current = nextColor;
    return cancel;
  }, [animateColor, isOff, isReduced, status]);

  const animatedStyle = useMemo<MotionStyle>(
    () => ({
      opacity,
      scale,
    }),
    [opacity, scale]
  );

  return {
    kind: 'status',
    status,
    animatedStyle,
    color,
  };
}
