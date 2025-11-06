import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

export function useParallax(mult = 0.2) {
  const offset = useSharedValue(0);
  const onScroll = (e: any) => { offset.value = e.nativeEvent?.contentOffset?.y ?? 0; };
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -offset.value * mult }] }));
  return { onScroll, animatedStyle };
}

