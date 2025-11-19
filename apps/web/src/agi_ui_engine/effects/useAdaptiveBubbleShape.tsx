'use client';

import { useMemo } from 'react';
import { useSharedValue, withSpring,
  type AnimatedStyle,
} from '@petspark/motion';

import { useUIConfig } from '@/hooks/use-ui-config';
import { springConfigs } from '@/effects/reanimated/transitions';

export interface UseAdaptiveBubbleShapeOptions {
  text: string;
  enabled?: boolean;
}

export interface UseAdaptiveBubbleShapeReturn {
  animatedStyle: AnimatedStyle;
  borderRadius: number;
}

/**
 * Adaptive bubble shape based on message tone
 *
 * Adjusts bubble border radius based on message sentiment
 *
 * @example
 * ```tsx
 * const { animatedStyle, borderRadius } = useAdaptiveBubbleShape({ text: messageText })
 * return <AnimatedView style={[animatedStyle, { borderRadius }]}>{content}</AnimatedView>
 * ```
 */
export function useAdaptiveBubbleShape(
  options: UseAdaptiveBubbleShapeOptions
): UseAdaptiveBubbleShapeReturn {
  const { text, enabled = true } = options;
  const { theme } = useUIConfig();

  const borderRadius = useMemo((): number => {
    if (!enabled || !theme.adaptiveMood) {
      return 16;
    }

    const positiveWords = ['happy', 'love', 'great', 'amazing', 'wonderful'];
    const negativeWords = ['sad', 'bad', 'hate', 'terrible', 'awful'];

    const lowerText = text.toLowerCase();
    const hasPositive = positiveWords.some((word) => lowerText.includes(word));
    const hasNegative = negativeWords.some((word) => lowerText.includes(word));

    if (hasPositive) {
      return 20;
    }

    if (hasNegative) {
      return 12;
    }

    return 16;
  }, [text, enabled, theme.adaptiveMood]);

  const radiusValue = useSharedValue<number>(16);

  if (enabled && theme.adaptiveMood) {
    radiusValue.value = withSpring(borderRadius, springConfigs.smooth);
  }

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !theme.adaptiveMood) {
      return {};
    }

    return {
      borderRadius: radiusValue.value,
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    borderRadius,
  };
}
