/**
 * Bubble Entry Hook - Mobile Story
 * Demonstrates the useBubbleEntry hook for mobile chat bubbles
 */

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import Animated from 'react-native-reanimated'
import { useBubbleEntry } from './use-bubble-entry'

export default {
  title: 'Mobile/Animation Hooks/useBubbleEntry',
  component: BubbleEntryDemo,
}

interface BubbleProps {
  text: string
  direction?: 'left' | 'right' | 'bottom'
  delay?: number
}

function BubbleComponent({ text, direction = 'left', delay = 0 }: BubbleProps) {
  const { style, enter, exit, reset, isVisible, isAnimating } = useBubbleEntry({
    direction,
    delay,
    autoTrigger: true,
    enabled: true,
  })

  return (
    <Animated.View style={[styles.bubble, direction === 'right' ? styles.bubbleRight : styles.bubbleLeft, style]}>
      <Text style={styles.bubbleText}>{text}</Text>
      <View style={styles.bubbleControls}>
        <TouchableOpacity style={styles.controlButton} onPress={enter}>
          <Text style={styles.controlText}>Enter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={exit}>
          <Text style={styles.controlText}>Exit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={reset}>
          <Text style={styles.controlText}>Reset</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.statusText}>
        {isAnimating ? 'Animating' : 'Idle'} | {isVisible ? 'Visible' : 'Hidden'}
      </Text>
    </Animated.View>
  )
}

function BubbleEntryDemo() {
  const [staggerDelay, setStaggerDelay] = useState(30)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bubble Entry Hook</Text>
        <Text style={styles.subtitle}>Mobile Chat Implementation</Text>
      </View>

      <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
        <BubbleComponent
          text="Incoming message from left"
          direction="left"
          delay={0}
        />
        <BubbleComponent
          text="Outgoing message to right"
          direction="right"
          delay={staggerDelay}
        />
        <BubbleComponent
          text="Another incoming message"
          direction="left"
          delay={staggerDelay * 2}
        />
        <BubbleComponent
          text="Message from bottom"
          direction="bottom"
          delay={staggerDelay * 3}
        />
      </ScrollView>

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Text style={styles.label}>Stagger Delay: {staggerDelay}ms</Text>
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => { setStaggerDelay(Math.max(0, staggerDelay - 10)); }}
            >
              <Text style={styles.sliderButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => { setStaggerDelay(Math.min(100, staggerDelay + 10)); }}
            >
              <Text style={styles.sliderButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Staggered entry animations for chat bubbles
        </Text>
        <Text style={styles.infoText}>
          • Supports left, right, and bottom directions
        </Text>
        <Text style={styles.infoText}>
          • Mobile-optimized spring animations
        </Text>
        <Text style={styles.infoText}>
          • Reduced motion support
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
  chatContainer: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    marginBottom: 20,
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '75%',
    marginVertical: 4,
  },
  bubbleLeft: {
    backgroundColor: '#374151',
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    backgroundColor: '#4F46E5',
    alignSelf: 'flex-end',
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  bubbleControls: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  statusText: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 4,
  },
  controls: {
    marginBottom: 20,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  sliderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderButton: {
    backgroundColor: '#374151',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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

export { BubbleEntryDemo }

