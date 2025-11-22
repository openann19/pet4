import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import type { ViewStyle } from 'react-native'

// Reanimated exports AnimatedComponent types conditionally
type AnimatedComponents = typeof Animated & {
  View: typeof Animated.View;
  Text: typeof Animated.Text;
  ScrollView?: typeof Animated.View;
}

// Type guard for Animated.ScrollView availability
const AnimatedScrollView = ('ScrollView' in Animated
  ? (Animated as AnimatedComponents).ScrollView
  : (Animated as AnimatedComponents).View) as typeof Animated.View

/**
 * Unified animated ScrollView component.
 * Accepts animated style fragments and provides web performance optimizations.
 * Falls back to View on web where ScrollView may not be available.
 */
export function MotionScrollView(
  props: React.ComponentProps<typeof AnimatedScrollView> & {
    animatedStyle?: AnimatedStyle<ViewStyle>
  }
): JSX.Element {
  const { style, animatedStyle, ...rest } = props

  const styleFinal = animatedStyle
    ? (Array.isArray(animatedStyle) ? [...(Array.isArray(style) ? style : [style]), ...animatedStyle] : [style, animatedStyle])
    : style

  // Note: Web performance hints are handled by Reanimated automatically

  return <AnimatedScrollView {...rest} style={styleFinal as AnimatedStyle<ViewStyle> | AnimatedStyle<ViewStyle>[]} />
}
