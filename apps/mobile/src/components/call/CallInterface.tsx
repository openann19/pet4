/**
 * Call Interface Component - Mobile Implementation
 *
 * Full-screen video call interface with controls, picture-in-picture, and network quality indicators
 * Location: apps/mobile/src/components/call/CallInterface.tsx
 */

import React, { useCallback, useEffect, useState, useRef } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
import { useWebRTC } from '@/hooks/call/use-web-rtc'
import { createLogger } from '@/utils/logger'
import { springConfigs } from '@/effects/reanimated/transitions'
import { useTheme } from '@/hooks/use-theme'

const logger = createLogger('CallInterface')

const { width, height } = Dimensions.get('window')

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor'

export interface CallInterfaceProps {
  callId: string
  remoteUserId: string
  remoteName: string
  remotePhoto?: string
  onEndCall: () => void
  isCaller?: boolean
  stunServers?: Array<{ urls: string | string[] }>
  turnServers?: Array<{
    urls: string | string[]
    username?: string
    credential?: string
  }>
  onSignalingData?: (data: {
    type: 'offer' | 'answer' | 'candidate'
    sdp?: unknown
    candidate?: unknown
  }) => void
}

// Dynamic imports for react-native-webrtc
type RTCViewProps = {
  streamURL?: string
  objectFit?: 'contain' | 'cover'
  mirror?: boolean
  zOrder?: number
  style?: unknown
}

type RTCViewComponent = React.ComponentType<RTCViewProps>

let RTCView: RTCViewComponent | null = null

