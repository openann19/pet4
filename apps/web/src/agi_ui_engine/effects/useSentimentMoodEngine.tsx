'use client';

import { useMemo } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring } from '@petspark/motion';
import type { AnimatedStyle } from '@petspark/motion';
import { useUIConfig } from '@/hooks/use-ui-config';
import { springConfigs } from '@/effects/reanimated/transitions';

export interface UseSentimentMoodEngineOptions {
  text: string;
  enabled?: boolean;
}

export interface MoodResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  intensity: number;
  color: string;
  gradient: [string, string];
}

export interface UseSentimentMoodEngineReturn {
  mood: MoodResult;
  animatedStyle: AnimatedStyle;
}

const SENTIMENT_PATTERNS = {
  positive: [
    'happy',
    'love',
    'great',
    'amazing',
    'wonderful',
    'excited',
    'joy',
    'fantastic',
    'perfect',
    'brilliant',
    'excellent',
    'smile',
    'laugh',
    'haha',
    'yay',
    'woohoo',
    'yes',
    'yep',
    'sure',
    'definitely',
    'absolutely',
  ],
  negative: [
    'sad',
    'angry',
    'upset',
    'bad',
    'terrible',
    'awful',
    'hate',
    'disappointed',
    'frustrated',
    'worried',
    'anxious',
    'stressed',
    'no',
    'nope',
    'never',
    'stop',
    'wrong',
    'error',
    'problem',
    'issue',
  ],
};

/**
 * Sentiment analysis engine for mood-based theming
 *
 * Analyzes text sentiment and returns mood with intensity and colors
 *
 * @example
 * ```tsx
 * const { mood, animatedStyle } = useSentimentMoodEngine({ text: messageText })
 * return <AnimatedView style={[animatedStyle, { backgroundColor: mood.color }]}>{content}</AnimatedView>
 * ```
 */
export function useSentimentMoodEngine(
  options: UseSentimentMoodEngineOptions
): UseSentimentMoodEngineReturn {
  const { text, enabled = true } = options;
  const { theme } = useUIConfig();

  const mood = useMemo((): MoodResult => {
    if (!enabled || !theme.adaptiveMood) {
      return {
        sentiment: 'neutral',
        intensity: 0.5,
        color: 'rgba(148, 163, 184, 0.15)',
        gradient: ['rgba(148, 163, 184, 0.15)', 'rgba(203, 213, 225, 0.1)'],
      };
    }

    const lowerText = text.toLowerCase();
    const positiveMatches = SENTIMENT_PATTERNS.positive.filter((word) =>
      lowerText.includes(word)
    ).length;
    const negativeMatches = SENTIMENT_PATTERNS.negative.filter((word) =>
      lowerText.includes(word)
    ).length;

    const totalMatches = positiveMatches + negativeMatches;
    const intensity = totalMatches > 0 ? Math.min(totalMatches / 5, 1) : 0.5;

    if (positiveMatches > negativeMatches) {
      return {
        sentiment: 'positive',
        intensity,
        color: `rgba(34, 197, 94, ${String(0.15 * intensity)})`,
        gradient: [
          `rgba(34, 197, 94, ${0.2 * intensity})`,
          `rgba(16, 185, 129, ${0.15 * intensity})`,
        ],
      };
    }

    if (negativeMatches > positiveMatches) {
      return {
        sentiment: 'negative',
        intensity,
        color: `rgba(239, 68, 68, ${String(0.15 * intensity)})`,
        gradient: [
          `rgba(239, 68, 68, ${0.2 * intensity})`,
          `rgba(220, 38, 38, ${0.15 * intensity})`,
        ],
      };
    }

    return {
      sentiment: 'neutral',
      intensity: 0.5,
      color: 'rgba(148, 163, 184, 0.15)',
      gradient: ['rgba(148, 163, 184, 0.15)', 'rgba(203, 213, 225, 0.1)'],
    };
  }, [text, enabled, theme.adaptiveMood]);

  const moodOpacity = useSharedValue<number>(0);

  if (enabled && theme.adaptiveMood) {
    moodOpacity.value = withSpring(1, springConfigs.smooth);
  }

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !theme.adaptiveMood) {
      return {};
    }

    return {
      backgroundColor: mood.color,
      opacity: moodOpacity.value,
    };
  }) as AnimatedStyle;

  return {
    mood,
    animatedStyle,
  };
}
