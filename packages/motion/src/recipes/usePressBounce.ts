import { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { motion } from '../tokens';
import { useCallback } from 'react';

export function usePressBounce(scaleOnPress = 0.96) {
  const s = useSharedValue(1);
  const onPressIn = useCallback(() => {
    s.value = withSpring(scaleOnPress, motion.spring.crisp);
  }, [scaleOnPress]);
  const onPressOut = useCallback(() => {
    s.value = withSpring(1, motion.spring.smooth);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return { onPressIn, onPressOut, animatedStyle };
}

