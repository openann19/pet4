/**
 * Scroll-to-Bottom FAB "Magnetic" Effect Hook
 *
 * Creates a premium scroll FAB animation with:
 * - Magnetic hover oscillation 0.5-1px at 0.7 Hz
 * - Entry: 180ms scale spring
 * - Badge increments with spring if new messages arrive
 *
 * Location: apps/web/src/effects/chat/ui/use-scroll-fab-magnetic.ts
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { useReducedMotionSV, getReducedMotionDuration } from '../core/reduced-motion';
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate';
import { adaptiveAnimationConfigs } from '../../core/adaptive-animation-config';
import { useUIConfig } from '@/hooks/use-ui-config';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

/**
 * Scroll FAB magnetic effect options
 */
export interface UseScrollFabMagneticOptions {
  enabled?: boolean;
  isVisible?: boolean;
  badgeCount?: number;
  previousBadgeCount?: number;
}

/**
 * Scroll FAB magnetic effect return type
 */
export interface UseScrollFabMagneticReturn {
  scale: SharedValue<number>;
  translateY: SharedValue<number>;
  badgeScale: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  badgeAnimatedStyle: AnimatedStyle;
}

const DEFAULT_ENABLED = true;
const DEFAULT_IS_VISIBLE = false;
const OSCILLATION_FREQUENCY = 0.7; // Hz
const OSCILLATION_AMPLITUDE = 0.5; // px
const ENTRY_DURATION = 180; // ms

export function useScrollFabMagnetic(
  options: UseScrollFabMagneticOptions = {}
): UseScrollFabMagneticReturn {
  const {
    enabled = DEFAULT_ENABLED,
    isVisible = DEFAULT_IS_VISIBLE,
    badgeCount = 0,
    previousBadgeCount = 0,
  } = options;

  const reducedMotion = useReducedMotionSV();
  const { hz, scaleDuration } = useDeviceRefreshRate();
  const { animation, visual } = useUIConfig();
  const scale = useSharedValue(isVisible ? 1 : 0);
  const translateY = useSharedValue(0);
  const badgeScale = useSharedValue(1);

  // Entry animation
  useEffect(() => {
    if (enabled && isVisible) {
      // Use adaptive duration scaling
      const baseDuration = getReducedMotionDuration(ENTRY_DURATION, reducedMotion.value);
      const duration = scaleDuration(baseDuration);

      if (isTruthy(reducedMotion.value)) {
        scale.value = withTiming(1, {
          duration,
          easing: Easing.linear,
        });
      } else {
        // Use UI config spring physics or fallback to adaptive config
        const springConfig = animation.enableReanimated && animation.springPhysics
          ? {
              stiffness: animation.springPhysics.stiffness,
              damping: animation.springPhysics.damping,
              mass: animation.springPhysics.mass,
            }
          : adaptiveAnimationConfigs.smoothEntry(hz as 60 | 120);
        scale.value = withSpring(1, springConfig);
      }
    } else if (enabled && !isVisible) {
      // Use adaptive duration for exit
      const exitDuration = scaleDuration(ENTRY_DURATION);
      scale.value = withTiming(0, {
        duration: exitDuration,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [enabled, isVisible, reducedMotion, hz, scaleDuration, animation, scale]);

  // Magnetic hover oscillation (only if animations enabled)
  useEffect(() => {
    if (enabled && isVisible && !reducedMotion.value && animation.enableReanimated) {
      const period = 1000 / OSCILLATION_FREQUENCY; // ms
      // Use adaptive duration for oscillation
      const halfPeriod = scaleDuration(period / 2);

      translateY.value = withRepeat(
        withSequence(
          withTiming(OSCILLATION_AMPLITUDE, {
            duration: halfPeriod,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-OSCILLATION_AMPLITUDE, {
            duration: halfPeriod,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      );
    } else {
      translateY.value = 0;
    }
  }, [enabled, isVisible, reducedMotion, scaleDuration, animation, translateY]);

  // Badge increment animation
  useEffect(() => {
    if (enabled && badgeCount > (previousBadgeCount ?? 0)) {
      // Use UI config spring physics or fallback to adaptive config
      const springConfig = animation.enableReanimated && animation.springPhysics
        ? {
            stiffness: animation.springPhysics.stiffness,
            damping: animation.springPhysics.damping,
            mass: animation.springPhysics.mass,
          }
        : adaptiveAnimationConfigs.smoothEntry(hz as 60 | 120);
      badgeScale.value = withSequence(
        withSpring(1.3, springConfig),
        withSpring(1, springConfig)
      );
    }
  }, [enabled, badgeCount, previousBadgeCount, hz, animation, badgeScale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    };
  }) as AnimatedStyle;

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: badgeScale.value }],
    };
  }) as AnimatedStyle;

  return {
    scale,
    translateY,
    badgeScale,
    animatedStyle,
    badgeAnimatedStyle,
  };
}
