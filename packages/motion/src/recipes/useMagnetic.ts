import { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useRef } from 'react';
import { motion } from '../tokens';

export function useMagnetic(radius = 80) {
  const tx = useSharedValue(0), ty = useSharedValue(0);
  const ref = useRef<{layout?: {x: number; y: number; w: number; h: number}}>({});

  function onLayout(e: any) {
    const { x, y, width: w, height: h } = e.nativeEvent.layout || {};
    ref.current.layout = { x, y, w, h };
  }
  function onPointerMove(e: any) {
    const { clientX, clientY } = e.nativeEvent || e;
    const L = ref.current.layout; if (!L) return;
    const cx = L.x + L.w / 2, cy = L.y + L.h / 2;
    const dx = clientX - cx, dy = clientY - cy;
    const d = Math.min(1, Math.hypot(dx, dy) / radius);
    tx.value = withSpring((1 - d) * dx * 0.15, motion.spring.soft);
    ty.value = withSpring((1 - d) * dy * 0.15, motion.spring.soft);
  }
  function onPointerLeave() {
    tx.value = withSpring(0, motion.spring.smooth);
    ty.value = withSpring(0, motion.spring.smooth);
  }
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }] }));
  return { onLayout, onPointerMove, onPointerLeave, animatedStyle };
}

