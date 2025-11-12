import { forwardRef, useCallback, useMemo } from 'react'
import type { ComponentRef, ForwardRefExoticComponent, RefAttributes } from 'react'
import Animated, {
  type AnimatedStyle,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import type { ViewProps, ViewStyle } from 'react-native'

const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined'

interface HoverStyle {
  scale?: number
  opacity?: number
  rotate?: number
  translateX?: number
  translateY?: number
}

interface MotionViewProps extends ViewProps {
  animatedStyle?: AnimatedStyle<ViewStyle>
  whileHover?: HoverStyle
  whileTap?: HoverStyle
}

/**
 * Unified animated View component.
 * Accepts animated style fragments and provides web performance optimizations.
 * Supports whileHover and whileTap props for web interactions.
 */
export const MotionView: ForwardRefExoticComponent<
  MotionViewProps & RefAttributes<ComponentRef<typeof Animated.View>>
> = forwardRef<ComponentRef<typeof Animated.View>, MotionViewProps>(
  ({ style, animatedStyle, whileHover, whileTap, ...rest }, ref) => {
    // Use shared values for smooth animations on web
    const scale = useSharedValue(1)
    const opacity = useSharedValue(1)
    const translateX = useSharedValue(0)
    const translateY = useSharedValue(0)
    const rotate = useSharedValue(0)

    const animationConfig = useMemo(
      () => ({
        duration: 200,
        easing: Easing.out(Easing.ease),
      }),
      []
    )

    // Helper to apply transform values
    const applyTransforms = useCallback(
      (transforms: HoverStyle | null) => {
        if (!transforms) {
          scale.value = withTiming(1, animationConfig)
          opacity.value = withTiming(1, animationConfig)
          translateX.value = withTiming(0, animationConfig)
          translateY.value = withTiming(0, animationConfig)
          rotate.value = withTiming(0, animationConfig)
          return
        }

        scale.value = withTiming(transforms.scale ?? 1, animationConfig)
        opacity.value = withTiming(transforms.opacity ?? 1, animationConfig)
        translateX.value = withTiming(transforms.translateX ?? 0, animationConfig)
        translateY.value = withTiming(transforms.translateY ?? 0, animationConfig)
        rotate.value = withTiming(transforms.rotate ?? 0, animationConfig)
      },
      [scale, opacity, translateX, translateY, rotate]
    )

    // Create animated style for hover/tap effects
    // Hooks must be called unconditionally, so we always call useAnimatedStyle
    const interactiveStyle = useAnimatedStyle(() => {
      const hasInteraction = (whileHover || whileTap) && isWeb
      if (!hasInteraction) {
        return {}
      }

      const transforms: Array<{
        scale?: number
        rotate?: string
        translateX?: number
        translateY?: number
      }> = []

      const currentScale = scale.value
      const currentRotate = rotate.value
      const currentTranslateX = translateX.value
      const currentTranslateY = translateY.value
      const currentOpacity = opacity.value

      if (currentScale !== 1) {
        transforms.push({ scale: currentScale })
      }
      if (currentRotate !== 0) {
        transforms.push({ rotate: `${currentRotate}deg` })
      }
      if (currentTranslateX !== 0) {
        transforms.push({ translateX: currentTranslateX })
      }
      if (currentTranslateY !== 0) {
        transforms.push({ translateY: currentTranslateY })
      }

      return {
        transform: transforms.length > 0 ? transforms : undefined,
        opacity: currentOpacity !== 1 ? currentOpacity : undefined,
      }
    })

    // Combine styles properly
    // Handle style which can be ViewStyle or ViewStyle[]
    const baseStyles = Array.isArray(style) ? style : style ? [style] : []
    const allStyles: Array<ViewStyle | AnimatedStyle<ViewStyle>> = [...baseStyles]

    if (animatedStyle) {
      allStyles.push(animatedStyle)
    }
    // Only add interactive style if we have interactions
    if ((whileHover || whileTap) && isWeb) {
      allStyles.push(interactiveStyle)
    }

    // Web performance hints (only apply on web, and only if animated)
    if (isWeb && (animatedStyle || ((whileHover || whileTap) && isWeb))) {
      allStyles.push({
        willChange: 'transform, opacity',
        contain: 'layout paint style',
      } as ViewStyle)
    }

    // Return appropriate style format
    const styleWithPerformance: ViewStyle | AnimatedStyle<ViewStyle> | Array<ViewStyle | AnimatedStyle<ViewStyle>> =
      allStyles.length === 0
        ? ({} as ViewStyle)
        : allStyles.length === 1
          ? allStyles[0]
          : allStyles

    // Event handlers for web hover/tap interactions
    const handleMouseEnter = useCallback(() => {
      if (isWeb && whileHover) {
        applyTransforms(whileHover)
      }
    }, [whileHover, applyTransforms])

    const handleMouseLeave = useCallback(() => {
      if (isWeb) {
        applyTransforms(null)
      }
    }, [applyTransforms])

    const handleMouseDown = useCallback(() => {
      if (isWeb && whileTap) {
        applyTransforms(whileTap)
      }
    }, [whileTap, applyTransforms])

    const handleMouseUp = useCallback(() => {
      if (isWeb) {
        if (whileHover) {
          applyTransforms(whileHover)
        } else {
          applyTransforms(null)
        }
      }
    }, [whileHover, applyTransforms])

    // Extract web-specific event handlers from rest props if they exist
    // and filter out whileHover/whileTap to prevent React warnings
    const {
      onMouseEnter: existingOnMouseEnter,
      onMouseLeave: existingOnMouseLeave,
      onMouseDown: existingOnMouseDown,
      onMouseUp: existingOnMouseUp,
      onTouchStart: existingOnTouchStart,
      onTouchEnd: existingOnTouchEnd,
      ...domProps
    } = rest as ViewProps & {
      onMouseEnter?: () => void
      onMouseLeave?: () => void
      onMouseDown?: () => void
      onMouseUp?: () => void
      onTouchStart?: () => void
      onTouchEnd?: () => void
    }

    // Combine existing handlers with our handlers
    const combinedHandlers = isWeb
      ? {
        onMouseEnter: existingOnMouseEnter
          ? () => {
            existingOnMouseEnter()
            handleMouseEnter()
          }
          : handleMouseEnter,
        onMouseLeave: existingOnMouseLeave
          ? () => {
            existingOnMouseLeave()
            handleMouseLeave()
          }
          : handleMouseLeave,
        onMouseDown: existingOnMouseDown
          ? () => {
            existingOnMouseDown()
            handleMouseDown()
          }
          : handleMouseDown,
        onMouseUp: existingOnMouseUp
          ? () => {
            existingOnMouseUp()
            handleMouseUp()
          }
          : handleMouseUp,
        onTouchStart: existingOnTouchStart
          ? () => {
            existingOnTouchStart()
            handleMouseDown()
          }
          : whileTap
            ? handleMouseDown
            : undefined,
        onTouchEnd: existingOnTouchEnd
          ? () => {
            existingOnTouchEnd()
            handleMouseUp()
          }
          : whileTap || whileHover
            ? handleMouseUp
            : undefined,
      }
      : {}

    return (
      <Animated.View
        ref={ref}
        {...domProps}
        {...(isWeb ? combinedHandlers : {})}
        style={styleWithPerformance}
      />
    )
  }
)
MotionView.displayName = 'MotionView'
