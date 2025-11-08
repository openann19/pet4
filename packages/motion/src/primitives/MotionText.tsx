import { forwardRef } from 'react'
import type { ComponentRef, ForwardRefExoticComponent, RefAttributes } from 'react'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import type { TextProps, TextStyle } from 'react-native'

interface MotionTextProps extends TextProps {
  animatedStyle?: AnimatedStyle<TextStyle>
}

/**
 * Unified animated Text component.
 * Accepts animated style fragments and provides web performance optimizations.
 */
export const MotionText: ForwardRefExoticComponent<MotionTextProps & RefAttributes<ComponentRef<typeof Animated.Text>>> = forwardRef<
  ComponentRef<typeof Animated.Text>,
  MotionTextProps
>(({ style, animatedStyle, ...rest }, ref) => {
  const styleFinal = animatedStyle ? [style, animatedStyle] : (style ?? {});

  // Web performance hints (only apply on web, and only if animated)
  // Note: willChange is not a valid React Native style, so we only apply it conditionally
  // In practice, Reanimated handles this on web automatically

  return <Animated.Text ref={ref} {...rest} style={styleFinal} />
})
MotionText.displayName = 'MotionText'
