'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  type SharedValue,
} from '@petspark/motion';
import { useEffect, useCallback } from 'react';
import { timingConfigs } from '@/effects/reanimated/transitions';
import { getColorToken, getColorTokenWithOpacity } from '@/core/tokens';

export type SenderType = 'user' | 'bot' | 'system';
export type MessageType = 'ai-answer' | 'error' | 'system-alert' | 'default';
export type ChatTheme = 'light' | 'dark' | 'glass' | 'cyberpunk';

export interface UseBubbleThemeOptions {
  senderType?: SenderType;
  messageType?: MessageType;
  theme?: ChatTheme;
}

export interface UseBubbleThemeReturn {
  gradientIntensity: SharedValue<number>;
  shadowIntensity: SharedValue<number>;
  colorIntensity: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  updateTheme: (newTheme: ChatTheme) => void;
}

// Get theme colors using design tokens
// Note: cyberpunk theme uses custom colors (intentional design choice)
const getThemeColors = (theme: ChatTheme): { primary: string; secondary: string; shadow: string } => {
  if (theme === 'cyberpunk') {
    // Cyberpunk theme uses custom neon colors (intentional design choice)
    return {
      primary: 'rgba(255, 0, 255, 1)',
      secondary: 'rgba(0, 255, 255, 1)',
      shadow: 'rgba(255, 0, 255, 0.5)',
    };
  }

  const mode = theme === 'dark' ? 'dark' : 'light';
  const opacity = theme === 'glass' ? 0.8 : 1;

  return {
    primary: theme === 'glass'
      ? getColorTokenWithOpacity('primary', opacity, mode)
      : getColorToken('primary', mode),
    secondary: theme === 'glass'
      ? getColorTokenWithOpacity('secondary', opacity, mode)
      : getColorToken('secondary', mode),
    shadow: mode === 'dark'
      ? 'rgba(0, 0, 0, 0.3)'
      : theme === 'glass'
      ? 'rgba(0, 0, 0, 0.2)'
      : 'rgba(0, 0, 0, 0.1)',
  };
};

const SENDER_INTENSITY: Record<SenderType, number> = {
  user: 1,
  bot: 0.7,
  system: 0.5,
};

const MESSAGE_INTENSITY: Record<MessageType, number> = {
  'ai-answer': 0.9,
  error: 1,
  'system-alert': 0.8,
  default: 1,
};

const DEFAULT_SENDER_TYPE: SenderType = 'user';
const DEFAULT_MESSAGE_TYPE: MessageType = 'default';
const DEFAULT_THEME: ChatTheme = 'light';

export function useBubbleTheme(options: UseBubbleThemeOptions = {}): UseBubbleThemeReturn {
  const {
    senderType = DEFAULT_SENDER_TYPE,
    messageType = DEFAULT_MESSAGE_TYPE,
    theme = DEFAULT_THEME,
  } = options;

  const gradientIntensity = useSharedValue(1);
  const shadowIntensity = useSharedValue(1);
  const colorIntensity = useSharedValue(1);

  useEffect(() => {
    const senderIntensity = SENDER_INTENSITY[senderType];
    const messageIntensity = MESSAGE_INTENSITY[messageType];
    const targetIntensity = senderIntensity * messageIntensity;

    gradientIntensity.value = withTiming(targetIntensity, timingConfigs.smooth);
    shadowIntensity.value = withTiming(targetIntensity, timingConfigs.smooth);
    colorIntensity.value = withTiming(targetIntensity, timingConfigs.smooth);
  }, [senderType, messageType, gradientIntensity, shadowIntensity, colorIntensity]);

  const updateTheme = useCallback(
    (_newTheme: ChatTheme) => {
      const senderIntensity = SENDER_INTENSITY[senderType];
      const messageIntensity = MESSAGE_INTENSITY[messageType];
      const targetIntensity = senderIntensity * messageIntensity;

      gradientIntensity.value = withTiming(targetIntensity, timingConfigs.smooth);
      shadowIntensity.value = withTiming(targetIntensity, timingConfigs.smooth);
      colorIntensity.value = withTiming(targetIntensity, timingConfigs.smooth);
    },
    [senderType, gradientIntensity, shadowIntensity, colorIntensity]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const themeColor = getThemeColors(theme);
    const intensity = colorIntensity.value;

    const shadowBlur = interpolate(shadowIntensity.value, [0, 1], [0, 20], Extrapolation.CLAMP);
    const shadowOpacity = interpolate(shadowIntensity.value, [0, 1], [0, 0.3], Extrapolation.CLAMP);

    const primaryR = parseInt(/rgba?\((\d+)/.exec(themeColor.primary)?.[1] ?? '59', 10);
    const primaryG = parseInt(/rgba?\(\d+, (\d+)/.exec(themeColor.primary)?.[1] ?? '130', 10);
    const primaryB = parseInt(/rgba?\(\d+, \d+, (\d+)/.exec(themeColor.primary)?.[1] ?? '246', 10);

    const secondaryR = parseInt(/rgba?\((\d+)/.exec(themeColor.secondary)?.[1] ?? '139', 10);
    const secondaryG = parseInt(/rgba?\(\d+, (\d+)/.exec(themeColor.secondary)?.[1] ?? '92', 10);
    const secondaryB = parseInt(
      /rgba?\(\d+, \d+, (\d+)/.exec(themeColor.secondary)?.[1] ?? '246',
      10
    );

    return {
      background: `linear-gradient(135deg,
        rgba(${primaryR}, ${primaryG}, ${primaryB}, ${intensity}) 0%,
        rgba(${secondaryR}, ${secondaryG}, ${secondaryB}, ${intensity * 0.8}) 100%
      )`,
      boxShadow: `0 4px ${shadowBlur}px ${shadowOpacity}px ${themeColor.shadow}`,
    };
  });

  return {
    gradientIntensity,
    shadowIntensity,
    colorIntensity,
    animatedStyle,
    updateTheme,
  };
}
