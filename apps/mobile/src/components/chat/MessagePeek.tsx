/**
 * MessagePeek Component (Mobile)
 *
 * Long-press preview card with magnified message content
 * Opens within 120ms, respects reduced motion
 */

import React, { useEffect } from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated'
import { useReducedMotionSV } from '../../effects/chat/core/reduced-motion'
import { useFeatureFlags } from '../../config/feature-flags'
import { springConfigs, timingConfigs } from '../../effects/reanimated/transitions'
import { isTruthy } from '@petspark/shared';

export interface MessagePeekNativeProps {
  message: {
    content: string
    senderName: string
    timestamp: string
    type?: string
  }
  visible: boolean
  onClose: () => void
}

export function MessagePeekNative({
  message,
  visible,
  onClose,
}: MessagePeekNativeProps): React.JSX.Element {
  const reducedMotion = useReducedMotionSV()
  const { enableMessagePeek } = useFeatureFlags()

  const scale = useSharedValue(0.9)
  const opacity = useSharedValue(0)
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (!enableMessagePeek) {
      return
    }

    if (visible) {
      const duration = reducedMotion.value ? 120 : 180
      scale.value = withSpring(1, springConfigs.smooth)
      opacity.value = withTiming(1, { duration })
      backdropOpacity.value = withTiming(0.25, { duration })
    } else {
      scale.value = withTiming(0.9, timingConfigs.fast)
      opacity.value = withTiming(0, timingConfigs.fast)
      backdropOpacity.value = withTiming(0, timingConfigs.fast)
    }
  }, [visible, reducedMotion, enableMessagePeek, scale, opacity, backdropOpacity])

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  if (!enableMessagePeek) {
    return <></>
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)">
        <Animated.View
          style={[styles.backdropOverlay, backdropStyle]}
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(120)}
        />
      </Pressable>

      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
          style={[styles.card, cardStyle]}
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.senderName}>{message.senderName}</Text>
              <Text style={styles.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close preview"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.content}>{message.content}</Text>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'var(--color-fg)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: 24,
    maxWidth: '90%',
    width: 400,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'var(--color-bg-overlay)',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#888',
  },
  content: {
    fontSize: 16,
    color: 'var(--color-bg-overlay)',
    lineHeight: 24,
  },
})
