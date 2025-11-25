/**
 * Match celebration component
 * Location: src/components/swipe/MatchCelebration.tsx
 */

import * as Haptics from 'expo-haptics'
import React, { useEffect } from 'react'
import { Dimensions, Modal, StyleSheet, Text } from 'react-native'
import { Animated, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring } from '@petspark/motion'
import { isTruthy } from '@petspark/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface MatchCelebrationProps {
  visible: boolean
  petNames: [string, string]
  onComplete: () => void
}

const springConfig = {
  damping: 15,
  stiffness: 250,
  mass: 0.9,
}

export function MatchCelebration({
  visible,
  petNames,
  onComplete,
}: MatchCelebrationProps): React.JSX.Element {
  const scale = useSharedValue(0)
  const rotation = useSharedValue(0)

  useEffect(() => {
    if (isTruthy(visible)) {
      // Haptic feedback
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Animation sequence
      scale.value = withSpring(1, springConfig)
      rotation.value = withSequence(
        withSpring(15, springConfig),
        withSpring(-15, springConfig),
        withSpring(0, springConfig)
      )

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        scale.value = withSpring(0, springConfig, () => {
          onComplete()
        })
      }, 3000)

      return () => {
        clearTimeout(timer)
      }
    }
    scale.value = 0
    rotation.value = 0
    return
  }, [visible, scale, rotation, onComplete])

  useEffect(() => {
    if (!visible) {
      scale.value = 0
      rotation.value = 0
    }
  }, [visible, scale, rotation])

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
      opacity: scale.value,
    }
  })

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withRepeat(withSpring(1.2, springConfig), -1, true) }],
    }
  })

  if (!visible) {
    return <React.Fragment />
  }

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.backdrop}>
        <Animated.View style={[styles.container, containerStyle]}>
          <Animated.View style={[styles.pulse, pulseStyle]} />
          <Text style={styles.title}>🎉 It's a Match! 🎉</Text>
          <Text style={styles.subtitle}>
            {petNames[0]} and {petNames[1]} liked each other!
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: 'var(--color-bg-overlay)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: SCREEN_WIDTH - 80,
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  pulse: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(232, 157, 92, 0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
})
