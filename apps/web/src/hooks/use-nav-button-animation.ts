'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { useEffect, useCallback } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface UseNavButtonAnimationOptions {
  isActive?: boolean;
  enablePulse?: boolean;
  pulseScale?: number;
  enableRotation?: boolean;
  rotationAmplitude?: number;
  hapticFeedback?: boolean;
}

export interface UseNavButtonAnimationReturn {
  scale: SharedValue<number>;
  translateY: SharedValue<number>;
  rotation: SharedValue<number>;
  iconScale: SharedValue<number>;
  iconRotation: SharedValue<number>;
  indicatorOpacity: SharedValue<number>;
  indicatorWidth: SharedValue<number>;
  buttonStyle: AnimatedStyle;
  iconStyle: AnimatedStyle;
  indicatorStyle: AnimatedStyle;
  handlePress: () => void;
  handleHover: () => void;
  handleLeave: () => void;
}

export function useNavButtonAnimation(
  options: UseNavButtonAnimationOptions = {}
): UseNavButtonAnimationReturn {
  const {
    isActive = false,
    enablePulse = true,
    pulseScale = 1.25,
    enableRotation = true,
    rotationAmplitude = 5,
    hapticFeedback = true,
  } = options;

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Active state animations
      if (enablePulse) {
        iconScale.value = withRepeat(
          withSequence(
            withSpring(pulseScale, springConfigs.bouncy),
            withSpring(1, springConfigs.smooth)
          ),
          -1,
          true
        );
      } else {
        iconScale.value = withSpring(1.1, springConfigs.smooth);
      }

      if (enableRotation) {
        iconRotation.value = withRepeat(
          withTiming(rotationAmplitude, {
            duration: 1200,
            easing: (t) => Math.sin(t * Math.PI * 2) * 0.5 + 0.5,
          }),
          -1,
          true
        );
      }

      indicatorOpacity.value = withSpring(1, springConfigs.smooth);
      indicatorWidth.value = withSpring(32, springConfigs.bouncy);
    } else {
      // Inactive state
      iconScale.value = withSpring(1, springConfigs.smooth);
      iconRotation.value = withSpring(0, springConfigs.smooth);
      indicatorOpacity.value = withSpring(0, springConfigs.smooth);
      indicatorWidth.value = withSpring(0, springConfigs.smooth);
    }
  }, [
    isActive,
    enablePulse,
    pulseScale,
    enableRotation,
    rotationAmplitude,
    iconScale,
    iconRotation,
    indicatorOpacity,
    indicatorWidth,
  ]);

  const handlePress = useCallback(() => {
    if (hapticFeedback) {
      // Using haptics through window object if available
      if (typeof window !== 'undefined' && 'haptics' in window) {
        const haptics = (window as { haptics?: { impact?: (type: string) => void } }).haptics;
        haptics?.impact?.('light');
      }
    }

    scale.value = withSequence(
      withSpring(0.92, {
        damping: 15,
        stiffness: 600,
      }),
      withSpring(1, springConfigs.smooth)
    );

    translateY.value = withSequence(
      withSpring(2, {
        damping: 15,
        stiffness: 600,
      }),
      withSpring(0, springConfigs.smooth)
    );
  }, [hapticFeedback, scale, translateY]);

  const handleHover = useCallback(() => {
    if (isActive) return;

    scale.value = withSpring(1.08, springConfigs.smooth);
    translateY.value = withSpring(-3, springConfigs.smooth);
    rotation.value = withSpring(2, {
      damping: 25,
      stiffness: 300,
    });
  }, [isActive, scale, translateY, rotation]);

  const handleLeave = useCallback(() => {
    if (isActive) return;

    scale.value = withSpring(1, springConfigs.smooth);
    translateY.value = withSpring(0, springConfigs.smooth);
    rotation.value = withSpring(0, springConfigs.smooth);
  }, [isActive, scale, translateY, rotation]);

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  }) as AnimatedStyle;

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }, { rotate: `${iconRotation.value}deg` }],
    };
  }) as AnimatedStyle;

  const indicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(indicatorOpacity.value, [0, 1], [0, 1], Extrapolation.CLAMP);

    const width = interpolate(indicatorWidth.value, [0, 32], [0, 32], Extrapolation.CLAMP);

    return {
      opacity,
      width: `${width}px`,
    };
  }) as AnimatedStyle;

  return {
    scale,
    translateY,
    rotation,
    iconScale,
    iconRotation,
    indicatorOpacity,
    indicatorWidth,
    buttonStyle,
    iconStyle,
    indicatorStyle,
    handlePress,
    handleHover,
    handleLeave,
  };
}
