import { forwardRef } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { ViewProps } from 'react-native';

/** Unified animated View. Accepts animated style fragments. */
export const MotionView = forwardRef<typeof Animated.View, ViewProps & {
  animatedStyle?: ReturnType<typeof useAnimatedStyle>;
}>(({ style, animatedStyle, ...rest }, ref) => {
  const styleFinal = animatedStyle ? [style, animatedStyle as any] : style;
  return <Animated.View ref={ref as any} {...rest} style={styleFinal} />;
});
MotionView.displayName = 'MotionView';

