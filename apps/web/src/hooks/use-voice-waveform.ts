'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { timingConfigs } from '@/effects/reanimated/transitions';

export interface UseVoiceWaveformOptions {
  waveform: number[];
  isPlaying?: boolean;
  barCount?: number;
  animationDuration?: number;
}

export interface UseVoiceWaveformReturn {
  animatedStyles: ReturnType<typeof useAnimatedStyle>[];
  containerStyle: ReturnType<typeof useAnimatedStyle>;
}

const DEFAULT_BAR_COUNT = 20;
const DEFAULT_ANIMATION_DURATION = 500;

export function useVoiceWaveform(options: UseVoiceWaveformOptions): UseVoiceWaveformReturn {
  const {
    waveform,
    isPlaying = false,
    barCount = DEFAULT_BAR_COUNT,
    animationDuration = DEFAULT_ANIMATION_DURATION,
  } = options;

  const normalizedWaveform =
    waveform.length > 0
      ? waveform
      : Array.from({ length: barCount }, () => Math.random() * 0.5 + 0.3);

  const barScales = Array.from({ length: barCount }, (_, index) => {
    const waveformIndex = Math.floor((index / barCount) * normalizedWaveform.length);
    const baseValue = normalizedWaveform[waveformIndex] ?? 0.3;
    return useSharedValue(baseValue);
  });

  useEffect(() => {
    if (isTruthy(isPlaying)) {
      barScales.forEach((scale, index) => {
        const waveformIndex = Math.floor((index / barCount) * normalizedWaveform.length);
        const baseValue = normalizedWaveform[waveformIndex] ?? 0.3;
        const variation = (Math.random() - 0.5) * 0.2;

        scale.value = withRepeat(
          withSequence(
            withDelay(
              index * (animationDuration / barCount / 3),
              withTiming(baseValue + variation, {
                duration: animationDuration / 3,
                easing: Easing.inOut(Easing.ease),
              })
            ),
            withTiming(Math.max(0.2, baseValue - variation), {
              duration: animationDuration / 3,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(baseValue, {
              duration: animationDuration / 3,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          false
        );
      });
    } else {
      barScales.forEach((scale, index) => {
        const waveformIndex = Math.floor((index / barCount) * normalizedWaveform.length);
        const baseValue = normalizedWaveform[waveformIndex] ?? 0.3;
        scale.value = withTiming(baseValue, timingConfigs.fast);
      });
    }
  }, [isPlaying, waveform, barCount, animationDuration, normalizedWaveform, barScales]);

  const animatedStyles = barScales.map((scale) => {
    return useAnimatedStyle(() => {
      const heightValue = scale.value * 32;

      return {
        height: heightValue,
        transform: [{ scaleY: scale.value }],
      };
    });
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: 1,
    };
  });

  return {
    animatedStyles,
    containerStyle,
  };
}
