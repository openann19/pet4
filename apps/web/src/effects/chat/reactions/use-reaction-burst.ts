/**
 * Reactions "Burst + Settle" Effect Hook
 *
 * Creates a premium reaction animation with:
 * - Tap-and-hold pops reaction ring (8 particles, 280ms, ease-out)
 * - Emoji lifts with spring to badge on bubble corner
 * - Shadow 2→8px
 * - Haptics: Impact.Light on attach, Success on long-press menu confirm
 *
 * Location: apps/web/src/effects/chat/reactions/use-reaction-burst.ts
 */

import { useCallback, useMemo } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { triggerHaptic } from '../core/haptic-manager';
import { getReducedMotionDuration, useReducedMotionSV } from '../core/reduced-motion';
import { logEffectEnd, logEffectStart } from '../core/telemetry';
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate';
import { adaptiveAnimationConfigs } from '../../core/adaptive-animation-config';
import { useUIConfig } from '@/hooks/use-ui-config';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

/**
 * Reaction burst effect options
 */
export interface UseReactionBurstOptions {
  enabled?: boolean;
  onComplete?: () => void;
  onLongPressConfirm?: () => void;
}

/**
 * Reaction burst effect return type
 */
export interface UseReactionBurstReturn {
  particles: {
    x: SharedValue<number>;
    y: SharedValue<number>;
    opacity: SharedValue<number>;
    scale: SharedValue<number>;
  }[];
  emojiScale: SharedValue<number>;
  emojiTranslateY: SharedValue<number>;
  shadowRadius: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  trigger: () => void;
  triggerLongPress: () => void;
}

const DEFAULT_ENABLED = true;
const BASE_PARTICLE_COUNT = 8;
const BURST_DURATION = 280; // ms
const EMOJI_LIFT_DURATION = 300; // ms

