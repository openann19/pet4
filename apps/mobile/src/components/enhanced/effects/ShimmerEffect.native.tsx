import React, { useEffect } from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'

export interface ShimmerEffectProps {
  width?: number | string
  height?: number | string
  borderRadius?: number
  animated?: boolean
  style?: ViewStyle
  testID?: string
}

export function ShimmerEffect({
  width = '100%',
  height = 16,
  borderRadius = 8,
  animated = true,
  style,
  testID = 'shimmer-effect'
}: ShimmerEffectProps): React.JSX.Element {
  const reducedMotion = useReducedMotionSV()
  const shimmerPosition = useSharedValue(-100)

  useEffect(() => {
    if (animated && !reducedMotion.value) {
      shimmerPosition.value = withRepeat(
        withTiming(200, { duration: 1500 }),
        -1,
        false
      )
    }
  }, [animated, reducedMotion, shimmerPosition])

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value }]
  }))

  return (
    <View
      style={[
        styles.container,
        {
          width: typeof width === 'number' ? width : undefined,
          height: typeof height === 'number' ? height : undefined,
          borderRadius
        },
        style
      ]}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.shimmer,
          shimmerStyle,
          {
            width: typeof width === 'number' ? width * 0.5 : '50%',
            height: typeof height === 'number' ? height : '100%',
            borderRadius
          }
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f3f4f6'
  },
  shimmer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  }
})

