'use client';

import type  from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { useUIConfig } from '@/hooks/use-ui-config';
import { useMemo } from 'react';
import { useuseSharedValue, withSpring } from '@petspark/motion';
import { isTruthy } from '@petspark/shared';

export interface UseMoodThemeOptions {
  text: string;
  enabled?: boolean;
}

export interface UseMoodThemeReturn {
  animatedStyle: AnimatedStyle;
  gradientColors: string[];
}

/**
 * Mood-based gradient theme based on message text sentiment
 *
 * Analyzes text sentiment and applies adaptive gradient colors
 *
 * @example
 * ```tsx
 * const { animatedStyle, gradientColors } = useMoodTheme({ text: messageText })
 * return <AnimatedView style={animatedStyle}>{content}</AnimatedView>
 * ```
 */
export function useMoodTheme(options: UseMoodThemeOptions): UseMoodThemeReturn {
  const { text, enabled = true } = options;
  const { theme } = useUIConfig();

  const gradientColors = useMemo(() => {
    if (!enabled || !theme.adaptiveMood) {
      return ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'];
    }

    const positiveWords = ['happy', 'love', 'great', 'amazing', 'wonderful'];
    const negativeWords = ['sad', 'bad', 'hate', 'terrible', 'awful'];
    const neutralWords = ['ok', 'fine', 'alright', 'sure', 'maybe'];

    const lowerText = text.toLowerCase();
    const hasPositive = positiveWords.some((word) => lowerText.includes(word));
    const hasNegative = negativeWords.some((word) => lowerText.includes(word));
    const hasNeutral = neutralWords.some((word) => lowerText.includes(word));

    if (isTruthy(hasPositive)) {
      return [
        `rgba(110, 231, 183, ${0.15 * theme.gradientIntensity})`,
        `rgba(139, 92, 246, ${0.1 * theme.gradientIntensity})`,
      ];
    }

    if (isTruthy(hasNegative)) {
      return [
        `rgba(239, 68, 68, ${0.15 * theme.gradientIntensity})`,
        `rgba(251, 146, 60, ${0.1 * theme.gradientIntensity})`,
      ];
    }

    if (isTruthy(hasNeutral)) {
      return [
        `rgba(148, 163, 184, ${0.15 * theme.gradientIntensity})`,
        `rgba(203, 213, 225, ${0.1 * theme.gradientIntensity})`,
      ];
    }

    return [
      `rgba(59, 130, 246, ${0.15 * theme.gradientIntensity})`,
      `rgba(147, 197, 253, ${0.1 * theme.gradientIntensity})`,
    ];
  }, [text, enabled, theme.adaptiveMood, theme.gradientIntensity]);

  const gradientOpacity = useSharedValue<number>(0);

  if (enabled && theme.adaptiveMood) {
    gradientOpacity.value = withSpring(1, springConfigs.smooth);
  }

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !theme.adaptiveMood) {
      return {} as Record<string, unknown>;
    }

    return {
      background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
      backgroundOpacity: gradientOpacity.value,
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    gradientColors,
  };
}
