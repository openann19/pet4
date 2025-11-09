/**
 * Swipeable pet card component with React Native Reanimated
 * Location: src/components/swipe/SwipeCard.tsx
 */

import * as Haptics from 'expo-haptics'
import React, { memo, useCallback } from 'react'
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import type { PetProfile } from '../../types/pet'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3
const CARD_WIDTH = SCREEN_WIDTH - 40

interface SwipeCardProps {
  pet: PetProfile
  onSwipeLeft: (petId: string) => void
  onSwipeRight: (petId: string) => void
  isTop: boolean
}

const springConfig = {
  damping: 15,
  stiffness: 250,
  mass: 0.9,
}

function SwipeCardComponent({
  pet,
  onSwipeLeft,
  onSwipeRight,
  isTop,
}: SwipeCardProps): React.JSX.Element {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const rotate = useSharedValue(0)
  const scale = useSharedValue(isTop ? 1 : 0.95)

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        onSwipeRight(pet.id)
      } else {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onSwipeLeft(pet.id)
      }
    },
    [pet.id, onSwipeLeft, onSwipeRight]
  )

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onChange((event: { translationX: number; translationY: number }) => {
      translateX.value = event.translationX
      translateY.value = event.translationY
      rotate.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        [-15, 0, 15],
        Extrapolation.CLAMP
      )
    })
    .onEnd((event: { translationX: number; translationY: number; velocityX: number }) => {
      const absX = Math.abs(event.translationX)
      const absY = Math.abs(event.translationY)

      if (absX > SWIPE_THRESHOLD || absX > absY) {
        // Swipe horizontally
        const direction = event.translationX > 0 ? 'right' : 'left'
        const finalX = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH

        translateX.value = withSpring(
          finalX,
          {
            ...springConfig,
            velocity: event.velocityX,
          },
          () => {
            runOnJS(handleSwipeComplete)(direction)
          }
        )
        translateY.value = withSpring(0, springConfig)
        rotate.value = withSpring(0, springConfig)
      } else {
        // Return to center
        translateX.value = withSpring(0, springConfig)
        translateY.value = withSpring(0, springConfig)
        rotate.value = withSpring(0, springConfig)
      }
    })

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH / 2],
      [1, 0],
      Extrapolation.CLAMP
    )

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotate.value}deg` },
        { scale: scale.value },
      ],
      opacity,
    }
  })

  const likeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP)

    return {
      opacity,
    }
  })

  const dislikeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    )

    return {
      opacity,
    }
  })

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {/* Like overlay */}
        <Animated.View style={[styles.overlay, styles.likeOverlay, likeOverlayStyle]}>
          <Text style={styles.likeText}>LIKE</Text>
        </Animated.View>

        {/* Dislike overlay */}
        <Animated.View style={[styles.overlay, styles.dislikeOverlay, dislikeOverlayStyle]}>
          <Text style={styles.dislikeText}>NOPE</Text>
        </Animated.View>

        {/* Pet image */}
        {pet.photos[0] && (
          <Image source={{ uri: pet.photos[0] }} style={styles.image} resizeMode="cover" />
        )}

        {/* Pet info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.details}>
            {pet.breed} • {pet.age} {pet.age === 1 ? 'year' : 'years'} old
          </Text>
          {pet.bio && <Text style={styles.bio}>{pet.bio}</Text>}
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderRadius: 20,
  },
  likeOverlay: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  dislikeOverlay: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
  },
  likeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    borderWidth: 4,
    borderColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  dislikeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    borderWidth: 4,
    borderColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: '75%',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  details: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
})

// Memoize SwipeCard to prevent unnecessary re-renders
export const SwipeCard = memo(SwipeCardComponent, (prev, next) => {
  return (
    prev.pet.id === next.pet.id &&
    prev.pet.name === next.pet.name &&
    prev.pet.photo === next.pet.photo &&
    prev.isTop === next.isTop &&
    prev.onSwipeLeft === next.onSwipeLeft &&
    prev.onSwipeRight === next.onSwipeRight
  );
});
