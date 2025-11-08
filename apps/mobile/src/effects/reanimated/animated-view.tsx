import React from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import type { ViewProps } from 'react-native'
import type { AnimatedStyle as ReanimatedAnimatedStyle } from 'react-native-reanimated'

/**
 * Animated View wrapper for Reanimated
 * Provides consistent animated View component across the app
 */
export const AnimatedView = Animated.createAnimatedComponent(
  React.forwardRef((props: ViewProps, ref: React.Ref<View>) => (
    <Animated.View ref={ref} {...props} />
  ))
)

/**
 * Type alias for Reanimated animated styles
 * Use this type when working with useAnimatedStyle return values
 */
export type AnimatedStyle = ReanimatedAnimatedStyle<ViewProps['style']>
