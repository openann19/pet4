/**
 * Entry Animation Hook - Mobile Story
 * Demonstrates the useEntryAnimation hook for mobile component entrances
 */

import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import Animated from 'react-native-reanimated'
import { useEntryAnimation } from './use-entry-animation'

export default {
  title: 'Mobile/Animation Hooks/useEntryAnimation',
  component: EntryAnimationDemo,
}

function AnimatedCard({ index, delay }: { index: number; delay: number }) {
  const { animatedStyle } = useEntryAnimation({
    delay: delay * index,
    duration: 400,
    initialY: 30,
    initialOpacity: 0,
    initialScale: 0.9,
    enabled: true,
  })

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Text style={styles.cardTitle}>Card {index + 1}</Text>
      <Text style={styles.cardText}>
        This card animates in with a delay of {delay * index}ms
      </Text>
    </Animated.View>
  )
}

function EntryAnimationDemo() {
  const [delay, setDelay] = useState(100)
  const [enabled, setEnabled] = useState(true)
  const [cardCount, setCardCount] = useState(5)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Entry Animation Hook</Text>
        <Text style={styles.subtitle}>Mobile Component Entrances</Text>
      </View>

      <ScrollView style={styles.cardsContainer} contentContainerStyle={styles.cardsContent}>
        {Array.from({ length: cardCount }, (_, i) => (
          <AnimatedCard key={i} index={i} delay={delay} />
        ))}
      </ScrollView>

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Delay: {delay}ms</Text>
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => { setDelay(Math.max(0, delay - 50)); }}
            >
              <Text style={styles.controlButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => { setDelay(Math.min(500, delay + 50)); }}
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
            {enabled ? 'Disable' : 'Enable'} Animation
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Fade, slide, and scale animations
        </Text>
        <Text style={styles.infoText}>
          • Configurable delay for staggered effects
        </Text>
        <Text style={styles.infoText}>
          • Smooth spring animations
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
    marginBottom: 20,
  },
  cardsContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    color: '#D1D5DB',
    fontSize: 14,
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

export { EntryAnimationDemo }

