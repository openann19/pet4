'use client';

import { useSharedValue, withSpring,
  type AnimatedStyle,
} from '@petspark/motion';
import { useEffect, useRef } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';

export interface UseBubbleCompressionOnSpeedOptions {
  messageRate?: number;
  enabled?: boolean;
  compressionThreshold?: number;
  maxCompression?: number;
}

export interface UseBubbleCompressionOnSpeedReturn {
  scaleY: ReturnType<typeof useSharedValue<number>>;
  marginBottom: ReturnType<typeof useSharedValue<number>>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
}

const DEFAULT_ENABLED = true;
const DEFAULT_COMPRESSION_THRESHOLD = 3;
const DEFAULT_MAX_COMPRESSION = 0.85;

export function useBubbleCompressionOnSpeed(
  options: UseBubbleCompressionOnSpeedOptions = {}
): UseBubbleCompressionOnSpeedReturn {
  const {
    messageRate = 0,
    enabled = DEFAULT_ENABLED,
    compressionThreshold = DEFAULT_COMPRESSION_THRESHOLD,
    maxCompression = DEFAULT_MAX_COMPRESSION,
  } = options;

  const scaleY = useSharedValue<number>(1);
  const marginBottom = useSharedValue<number>(4);
  const lastMessageTimeRef = useRef<number>(Date.now());
  const messageCountRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      scaleY.value = withSpring(1, springConfigs.smooth);
      marginBottom.value = withSpring(4, springConfigs.smooth);
      return;
    }

    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTimeRef.current;

    if (timeSinceLastMessage < 2000) {
      messageCountRef.current++;
    } else {
      messageCountRef.current = 1;
    }

    lastMessageTimeRef.current = now;

    if (messageCountRef.current >= compressionThreshold) {
      const compressionAmount = Math.min(
        maxCompression,
        1 - (messageCountRef.current - compressionThreshold) * 0.05
      );
      scaleY.value = withSpring(compressionAmount, springConfigs.smooth);
      marginBottom.value = withSpring(compressionAmount * 2, springConfigs.smooth);
    } else {
      scaleY.value = withSpring(1, springConfigs.smooth);
      marginBottom.value = withSpring(4, springConfigs.smooth);
    }

    const resetTimeout = setTimeout(() => {
      messageCountRef.current = 0;
      scaleY.value = withSpring(1, springConfigs.smooth);
      marginBottom.value = withSpring(4, springConfigs.smooth);
    }, 2000);

    return () => {
      clearTimeout(resetTimeout);
    };
  }, [messageRate, enabled, compressionThreshold, maxCompression, scaleY, marginBottom]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleY: scaleY.value }],
      marginBottom: `${marginBottom.value}px`,
    };
  });

  return {
    scaleY,
    marginBottom,
    animatedStyle,
  };
}
