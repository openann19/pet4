import { forwardRef } from 'react';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import type { TextProps, TextStyle } from 'react-native';

/**
 * Unified animated Text component.
 * Accepts animated style fragments and provides web performance optimizations.
 */
export const MotionText = forwardRef<
  Animated.Text,
  TextProps & {
    animatedStyle?: AnimatedStyle<TextStyle>;
  }
>(({ style, animatedStyle, ...rest }, ref) => {
  const styleFinal = animatedStyle ? [style, animatedStyle] : style;
  
  // Web performance hints (only apply on web, and only if animated)
  // Note: willChange is not a valid React Native style, so we only apply it conditionally
  // In practice, Reanimated handles this on web automatically
  
  return (
    <Animated.Text
      ref={ref}
      {...rest}
      style={styleFinal}
    />
  );
});
MotionText.displayName = 'MotionText';

