import React, { useEffect } from 'react';
import Animated, { useSharedValue, withTiming, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { motion } from '../tokens';

export function Presence({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  const a = useSharedValue(visible ? 1 : 0);
  useEffect(() => { a.value = withTiming(visible ? 1 : 0, { duration: motion.durations.md }); }, [visible]);
  const style = useAnimatedStyle(() => ({
    opacity: a.value,
    transform: [{ translateY: (1 - a.value) * 12 }, { scale: 0.98 + a.value * 0.02 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export function usePageTransitions() {
  const t = useSharedValue(0);
  const enter = () => (t.value = withSpring(1, motion.spring.smooth));
  const exit  = () => (t.value = withTiming(0, { duration: motion.durations.sm }));
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - t.value) * 20 }], opacity: t.value
  }));
  return { enter, exit, animatedStyle };
}

