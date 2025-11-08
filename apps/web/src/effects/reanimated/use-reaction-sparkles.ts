'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  withDelay,
  type SharedValue,
} from 'react-native-reanimated';
import { useCallback, useState, useEffect } from 'react';
import { haptics } from '@/lib/haptics';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import {
  spawnParticles,
  animateParticle,
  type Particle,
  type ParticleConfig,
  DEFAULT_CONFIG,
} from './particle-engine';

export type ReactionType = '❤️' | '😂' | '👍' | '👎' | '🔥' | '🙏' | '⭐';

export interface UseReactionSparklesOptions {
  onReaction?: (emoji: ReactionType) => void;
  hapticFeedback?: boolean;
  enableParticles?: boolean;
  enablePulse?: boolean;
}

export interface UseReactionSparklesReturn {
  emojiScale: SharedValue<number>;
  emojiOpacity: SharedValue<number>;
  pulseScale: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  pulseStyle: ReturnType<typeof useAnimatedStyle>;
  particles: Particle[];
  animate: (emoji: ReactionType, x?: number, y?: number) => void;
  startPulse: () => void;
  stopPulse: () => void;
  clearParticles: () => void;
}

const EMOJI_COLORS: Record<ReactionType, string[]> = {
  '❤️': ['#FF6B6B', '#FF8E8E', '#FFB3B3'],
  '😂': ['#FFD93D', '#FFE66D', '#FFF4A3'],
  '👍': ['#4ECDC4', '#6EDDD4', '#8EEDE4'],
  '👎': ['#95A5A6', '#BDC3C7', '#D5DBDB'],
  '🔥': ['#FF6B35', '#FF8C42', '#FFA07A'],
  '🙏': ['#A8D8EA', '#C8E6F5', '#E8F4F8'],
  '⭐': ['#FFD700', '#FFE55C', '#FFF4A3'],
};

const DEFAULT_HAPTIC_FEEDBACK = true;
const DEFAULT_ENABLE_PARTICLES = true;
const DEFAULT_ENABLE_PULSE = true;

export function useReactionSparkles(
  options: UseReactionSparklesOptions = {}
): UseReactionSparklesReturn {
  const {
    onReaction,
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    enableParticles = DEFAULT_ENABLE_PARTICLES,
    enablePulse = DEFAULT_ENABLE_PULSE,
  } = options;

  const emojiScale = useSharedValue(0);
  const emojiOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);

  const getParticleConfig = useCallback((emoji: ReactionType): ParticleConfig => {
    return {
      count: 10,
      colors: EMOJI_COLORS[emoji] ?? EMOJI_COLORS['❤️'],
      minSize: 4,
      maxSize: 10,
      minLifetime: 500,
      maxLifetime: 800,
      minVelocity: 100,
      maxVelocity: 250,
      gravity: 0.4,
      spread: 360,
    };
  }, []);

  const animate = useCallback(
    (emoji: ReactionType, x?: number, y?: number) => {
      if (hapticFeedback) {
        haptics.impact('medium');
      }

      emojiScale.value = withSequence(
        withSpring(1.2, {
          damping: 10,
          stiffness: 400,
        }),
        withSpring(1, springConfigs.bouncy)
      );

      emojiOpacity.value = withSequence(
        withTiming(1, timingConfigs.fast),
        withDelay(400, withTiming(0, timingConfigs.smooth))
      );

      if (enableParticles && x !== undefined && y !== undefined) {
        const config = getParticleConfig(emoji);
        const newParticles = spawnParticles(x, y, config);

        newParticles.forEach((particle) => {
          animateParticle(particle, { ...DEFAULT_CONFIG, ...config });
        });

        setParticles((prev) => [...prev, ...newParticles]);

        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
        }, config.maxLifetime ?? 1000);
      }

      if (onReaction) {
        onReaction(emoji);
      }
    },
    [hapticFeedback, enableParticles, getParticleConfig, onReaction, emojiScale, emojiOpacity]
  );

  const startPulse = useCallback(() => {
    if (!enablePulse || isPulsing) {
      return;
    }

    setIsPulsing(true);
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, {
          duration: 400,
          easing: (t) => t,
        }),
        withTiming(1, {
          duration: 400,
          easing: (t) => t,
        })
      ),
      -1,
      false
    );
  }, [enablePulse, isPulsing, pulseScale]);

  const stopPulse = useCallback(() => {
    setIsPulsing(false);
    pulseScale.value = withTiming(1, timingConfigs.fast);
  }, [pulseScale]);

  const clearParticles = useCallback(() => {
    setParticles([]);
  }, []);

  useEffect(() => {
    return () => {
      clearParticles();
    };
  }, [clearParticles]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: emojiScale.value }],
      opacity: emojiOpacity.value,
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  return {
    emojiScale,
    emojiOpacity,
    pulseScale,
    animatedStyle,
    pulseStyle,
    particles,
    animate,
    startPulse,
    stopPulse,
    clearParticles,
  };
}
