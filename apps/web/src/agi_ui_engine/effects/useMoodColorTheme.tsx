'use client';

import { useMemo } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring } from '@petspark/motion';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from '@/hooks/use-ui-config';
import { springConfigs } from '@/effects/reanimated/transitions';
import { getColorTokenWithOpacity } from '@/core/tokens';

export interface UseMoodColorThemeOptions {
  text: string;
  enabled?: boolean;
}

export interface UseMoodColorThemeReturn {
  animatedStyle: AnimatedStyle;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Color constants will be generated based on theme mode
// Using design tokens with opacity for mood-based colors
const getMoodColors = (mode: 'light' | 'dark' = 'light') => ({
  POSITIVE: {
    primary: getColorTokenWithOpacity('accent', 0.2, mode), // Using accent as positive indicator
    secondary: getColorTokenWithOpacity('accent', 0.15, mode),
    accent: getColorTokenWithOpacity('accent', 0.3, mode),
  },
  NEGATIVE: {
    primary: getColorTokenWithOpacity('destructive', 0.2, mode),
    secondary: getColorTokenWithOpacity('destructive', 0.15, mode),
    accent: getColorTokenWithOpacity('destructive', 0.3, mode),
  },
  NEUTRAL: {
    primary: getColorTokenWithOpacity('muted', 0.15, mode),
    secondary: getColorTokenWithOpacity('muted', 0.1, mode),
    accent: getColorTokenWithOpacity('muted', 0.2, mode),
  },
});

/**
 * Mood-based color theme based on message text sentiment
 *
 * Analyzes text sentiment and applies adaptive color scheme
 *
 * @example
 * ```tsx
 * const { animatedStyle, colors } = useMoodColorTheme({ text: messageText })
 * return <AnimatedView style={[animatedStyle, { backgroundColor: colors.primary }]}>{content}</AnimatedView>
 * ```
 */
export function useMoodColorTheme(options: UseMoodColorThemeOptions): UseMoodColorThemeReturn {                                                                 
  const { text, enabled = true } = options;
  const { theme } = useUIConfig();
  // Type guard to safely extract theme mode - handle error type from useUIConfig
  const themeModeValue: unknown = (theme as { mode?: unknown })?.mode;
  const themeMode: 'light' | 'dark' = 
    typeof themeModeValue === 'string' && (themeModeValue === 'light' || themeModeValue === 'dark')
      ? themeModeValue
      : 'light';

  const colors = useMemo(() => {
    const moodColors = getMoodColors(themeMode);

    if (!enabled || !theme.adaptiveMood) {
      return moodColors.NEUTRAL;
    }

    const positiveWords = ['happy', 'love', 'great', 'amazing', 'wonderful', 'excited', 'joy'];
    const negativeWords = ['sad', 'bad', 'hate', 'terrible', 'awful', 'angry', 'upset'];

    const lowerText = text.toLowerCase();
    const hasPositive = positiveWords.some((word) => lowerText.includes(word));
    const hasNegative = negativeWords.some((word) => lowerText.includes(word));

    if (hasPositive) {
      return moodColors.POSITIVE;
    }

    if (hasNegative) {
      return moodColors.NEGATIVE;
    }

    return moodColors.NEUTRAL;
  }, [text, enabled, theme.adaptiveMood, themeMode]);

  const colorOpacity = useSharedValue<number>(0);

  if (enabled && theme.adaptiveMood) {
    colorOpacity.value = withSpring(1, springConfigs.smooth);
  }

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !theme.adaptiveMood) {
      return {};
    }

    return {
      backgroundColor: colors.primary,
      opacity: colorOpacity.value,
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    colors,
  };
}
