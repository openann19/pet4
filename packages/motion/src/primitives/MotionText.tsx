import { forwardRef } from 'react';
import Animated from 'react-native-reanimated';
import type { TextProps } from 'react-native';

export const MotionText = forwardRef<typeof Animated.Text, TextProps>((props, ref) => {
  return <Animated.Text ref={ref as any} {...props} />;
});
MotionText.displayName = 'MotionText';

