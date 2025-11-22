/**
 * Swipe Reply Hook - Mobile Story
 * Demonstrates the useSwipeReply hook for mobile swipe-to-reply gesture
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { GestureDetector } from 'react-native-gesture-handler'
import { useSwipeReply } from './use-swipe-reply'
import logger from '@/lib/logger';

export default {
  title: 'Mobile/Animation Hooks/useSwipeReply',
  component: SwipeReplyDemo,
}

function SwipeReplyDemo() {
  const { animatedStyle, previewStyle, gesture, reset } = useSwipeReply({
    onReply: () => {
      logger.info('Reply triggered!')
    },
    threshold: 60,
    hapticFeedback: true,
    enabled: true,
  })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Swipe Reply Hook</Text>
        <Text style={styles.subtitle}>Mobile Gesture Interaction</Text>
      </View>

      <View style={styles.instructionArea}>
        <Text style={styles.instructionText}>
          Swipe right on the message to reply
        </Text>
        <Text style={styles.instructionSubtext}>
          Swipe past the threshold to trigger reply
        </Text>
      </View>

      <View style={styles.messageArea}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.messageContainer, animatedStyle]}>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>
                Swipe me to the right to reply!
              </Text>
            </View>
          </Animated.View>
        </GestureDetector>

        <Animated.View style={[styles.replyPreview, previewStyle]}>
          <Text style={styles.replyPreviewText}>Replying...</Text>
        </Animated.View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Pan gesture for swipe-to-reply
        </Text>
        <Text style={styles.infoText}>
          • Haptic feedback at threshold
        </Text>
        <Text style={styles.infoText}>
          • Preview animation on commit
        </Text>
        <Text style={styles.infoText}>
          • Auto-reset after 2 seconds
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
    marginBottom: 4,
  },
  instructionSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  messageArea: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'center',
  },
  messageContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  messageBubble: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 12,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  replyPreview: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  replyPreviewText: {
    color: '#FFFFFF',
    fontSize: 14,
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

export { SwipeReplyDemo }

