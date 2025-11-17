/**
 * SmartImage Component (Mobile)
 *
 * Progressive image loading with LQIP, shimmer effect
 * Reduced motion → instant swap
 */

import React, { useState, useEffect } from 'react'
import { Image, StyleSheet, View, type StyleProp, type ImageStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated'
import { useReducedMotionSV } from '../../effects/chat/core/reduced-motion'
import { useFeatureFlags } from '../../config/feature-flags'
import { springConfigs } from '../../effects/reanimated/transitions'

export interface SmartImageNativeProps {
  src: string
  lqip?: string // Low Quality Image Placeholder
  alt?: string
  style?: StyleProp<ImageStyle>
  width?: number
  height?: number
  onLoad?: () => void
}

export function SmartImageNative({
  src,
  lqip,
  alt,
  style,
  width,
  height,
  onLoad,
}: SmartImageNativeProps): React.JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showSharp, setShowSharp] = useState(false)
  const reducedMotion = useReducedMotionSV()
  const { enableSmartImage } = useFeatureFlags()

  const shimmerOpacity = useSharedValue(0.6)
  const imageOpacity = useSharedValue(0)

  useEffect(() => {
    if (!enableSmartImage) {
      return
    }

    if (reducedMotion.value) {
      imageOpacity.value = 1
      return
    }

    // Shimmer animation
    shimmerOpacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 600 }), withTiming(0.6, { duration: 600 })),
      -1,
      true
    )

    if (isLoaded && showSharp) {
      imageOpacity.value = withSpring(1, springConfigs.smooth)
    }
  }, [isLoaded, showSharp, reducedMotion, enableSmartImage, imageOpacity, shimmerOpacity])

  const handleLoad = (): void => {
    setIsLoaded(true)
    setTimeout(
      () => {
        setShowSharp(true)
        onLoad?.()
      },
      reducedMotion.value ? 0 : 30
    )
  }

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }))

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }))

  if (!enableSmartImage) {
    return (
      <Image
        source={{ uri: src }}
        style={[styles.image, style, { width, height }]}
        resizeMode="cover"
        onLoad={onLoad}
        accessibilityLabel={alt}
      />
    )
  }

  return (
    <View style={[styles.container, style, { width, height }]}>
      {/* LQIP placeholder */}
      {lqip && !showSharp && (
        <Image source={{ uri: lqip }} style={[styles.image, styles.blurred]} resizeMode="cover" />
      )}

      {/* Shimmer effect */}
      {!isLoaded && <Animated.View style={[styles.shimmer, shimmerStyle]} />}

      {/* Sharp image */}
      <Animated.Image
        source={{ uri: src }}
        style={[styles.image, imageStyle]}
        resizeMode="cover"
        onLoad={handleLoad}
        accessibilityLabel={alt}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  blurred: {
    position: 'absolute',
    opacity: 0.5,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--color-bg-overlay)20',
  },
})
