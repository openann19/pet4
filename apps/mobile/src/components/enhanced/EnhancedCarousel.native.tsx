/**
 * EnhancedCarousel - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/EnhancedCarousel.native.tsx
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  type ViewStyle,
  type ViewProps,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
import { isTruthy, isDefined } from '@/core/guards';

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const AnimatedView = Animated.createAnimatedComponent(View)

const SPRING_CONFIG = {
  damping: 18,
  mass: 1,
  stiffness: 220,
}

const FADE_CONFIG = {
  duration: 150,
}

export interface EnhancedCarouselProps extends ViewProps {
  items: React.ReactNode[]
  autoPlay?: boolean
  autoPlayInterval?: number
  showControls?: boolean
  showIndicators?: boolean
  loop?: boolean
  onSlideChange?: (index: number) => void
  style?: ViewStyle
}

export function EnhancedCarousel({
  items,
  autoPlay = false,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  loop = true,
  onSlideChange,
  style,
  ...props
}: EnhancedCarouselProps): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemCount = items.length

  const translateX = useSharedValue(0)
  const opacity = useSharedValue(1)
  const autoPlayRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const goToSlide = useCallback(
    (index: number) => {
      if (index === currentIndex || index < 0 || index >= itemCount) return

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined)
      setCurrentIndex(index)
      translateX.value = withSpring(-index * SCREEN_WIDTH, SPRING_CONFIG)
      onSlideChange?.(index)
    },
    [currentIndex, itemCount, onSlideChange, translateX]
  )

  const goToNext = useCallback(() => {
    const nextIndex =
      currentIndex === itemCount - 1 ? (loop ? 0 : currentIndex) : currentIndex + 1
    if (nextIndex !== currentIndex) {
      goToSlide(nextIndex)
    }
  }, [currentIndex, itemCount, loop, goToSlide])

  const goToPrev = useCallback(() => {
    const prevIndex = currentIndex === 0 ? (loop ? itemCount - 1 : currentIndex) : currentIndex - 1
    if (prevIndex !== currentIndex) {
      goToSlide(prevIndex)
    }
  }, [currentIndex, itemCount, loop, goToSlide])

  useEffect(() => {
    if (autoPlay && itemCount > 1) {
      autoPlayRef.current = setInterval(() => {
        goToNext()
      }, autoPlayInterval)

      return () => {
        if (isTruthy(autoPlayRef.current)) {
          clearInterval(autoPlayRef.current)
        }
      }
    }
    return
  }, [autoPlay, autoPlayInterval, goToNext, itemCount])

  const panGesture = Gesture.Pan()
    .onStart(() => {
      opacity.value = withTiming(0.85, FADE_CONFIG)
    })
    .onUpdate((event) => {
      translateX.value = -currentIndex * SCREEN_WIDTH + event.translationX
    })
    .onEnd((event) => {
      opacity.value = withTiming(1, FADE_CONFIG)

      const threshold = SCREEN_WIDTH * 0.25
      if (event.translationX > threshold && currentIndex > 0) {
        runOnJS(goToPrev)()
      } else if (event.translationX < -threshold && currentIndex < itemCount - 1) {
        runOnJS(goToNext)()
      } else {
        translateX.value = withSpring(-currentIndex * SCREEN_WIDTH, SPRING_CONFIG)
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }))

  useEffect(() => {
    translateX.value = withSpring(-currentIndex * SCREEN_WIDTH, SPRING_CONFIG)
  }, [currentIndex, translateX])

  if (itemCount === 0) {
    return (
      <View style={[styles.emptyContainer, style]} {...props}>
        <Text style={styles.emptyText}>No carousel items</Text>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={[styles.container, style]} {...props}>
      <GestureDetector gesture={panGesture}>
        <AnimatedView style={[styles.carousel, animatedStyle]}>
          {items.map((item, index) => (
            <View key={index} style={styles.slide}>
              {item}
            </View>
          ))}
        </AnimatedView>
      </GestureDetector>

      {showIndicators && itemCount > 1 && (
        <View style={styles.indicators}>
          {items.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}

      {itemCount > 1 && (
        <View style={styles.counter}>
          <View style={styles.counterBadge}>
            {currentIndex + 1} / {itemCount}
          </View>
        </View>
      )}
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: 300,
    position: 'relative',
    overflow: 'hidden',
  },
  carousel: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 100, // Enough for all slides
  },
  slide: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  emptyContainer: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  indicators: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  indicatorActive: {
    width: 32,
    backgroundColor: '#3b82f6',
  },
  counter: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  counterBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
})
