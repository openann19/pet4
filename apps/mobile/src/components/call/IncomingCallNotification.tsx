/**
 * Incoming Call Notification Component - Mobile Implementation
 *
 * Full-screen incoming call notification with accept/decline buttons
 * Location: apps/mobile/src/components/call/IncomingCallNotification.tsx
 */

import React, { useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Modal, Pressable, Image } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { PremiumButton } from '@/components/enhanced/PremiumButton'
import { useTheme } from '@/hooks/use-theme'
import { createLogger } from '@/utils/logger'
import { springConfigs } from '@/effects/reanimated/transitions'

const logger = createLogger('IncomingCallNotification')

const AnimatedView = Animated.View

export interface Caller {
  id: string
  name: string
  photo?: string
}

export interface IncomingCallNotificationProps {
  visible: boolean
  caller: Caller
  onAccept: () => void
  onDecline: () => void
}

export const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  visible,
  caller,
  onAccept,
  onDecline,
}) => {
  const { theme } = useTheme()
  const pulseScale = useSharedValue(1)
  const ring1Scale = useSharedValue(1)
  const ring2Scale = useSharedValue(1)
  const ring3Scale = useSharedValue(1)

  useEffect(() => {
    if (visible) {
      // Pulse animation for photo
      pulseScale.value = withRepeat(
        withTiming(1.1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )

      // Animated rings
      ring1Scale.value = withRepeat(
        withTiming(1.5, {
          duration: 2000,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false
      )
      ring2Scale.value = withRepeat(
        withTiming(1.8, {
          duration: 2000,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false
      )
      ring3Scale.value = withRepeat(
        withTiming(2.1, {
          duration: 2000,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false
      )

      // Haptic feedback for incoming call
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    } else {
      pulseScale.value = 1
      ring1Scale.value = 1
      ring2Scale.value = 1
      ring3Scale.value = 1
    }
  }, [visible, pulseScale, ring1Scale, ring2Scale, ring3Scale])

  const animatedPhotoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulseScale.value, [1, 1.1], [1, 1.05], Extrapolation.CLAMP) }],
  }))

  const ring1Style = useAnimatedStyle(() => {
    const scale = ring1Scale.value
    const opacity = interpolate(scale, [1, 1.5], [0.6, 0], Extrapolation.CLAMP)
    return {
      transform: [{ scale }],
      opacity,
    }
  })

  const ring2Style = useAnimatedStyle(() => {
    const scale = ring2Scale.value
    const opacity = interpolate(scale, [1, 1.8], [0.4, 0], Extrapolation.CLAMP)
    return {
      transform: [{ scale }],
      opacity,
    }
  })

  const ring3Style = useAnimatedStyle(() => {
    const scale = ring3Scale.value
    const opacity = interpolate(scale, [1, 2.1], [0.2, 0], Extrapolation.CLAMP)
    return {
      transform: [{ scale }],
      opacity,
    }
  })

  const handleAccept = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onAccept()
  }, [onAccept])

  const handleDecline = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    onDecline()
  }, [onDecline])

  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background + 'F5' },
        ]}
        accessible
        accessibilityRole="alert"
        accessibilityLabel={`Incoming video call from ${caller.name}`}
      >
        <View style={styles.content}>
          {/* Animated Rings */}
          <View style={styles.ringsContainer}>
            <AnimatedView
              style={[
                styles.ring,
                styles.ring1,
                ring1Style,
                { borderColor: theme.colors.primary + '60' },
              ]}
            />
            <AnimatedView
              style={[
                styles.ring,
                styles.ring2,
                ring2Style,
                { borderColor: theme.colors.primary + '40' },
              ]}
            />
            <AnimatedView
              style={[
                styles.ring,
                styles.ring3,
                ring3Style,
                { borderColor: theme.colors.primary + '20' },
              ]}
            />
          </View>

          {/* Caller Photo */}
          <AnimatedView style={[styles.photoContainer, animatedPhotoStyle]}>
            {caller.photo ? (
              <Image source={{ uri: caller.photo }} style={styles.photo} />
            ) : (
              <View
                style={[
                  styles.photo,
                  styles.photoPlaceholder,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={[styles.photoPlaceholderText, { color: theme.colors.textPrimary }]}>
                  {caller.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </AnimatedView>

          {/* Caller Name */}
          <Text style={[styles.callerName, { color: theme.colors.textPrimary }]}>
            {caller.name}
          </Text>
          <Text style={[styles.callType, { color: theme.colors.textSecondary }]}>
            Incoming Video Call
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Decline Button */}
            <PremiumButton
              variant="primary"
              size="lg"
              onPress={handleDecline}
              style={StyleSheet.flatten([styles.declineButton, { backgroundColor: theme.colors.danger }])}
            >
              ✕ Decline
            </PremiumButton>

            {/* Accept Button */}
            <PremiumButton
              variant="primary"
              size="lg"
              onPress={handleAccept}
              style={StyleSheet.flatten([styles.acceptButton, { backgroundColor: theme.colors.success }])}
            >
              📹 Accept
            </PremiumButton>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    position: 'relative',
  },
  ringsContainer: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -70 }],
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 100,
  },
  ring1: {
    width: 140,
    height: 140,
  },
  ring2: {
    width: 180,
    height: 180,
  },
  ring3: {
    width: 220,
    height: 220,
  },
  photoContainer: {
    marginBottom: 32,
    zIndex: 1,
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  callerName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  callType: {
    fontSize: 18,
    marginBottom: 48,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
    width: '100%',
  },
  declineButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 1,
  },
})
