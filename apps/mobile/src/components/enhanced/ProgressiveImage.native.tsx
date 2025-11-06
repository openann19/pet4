import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Image, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'

export interface ProgressiveImageProps {
  src: string
  alt: string
  placeholderSrc?: string
  style?: ViewStyle
  imageStyle?: ImageStyle
  blurAmount?: number
  aspectRatio?: number
  priority?: boolean
  onLoad?: () => void
  onError?: (error: Error) => void
  testID?: string
}

export function ProgressiveImage({
  src,
  alt,
  placeholderSrc,
  style,
  imageStyle,
  blurAmount = 20,
  aspectRatio,
  priority = false,
  onLoad,
  onError,
  testID = 'progressive-image',
}: ProgressiveImageProps): React.JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || src)
  const [error, setError] = useState(false)
  const placeholderOpacity = useSharedValue(1)
  const imageOpacity = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()

  const loadImage = useCallback(() => {
    Image.prefetch(src)
      .then(() => {
        setCurrentSrc(src)
        setIsLoaded(true)
        onLoad?.()
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(true)
        onError?.(error)
      })
  }, [src, onLoad, onError])

  useEffect(() => {
    if (priority) {
      loadImage()
      return
    }
    // For mobile, we can use Image.prefetch which handles caching
    loadImage()
  }, [src, priority, loadImage])

  useEffect(() => {
    if (isLoaded) {
      const duration = reducedMotion.value ? 200 : 300
      placeholderOpacity.value = withTiming(0, { duration })
      imageOpacity.value = withTiming(1, { duration })
    }
  }, [isLoaded, placeholderOpacity, imageOpacity, reducedMotion])

  const placeholderStyle = useAnimatedStyle(() => ({
    opacity: placeholderOpacity.value,
  }))

  const animatedImageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }))

  return (
    <View
      style={[
        styles.container,
        aspectRatio && { aspectRatio },
        style,
      ]}
      testID={testID}
    >
      {!isLoaded && placeholderSrc && (
        <Animated.View style={[styles.placeholder, placeholderStyle]}>
          <Image
            source={{ uri: placeholderSrc }}
            style={[styles.image, { opacity: 0.5 }]}
            blurRadius={blurAmount}
          />
        </Animated.View>
      )}

      <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
        <Image
          source={{ uri: currentSrc }}
          style={[styles.image, imageStyle]}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            const err = new Error(`Failed to load image: ${src}`)
            setError(true)
            onError?.(err)
          }}
        />
      </Animated.View>

      {!isLoaded && !placeholderSrc && (
        <View style={styles.skeleton} />
      )}

      {error && (
        <View style={styles.errorContainer}>
          <View style={styles.errorPlaceholder} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  skeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#e5e7eb',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  errorPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#d1d5db',
    borderRadius: 20,
  },
})

