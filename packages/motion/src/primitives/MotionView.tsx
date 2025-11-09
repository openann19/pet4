import { forwardRef } from 'react'
import type { ComponentRef, ForwardRefExoticComponent, RefAttributes } from 'react'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import type { ViewProps, ViewStyle } from 'react-native'

const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined'

interface MotionViewProps extends ViewProps {
  animatedStyle?: AnimatedStyle<ViewStyle>
}

/**
 * Unified animated View component.
 * Accepts animated style fragments and provides web performance optimizations.
 */
export const MotionView: ForwardRefExoticComponent<
  MotionViewProps & RefAttributes<ComponentRef<typeof Animated.View>>
> = forwardRef<ComponentRef<typeof Animated.View>, MotionViewProps>(
  ({ style, animatedStyle, ...rest }, ref) => {
    // Combine styles properly
    const styleFinal = animatedStyle ? [style, animatedStyle] : (style ?? ({} as ViewStyle))

    // Web performance hints (only apply on web, and only if animated)
    const webStyle =
      isWeb && animatedStyle
        ? {
            willChange: 'transform, opacity' as const,
            contain: 'layout paint style' as const,
          }
        : undefined

    const finalStyle = webStyle ? [styleFinal, webStyle as ViewStyle] : styleFinal

    return <Animated.View ref={ref} {...rest} style={finalStyle} />
  }
)
MotionView.displayName = 'MotionView'
