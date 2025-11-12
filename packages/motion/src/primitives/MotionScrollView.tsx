import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import type { ViewStyle } from 'react-native'

/**
 * Unified animated ScrollView component.
 * Accepts animated style fragments and provides web performance optimizations.
 */
export function MotionScrollView(
  props: React.ComponentProps<typeof Animated.ScrollView> & {
    animatedStyle?: AnimatedStyle<ViewStyle>
  }
): JSX.Element {
  const { style, animatedStyle, ...rest } = props

  const styleFinal = animatedStyle ? [style, animatedStyle] : style

  // Note: Web performance hints are handled by Reanimated automatically

  return <Animated.ScrollView {...rest} style={styleFinal} />
}
