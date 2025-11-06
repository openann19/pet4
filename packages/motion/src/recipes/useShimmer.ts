import { useSharedValue, withTiming, useAnimatedStyle, withRepeat } from 'react-native-reanimated';
import { useEffect } from 'react';
import { motion } from '../tokens';

export function useShimmer(width = 240) {
  const x = useSharedValue(-width);
  useEffect(() => {
    x.value = withRepeat(withTiming(width, { duration: motion.durations.lg }), -1, false);
  }, [width]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return { animatedStyle };
}

