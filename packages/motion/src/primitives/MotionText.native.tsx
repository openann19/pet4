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
export const MotionText: ForwardRefExoticComponent<
  MotionTextProps & RefAttributes<ComponentRef<typeof Animated.Text>>
> = forwardRef<ComponentRef<typeof Animated.Text>, MotionTextProps>(
  ({ style, animatedStyle, ...rest }, ref) => {
    const styleFinal: TextStyle | TextStyle[] = animatedStyle 
      ? [style, animatedStyle].filter(Boolean) as TextStyle[]
      : (style ?? ({} as TextStyle))

    return <Animated.Text ref={ref} {...rest} style={styleFinal} />
  }
)
MotionText.displayName = 'MotionText'
