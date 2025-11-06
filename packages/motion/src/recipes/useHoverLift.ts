import { useEffect } from 'react';
import { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { motion } from '../tokens';

const isWeb = typeof window !== 'undefined' && 'onmouseover' in window;

export function useHoverLift(px = 8) {
  const y = useSharedValue(0);
  const enter = () => { y.value = withSpring(-px, motion.spring.soft); };
  const leave = () => { y.value = withSpring(0, motion.spring.smooth); };
  useEffect(() => {
    if (!isWeb) return;
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return { onMouseEnter: isWeb ? enter : undefined, onMouseLeave: isWeb ? leave : undefined, animatedStyle };
}

