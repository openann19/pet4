/**
 * Timestamp Reveal Hook - Mobile Story
 * Demonstrates the useTimestampReveal hook for mobile chat timestamps
 */

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { useTimestampReveal } from './use-timestamp-reveal'
import { isTruthy } from '@petspark/shared';

export default {
  title: 'Mobile/Animation Hooks/useTimestampReveal',
  component: TimestampRevealDemo,
}

function MessageBubble({ text, showTimestamp }: { text: string; showTimestamp: boolean }) {
  const { animatedStyle, show, hide } = useTimestampReveal({
    autoHideDelay: 3000,
    enabled: true,
  })

  React.useEffect(() => {
    if (isTruthy(showTimestamp)) {
      show()
    } else {
      hide()
    }
  }, [showTimestamp, show, hide])

  return (
    <View style={styles.bubbleContainer}>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{text}</Text>
      </View>
      <Animated.View style={[styles.timestampContainer, animatedStyle]}>
        <Text style={styles.timestampText}>10:30 AM</Text>
      </Animated.View>
    </View>
  )
}

function TimestampRevealDemo() {
  const [showTimestamps, setShowTimestamps] = useState(false)
  const [autoHide, setAutoHide] = useState(true)

  const messages = [
    'Hello! How are you?',
    'I\'m doing great, thanks!',
    'Want to grab coffee later?',
    'Sure, sounds good!',
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Timestamp Reveal Hook</Text>
        <Text style={styles.subtitle}>Mobile Chat Timestamps</Text>
      </View>

      <View style={styles.chatContainer}>
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            text={message}
            showTimestamp={showTimestamps}
          />
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, showTimestamps && styles.buttonActive]}
          onPress={() => { setShowTimestamps(!showTimestamps); }}
        >
          <Text style={styles.buttonText}>
            {showTimestamps ? 'Hide' : 'Show'} Timestamps
          </Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Auto-hide: {autoHide ? '3s' : 'Manual'}</Text>
          <TouchableOpacity
            style={styles.toggle}
            onPress={() => { setAutoHide(!autoHide); }}
          >
            <View style={[styles.toggleTrack, autoHide && styles.toggleTrackActive]}>
              <View style={[styles.toggleThumb, autoHide && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Tap to reveal timestamps
        </Text>
        <Text style={styles.infoText}>
          • Auto-hide after 3 seconds
        </Text>
        <Text style={styles.infoText}>
          • Smooth fade and slide animations
        </Text>
        <Text style={styles.infoText}>
          • Mobile-optimized touch interactions
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
    padding: 16,
    marginBottom: 20,
    gap: 16,
  },
  bubbleContainer: {
    marginVertical: 4,
  },
  bubble: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 16,
    maxWidth: '75%',
    alignSelf: 'flex-start',
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  timestampContainer: {
    marginTop: 4,
    marginLeft: 12,
  },
  timestampText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  controls: {
    marginBottom: 20,
    gap: 16,
  },
  button: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
  },
  infoLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  toggle: {
    width: 50,
    height: 30,
  },
  toggleTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    padding: 2,
  },
  toggleTrackActive: {
    backgroundColor: '#4F46E5',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
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

export { TimestampRevealDemo }
