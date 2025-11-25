/**
 * Swipeable card stack component with enhanced performance and accessibility
 * Location: src/components/swipe/SwipeCardStack.tsx
 */

import React, { memo, useCallback, useMemo } from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import { Animated, cancelAnimation, FadeIn, FadeOut, Layout, useAnimatedStyle, useSharedValue, withSequence, withSpring } from '@petspark/motion'
import { colors } from '../../theme/colors'
import type { PetProfile } from '../../types/pet'
import { SwipeCard } from './SwipeCard'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH - 40
const MAX_VISIBLE_CARDS = 3

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
}

interface SwipeCardStackProps {
  pets: PetProfile[]
  onSwipeLeft: (petId: string) => void
  onSwipeRight: (petId: string) => void
}

export const SwipeCardStack = memo(
  ({ pets, onSwipeLeft, onSwipeRight }: SwipeCardStackProps): React.JSX.Element => {
    const visiblePets = useMemo(() => pets.slice(0, MAX_VISIBLE_CARDS), [pets])
    const offset = useSharedValue(0)

    const containerStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: offset.value }],
      }
    })

    const handleCardSwipe = useCallback(
      (direction: 'left' | 'right', petId: string): void => {
        if (direction === 'right') {
          onSwipeRight(petId)
        } else {
          onSwipeLeft(petId)
        }

        // Animate stack shift with proper cleanup
        cancelAnimation(offset)
        offset.value = withSequence(
          withSpring(-10, SPRING_CONFIG),
          withSpring(0, {
            ...SPRING_CONFIG,
            damping: 25,
          })
        )
      },
      [onSwipeLeft, onSwipeRight, offset]
    )

    if (visiblePets.length === 0) {
      return (
        <View style={styles.emptyContainer} accessible accessibilityRole="text">
          <Text style={styles.emptyText}>No more pets to swipe!</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh and discover more pets</Text>
        </View>
      )
    }

    return (
      <Animated.View
        style={[styles.container, containerStyle]}
        accessible={false}
        accessibilityRole="none"
      >
        {visiblePets.map((pet: PetProfile, index: number) => (
          <CardWrapper
            key={pet.id}
            pet={pet}
            index={index}
            totalCards={visiblePets.length}
            onSwipeLeft={petId => handleCardSwipe('left', petId)}
            onSwipeRight={petId => handleCardSwipe('right', petId)}
          />
        ))}
      </Animated.View>
    )
  }
)

interface CardWrapperProps {
  pet: PetProfile
  index: number
  totalCards: number
  onSwipeLeft: (petId: string) => void
  onSwipeRight: (petId: string) => void
}

const CardWrapper = memo(
  ({ pet, index, totalCards, onSwipeLeft, onSwipeRight }: CardWrapperProps): React.JSX.Element => {
    const zIndex = totalCards - index
    const scale = 1 - index * 0.05
    const translateY = index * 10

    return (
      <Animated.View
        entering={FadeIn.delay(index * 100)}
        exiting={FadeOut}
        layout={Layout.springify()}
        style={[
          styles.cardWrapper,
          {
            zIndex,
            transform: [{ scale }, { translateY }],
          },
        ]}
        accessible={index === 0}
        accessibilityRole="none"
      >
        <SwipeCard
          pet={pet}
          onSwipeLeft={onSwipeLeft}
          onSwipeRight={onSwipeRight}
          isTop={index === 0}
        />
      </Animated.View>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: '70%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