export function useReactionBurst(options: UseReactionBurstOptions = {}): UseReactionBurstReturn {
  const { enabled = DEFAULT_ENABLED, onComplete, onLongPressConfirm } = options;

  const reducedMotion = useReducedMotionSV();
  const { hz, scaleDuration, deviceCapability } = useDeviceRefreshRate();
  const { visual, feedback, animation } = useUIConfig();

  // Calculate particle count based on device capability and UI config
  // Reaction burst uses fewer particles (8 max) which is well within device limits
  // But we still respect the animation.showParticles flag
  const particleCount = animation.showParticles
    ? Math.min(BASE_PARTICLE_COUNT, Math.floor(deviceCapability.maxParticles / 15))
    : 0;

  // Initialize all particle SharedValues at top level (hooks must be called unconditionally)
  const particle0X = useSharedValue(0);
  const particle0Y = useSharedValue(0);
  const particle0Opacity = useSharedValue(0);
  const particle0Scale = useSharedValue(0);

  const particle1X = useSharedValue(0);
  const particle1Y = useSharedValue(0);
  const particle1Opacity = useSharedValue(0);
  const particle1Scale = useSharedValue(0);

  const particle2X = useSharedValue(0);
  const particle2Y = useSharedValue(0);
  const particle2Opacity = useSharedValue(0);
  const particle2Scale = useSharedValue(0);

  const particle3X = useSharedValue(0);
  const particle3Y = useSharedValue(0);
  const particle3Opacity = useSharedValue(0);
  const particle3Scale = useSharedValue(0);

  const particle4X = useSharedValue(0);
  const particle4Y = useSharedValue(0);
  const particle4Opacity = useSharedValue(0);
  const particle4Scale = useSharedValue(0);

  const particle5X = useSharedValue(0);
  const particle5Y = useSharedValue(0);
  const particle5Opacity = useSharedValue(0);
  const particle5Scale = useSharedValue(0);

  const particle6X = useSharedValue(0);
  const particle6Y = useSharedValue(0);
  const particle6Opacity = useSharedValue(0);
  const particle6Scale = useSharedValue(0);

  const particle7X = useSharedValue(0);
  const particle7Y = useSharedValue(0);
  const particle7Opacity = useSharedValue(0);
  const particle7Scale = useSharedValue(0);

  // Particles array - memoized with stable SharedValue references
  const particles = useMemo(
    () => [
      { x: particle0X, y: particle0Y, opacity: particle0Opacity, scale: particle0Scale },
      { x: particle1X, y: particle1Y, opacity: particle1Opacity, scale: particle1Scale },
      { x: particle2X, y: particle2Y, opacity: particle2Opacity, scale: particle2Scale },
      { x: particle3X, y: particle3Y, opacity: particle3Opacity, scale: particle3Scale },
      { x: particle4X, y: particle4Y, opacity: particle4Opacity, scale: particle4Scale },
      { x: particle5X, y: particle5Y, opacity: particle5Opacity, scale: particle5Scale },
      { x: particle6X, y: particle6Y, opacity: particle6Opacity, scale: particle6Scale },
      { x: particle7X, y: particle7Y, opacity: particle7Opacity, scale: particle7Scale },
    ],
    [
      particle0X,
      particle0Y,
      particle0Opacity,
      particle0Scale,
      particle1X,
      particle1Y,
      particle1Opacity,
      particle1Scale,
      particle2X,
      particle2Y,
      particle2Opacity,
      particle2Scale,
      particle3X,
      particle3Y,
      particle3Opacity,
      particle3Scale,
      particle4X,
      particle4Y,
      particle4Opacity,
      particle4Scale,
      particle5X,
      particle5Y,
      particle5Opacity,
      particle5Scale,
      particle6X,
      particle6Y,
      particle6Opacity,
      particle6Scale,
      particle7X,
      particle7Y,
      particle7Opacity,
      particle7Scale,
    ]
  );

  // Emoji animation
  const emojiScale = useSharedValue(1);
  const emojiTranslateY = useSharedValue(0);
  const shadowRadius = useSharedValue(2);

  const trigger = useCallback(() => {
    if (!enabled) {
      return;
    }

    const isReducedMotion = reducedMotion.value;
    // Use adaptive duration scaling based on device refresh rate
    const baseBurstDuration = getReducedMotionDuration(BURST_DURATION, isReducedMotion);
    const burstDuration = scaleDuration(baseBurstDuration);

    // Log effect start
    const effectId = logEffectStart('reaction-burst', {
      reducedMotion: isReducedMotion,
    });

    // Trigger haptic: Impact.Light on attach (only if haptics enabled)
    if (feedback.haptics) {
      triggerHaptic('light');
    }

    // Animate particles in ring pattern (only if particles enabled and count > 0)
    if (!isReducedMotion && animation.showParticles && particleCount > 0) {
      particles.slice(0, particleCount).forEach((particle, index) => {
        const angle = (index / particleCount) * Math.PI * 2;
        const radius = 30; // pixels
        const targetX = Math.cos(angle) * radius;
        const targetY = Math.sin(angle) * radius;

        const xValue = particle.x;
        const yValue = particle.y;
        const opacityValue = particle.opacity;
        const scaleValue = particle.scale;

        xValue.value = withTiming(targetX, {
          duration: burstDuration,
          easing: Easing.out(Easing.ease),
        });
        yValue.value = withTiming(targetY, {
          duration: burstDuration,
          easing: Easing.out(Easing.ease),
        });
        opacityValue.value = withSequence(
          withTiming(1, { duration: burstDuration * 0.3 }),
          withTiming(0, { duration: burstDuration * 0.7 })
        );
        scaleValue.value = withSequence(
          withTiming(1.2, { duration: burstDuration * 0.2 }),
          withTiming(0.8, { duration: burstDuration * 0.8 })
        );
      });
    }

    // Emoji lift animation - use UI config spring physics or adaptive config
    const springConfig = animation.enableReanimated && animation.springPhysics
      ? {
          stiffness: animation.springPhysics.stiffness,
          damping: animation.springPhysics.damping,
          mass: animation.springPhysics.mass,
        }
      : adaptiveAnimationConfigs.bouncy(hz as 60 | 120);
    emojiScale.value = withSpring(1.2, springConfig);
    emojiTranslateY.value = withSpring(-15, springConfig);

    // Shadow animation (2→8px) - only if shadows enabled, use adaptive duration
    if (visual.enableShadows) {
      const emojiLiftDurationAdapted = scaleDuration(EMOJI_LIFT_DURATION);
      shadowRadius.value = withTiming(8, {
        duration: emojiLiftDurationAdapted,
        easing: Easing.out(Easing.ease),
      });
    }

    // Call onComplete
    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, burstDuration);
    }

    // Log effect end
    setTimeout(() => {
      logEffectEnd(effectId, {
        durationMs: burstDuration,
        success: true,
      });
    }, burstDuration);
  }, [enabled, reducedMotion, hz, scaleDuration, visual, feedback, animation, particles, emojiScale, emojiTranslateY, shadowRadius, onComplete, particleCount, deviceCapability]);

  const triggerLongPress = useCallback(() => {
    // Haptic: Success on long-press menu confirm (only if haptics enabled)
    if (feedback.haptics) {
      triggerHaptic('success');
    }
    onLongPressConfirm?.();
  }, [feedback.haptics, onLongPressConfirm]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: emojiScale.value }, { translateY: emojiTranslateY.value }],
      boxShadow: `0 ${shadowRadius.value}px ${shadowRadius.value * 2}px rgba(0, 0, 0, 0.3)`,
    };
  }) as AnimatedStyle;

  return {
    particles,
    emojiScale,
    emojiTranslateY,
    shadowRadius,
    animatedStyle,
    trigger,
    triggerLongPress,
  };
}
