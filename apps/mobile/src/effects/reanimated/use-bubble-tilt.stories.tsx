/**
 * Bubble Tilt Hook - Mobile Story
 * Demonstrates the useBubbleTilt hook for mobile chat bubble interactions
 */

import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { GestureDetector } from 'react-native-gesture-handler'
import { useBubbleTilt } from './use-bubble-tilt'

const { width } = Dimensions.get('window')

export default {
  title: 'Mobile/Animation Hooks/useBubbleTilt',
  component: BubbleTiltDemo,
}

function BubbleTiltDemo() {
  const bubbleSize = width * 0.7
  const { animatedStyle, createGesture } = useBubbleTilt({
    maxTilt: 15,
    shadowDepth: 8,
  })

  const gesture = createGesture(bubbleSize, bubbleSize)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bubble Tilt Hook</Text>
        <Text style={styles.subtitle}>Mobile Gesture Interaction</Text>
      </View>

      <View style={styles.instructionArea}>
        <Text style={styles.instructionText}>
          Drag the bubble to see tilt effect
        </Text>
      </View>

      <View style={styles.bubbleContainer}>
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.bubble,
              {
                width: bubbleSize,
                height: bubbleSize,
              },
              animatedStyle,
            ]}
          >
            <View style={styles.bubbleContent}>
              <Text style={styles.bubbleEmoji}>💬</Text>
              <Text style={styles.bubbleText}>Chat Bubble</Text>
              <Text style={styles.bubbleSubtext}>
                Drag me around!
              </Text>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Pan gesture for tilt interaction
        </Text>
        <Text style={styles.infoText}>
          • 3D perspective effect with shadow
        </Text>
        <Text style={styles.infoText}>
          • Smooth spring animations
        </Text>
        <Text style={styles.infoText}>
          • Mobile-optimized gesture handling
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
  instructionArea: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bubbleContainer: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  bubbleContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  bubbleEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bubbleSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
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

export { BubbleTiltDemo }

