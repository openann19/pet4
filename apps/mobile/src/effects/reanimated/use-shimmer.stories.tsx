/**
 * Shimmer Hook - Mobile Story
 * Demonstrates the useShimmer hook for mobile loading states
 */

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useShimmer } from './use-shimmer'

export default {
  title: 'Mobile/Animation Hooks/useShimmer',
  component: ShimmerDemo,
}

function ShimmerCard() {
  const { animatedStyle, start, stop } = useShimmer({
    duration: 2000,
    delay: 0,
    shimmerWidth: 200,
    enabled: true,
  })

  React.useEffect(() => {
    start()
    return () => {
      stop()
    }
  }, [start, stop])

  return (
    <View style={styles.card}>
      <View style={styles.shimmerContainer}>
        <Animated.View style={[styles.shimmer, animatedStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.avatar} />
        <View style={styles.textContainer}>
          <View style={styles.titleLine} />
          <View style={styles.subtitleLine} />
        </View>
      </View>
    </View>
  )
}

function ShimmerDemo() {
  const [enabled, setEnabled] = useState(true)
  const [duration, setDuration] = useState(2000)
  const [cardCount, setCardCount] = useState(3)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shimmer Hook</Text>
        <Text style={styles.subtitle}>Mobile Loading States</Text>
      </View>

      <View style={styles.cardsContainer}>
        {Array.from({ length: cardCount }, (_, i) => (
          <ShimmerCard key={i} />
        ))}
      </View>

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Duration: {duration}ms</Text>
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => { setDuration(Math.max(500, duration - 500)); }}
            >
              <Text style={styles.controlButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => { setDuration(Math.min(5000, duration + 500)); }}
            >
              <Text style={styles.controlButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Cards: {cardCount}</Text>
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => { setCardCount(Math.max(1, cardCount - 1)); }}
            >
              <Text style={styles.controlButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => { setCardCount(Math.min(10, cardCount + 1)); }}
            >
              <Text style={styles.controlButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.toggleButton, enabled && styles.toggleButtonActive]}
          onPress={() => { setEnabled(!enabled); }}
        >
          <Text style={styles.toggleButtonText}>
            {enabled ? 'Disable' : 'Enable'} Shimmer
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Continuous shimmer animation
        </Text>
        <Text style={styles.infoText}>
          • Configurable duration and width
        </Text>
        <Text style={styles.infoText}>
          • Smooth linear animation
        </Text>
        <Text style={styles.infoText}>
          • Mobile-optimized performance
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  cardsContainer: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  card: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shimmer: {
    width: 200,
    height: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4B5563',
  },
  textContainer: {
    flex: 1,
    gap: 8,
  },
  titleLine: {
    height: 16,
    backgroundColor: '#4B5563',
    borderRadius: 4,
    width: '70%',
  },
  subtitleLine: {
    height: 12,
    backgroundColor: '#4B5563',
    borderRadius: 4,
    width: '50%',
  },
  controls: {
    marginBottom: 20,
    gap: 16,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    backgroundColor: '#374151',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#10B981',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    padding: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  infoText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 4,
  },
})

export { ShimmerDemo }