export const CallInterface: React.FC<CallInterfaceProps> = ({
  callId,
  remoteUserId,
  remoteName,
  remotePhoto,
  onEndCall,
  isCaller = false,
  stunServers,
  turnServers,
  onSignalingData,
}) => {
  const { theme } = useTheme()
  const [duration, setDuration] = useState(0)
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('good')
  const [isVideoModuleLoaded, setIsVideoModuleLoaded] = useState(false)
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load WebRTC video module dynamically
  useEffect(() => {
    if (!isVideoModuleLoaded) {
      void import('react-native-webrtc')
        .then((module: unknown) => {
          const webrtcModule = module as { RTCView: RTCViewComponent }
          RTCView = webrtcModule.RTCView
          setIsVideoModuleLoaded(true)
          logger.info('WebRTC video module loaded')
        })
        .catch((error: unknown) => {
          const err = error instanceof Error ? error : new Error(String(error))
          logger.error('Failed to load WebRTC video module', err)
        })
    }
  }, [isVideoModuleLoaded])

  // Initialize WebRTC connection
  const { callState, toggleMute, toggleCamera, endCall } = useWebRTC({
    callId,
    remoteUserId,
    isCaller,
    ...(stunServers && { stunServers }),
    ...(turnServers && { turnServers }),
    ...(onSignalingData && { onSignalingData }),
    onRemoteStream: useCallback(() => {
      logger.info('Remote stream received', { callId, remoteUserId })
    }, [callId, remoteUserId]),
    onConnectionStateChange: useCallback(
      (state: 'connecting' | 'connected' | 'disconnected' | 'failed') => {
        logger.info('Connection state changed', { state, callId })
        if (state === 'connected') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        } else if (state === 'failed') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        }
      },
      [callId]
    ),
  })

  // Call duration timer
  useEffect(() => {
    if (callState.isConnected) {
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [callState.isConnected])

  // Network quality monitoring (basic implementation)
  useEffect(() => {
    if (!callState.isConnected) {
      return
    }

    const monitorNetworkQuality = (): void => {
      // Basic network quality estimation based on connection state
      // In production, this would use RTCStats to get actual metrics
      if (callState.error) {
        setNetworkQuality('poor')
      } else if (callState.isConnected) {
        // Simulate quality monitoring - replace with actual RTCStats in production
        setNetworkQuality('good')
      }
    }

    const interval = setInterval(monitorNetworkQuality, 5000)
    return () => {
      clearInterval(interval)
    }
  }, [callState.isConnected, callState.error])

  // Animation values
  const connectingPulse = useSharedValue(0)
  const controlButtonScale = useSharedValue(1)
  const localVideoScale = useSharedValue(1)
  const localVideoTranslateX = useSharedValue(0)
  const localVideoTranslateY = useSharedValue(0)

  // Connecting pulse animation
  useEffect(() => {
    if (callState.isConnecting && !callState.isConnected) {
      connectingPulse.value = withSpring(1, springConfigs.bouncy, () => {
        connectingPulse.value = withSpring(0, springConfigs.smooth)
      })
    }
  }, [callState.isConnecting, callState.isConnected, connectingPulse])

  // Picture-in-picture gesture for local video
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      localVideoTranslateX.value = event.translationX
      localVideoTranslateY.value = event.translationY
    })
    .onEnd(() => {
      // Snap to nearest corner
      const snapThreshold = 50
      const screenWidth = width
      const screenHeight = height
      const localVideoWidth = 120
      const localVideoHeight = 160

      const currentX = localVideoTranslateX.value
      const currentY = localVideoTranslateY.value

      let targetX = currentX
      let targetY = currentY

      // Snap to left or right
      if (Math.abs(currentX) < snapThreshold) {
        targetX = 0
      } else if (currentX > 0 && currentX + localVideoWidth > screenWidth - snapThreshold) {
        targetX = screenWidth - localVideoWidth - 20
      } else if (currentX < 0 && Math.abs(currentX) > screenWidth / 2) {
        targetX = 20 - localVideoWidth
      }

      // Snap to top or bottom
      if (Math.abs(currentY) < snapThreshold) {
        targetY = 0
      } else if (currentY > screenHeight / 2) {
        targetY = screenHeight - localVideoHeight - 100
      } else {
        targetY = 60
      }

      localVideoTranslateX.value = withSpring(targetX, springConfigs.smooth)
      localVideoTranslateY.value = withSpring(targetY, springConfigs.smooth)

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    })

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleToggleMute = useCallback((): void => {
    toggleMute()
    controlButtonScale.value = withSequence(
      withSpring(1.2, springConfigs.bouncy),
      withSpring(1, springConfigs.smooth)
    )
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [toggleMute, controlButtonScale])

  const handleToggleCamera = useCallback((): void => {
    toggleCamera()
    controlButtonScale.value = withSequence(
      withSpring(1.2, springConfigs.bouncy),
      withSpring(1, springConfigs.smooth)
    )
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [toggleCamera, controlButtonScale])

  const handleEndCall = useCallback(async (): Promise<void> => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await endCall()
    onEndCall()
  }, [endCall, onEndCall])

  // Animated styles
  const connectingPulseStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      connectingPulse.value,
      [0, 1],
      [0.3, 0.7],
      Extrapolation.CLAMP
    )
    return {
      opacity,
    }
  })

  const controlButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: controlButtonScale.value }],
  }))

  const localVideoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: localVideoTranslateX.value },
      { translateY: localVideoTranslateY.value },
      { scale: localVideoScale.value },
    ],
  }))

  const getNetworkQualityColor = (quality: NetworkQuality): string => {
    switch (quality) {
      case 'excellent':
        return theme.colors.success
      case 'good':
        return theme.colors.info
      case 'fair':
        return theme.colors.warning
      case 'poor':
        return theme.colors.danger
      default:
        return theme.colors.textSecondary
    }
  }

  const getNetworkQualityText = (quality: NetworkQuality): string => {
    switch (quality) {
      case 'excellent':
        return 'Excellent'
      case 'good':
        return 'Good'
      case 'fair':
        return 'Fair'
      case 'poor':
        return 'Poor'
      default:
        return 'Unknown'
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top', 'bottom']}
      >
        {/* Remote Video Area */}
        <View style={styles.remoteVideoContainer}>
          {callState.isConnecting && !callState.isConnected ? (
            <View style={styles.connectingContainer}>
              <Animated.View style={[styles.connectingPulse, connectingPulseStyle]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </Animated.View>
              <Text style={[styles.connectingText, { color: theme.colors.textPrimary }]}>
                Connecting...
              </Text>
            </View>
          ) : callState.error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                {callState.error}
              </Text>
              <Text style={[styles.errorSubtext, { color: theme.colors.textSecondary }]}>
                Please try again
              </Text>
            </View>
          ) : callState.remoteStream && isVideoModuleLoaded && RTCView ? (
            <RTCView
              streamURL={callState.remoteStream.toURL()}
              style={styles.remoteVideo}
              objectFit="cover"
            />
          ) : (
            <View
              style={[styles.remoteVideoPlaceholder, { backgroundColor: theme.colors.foreground }]}
            >
              {remotePhoto ? (
                <View
                  style={[
                    styles.avatarContainer,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: theme.colors.textPrimary }]}>
                    {remoteName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.remoteNameText, { color: theme.colors.textPrimary }]}>
                {remoteName}
              </Text>
              <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                {callState.isConnected ? formatDuration(duration) : 'Connecting...'}
              </Text>
            </View>
          )}
        </View>

        {/* Local Video (Picture-in-Picture) */}
        {callState.localStream && callState.isCameraOn && isVideoModuleLoaded && RTCView ? (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.localVideoContainer, localVideoStyle]}>
              <RTCView
                streamURL={callState.localStream.toURL()}
                style={styles.localVideo}
                objectFit="cover"
                mirror
              />
            </Animated.View>
          </GestureDetector>
        ) : callState.isCameraOn ? (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.localVideoContainer, localVideoStyle]}>
              <View
                style={[
                  styles.localVideoPlaceholder,
                  { backgroundColor: theme.colors.foreground },
                ]}
              >
                <Text style={[styles.localVideoText, { color: theme.colors.textPrimary }]}>
                  You
                </Text>
              </View>
            </Animated.View>
          </GestureDetector>
        ) : null}

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.controls}>
            {/* Mute Button */}
            <Animated.View style={controlButtonStyle}>
              <Pressable
                style={[
                  styles.controlButton,
                  callState.isMuted && [
                    styles.controlButtonActive,
                    { backgroundColor: theme.colors.danger },
                  ],
                  { backgroundColor: theme.colors.foreground },
                ]}
                onPress={handleToggleMute}
                accessibilityLabel={callState.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>{callState.isMuted ? '🔇' : '🎤'}</Text>
              </Pressable>
            </Animated.View>

            {/* End Call Button */}
            <Animated.View style={controlButtonStyle}>
              <Pressable
                style={[
                  styles.controlButton,
                  styles.endCallButton,
                  { backgroundColor: theme.colors.danger },
                ]}
                onPress={() => {
                  handleEndCall().catch((error) => {
                    logger.error('Failed to end call', error instanceof Error ? error : new Error(String(error)))
                  })
                }}
                accessibilityLabel="End call"
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>📞</Text>
              </Pressable>
            </Animated.View>

            {/* Camera Toggle Button */}
            <Animated.View style={controlButtonStyle}>
              <Pressable
                style={[
                  styles.controlButton,
                  !callState.isCameraOn && [
                    styles.controlButtonActive,
                    { backgroundColor: theme.colors.warning },
                  ],
                  { backgroundColor: theme.colors.foreground },
                ]}
                onPress={handleToggleCamera}
                accessibilityLabel={callState.isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>
                  {callState.isCameraOn ? '📹' : '📷'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>

        {/* Network Quality Indicator */}
        {callState.isConnected && (
          <View
            style={[
              styles.networkIndicator,
              { backgroundColor: theme.colors.background + 'B3' },
            ]}
          >
            <View
              style={[
                styles.networkDot,
                { backgroundColor: getNetworkQualityColor(networkQuality) },
              ]}
            />
            <Text style={[styles.networkText, { color: theme.colors.textPrimary }]}>
              {getNetworkQualityText(networkQuality)} Connection
            </Text>
          </View>
        )}

        {/* Call Duration */}
        {callState.isConnected && (
          <View
            style={[
              styles.durationContainer,
              { backgroundColor: theme.colors.background + 'B3' },
            ]}
          >
            <Text style={[styles.durationText, { color: theme.colors.textPrimary }]}>
              {formatDuration(duration)}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  remoteVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'var(--color-fg)',
  },
  remoteVideo: {
    width: width,
    height: height,
  },
  remoteVideoPlaceholder: {
    width: width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'var(--color-bg-overlay)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  remoteNameText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 18,
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectingText: {
    fontSize: 18,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'var(--color-bg-overlay)',
    backgroundColor: '#3a3a3a',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  localVideoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoText: {
    fontSize: 14,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controlButtonActive: {
    // Styles applied via inline styles
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  controlButtonText: {
    fontSize: 28,
  },
  networkIndicator: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  networkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
})
