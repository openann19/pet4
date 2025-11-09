import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useWebRTC } from '../../hooks/call/useWebRTC';
import { createLogger } from '../../utils/logger';

// Spring configurations for animations
const springConfigs = {
  smooth: { damping: 25, stiffness: 400 },
  bouncy: { damping: 15, stiffness: 500 },
};

const logger = createLogger('CallInterface');

const { width, height } = Dimensions.get('window');

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor';

interface CallInterfaceProps {
  callId: string;
  remoteUserId: string;
  remoteName: string;
  remotePhoto?: string;
  onEndCall: () => void;
  isCaller?: boolean;
  stunServers?: Array<{ urls: string | string[] }>;
  turnServers?: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
  onSignalingData?: (data: {
    type: 'offer' | 'answer' | 'candidate';
    sdp?: unknown;
    candidate?: unknown;
  }) => void;
}

// Dynamic imports for react-native-webrtc
// RTCView is a React component from react-native-webrtc
type RTCViewProps = {
  streamURL?: string;
  objectFit?: 'contain' | 'cover';
  mirror?: boolean;
  zOrder?: number;
  style?: unknown;
};

type RTCViewComponent = React.ComponentType<RTCViewProps>;

let RTCView: RTCViewComponent | null = null;

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
  const [duration, setDuration] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('good');
  const [isVideoModuleLoaded, setIsVideoModuleLoaded] = useState(false);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load WebRTC video module dynamically
  useEffect(() => {
    if (!isVideoModuleLoaded) {
      void import('react-native-webrtc')
        .then((module: { RTCView: RTCViewComponent }) => {
          RTCView = module.RTCView;
          setIsVideoModuleLoaded(true);
          logger.info('WebRTC video module loaded');
        })
        .catch((error: unknown) => {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Failed to load WebRTC video module', err);
        });
    }
  }, [isVideoModuleLoaded]);

  // Initialize WebRTC connection
  const { callState, toggleMute, toggleCamera, endCall } = useWebRTC({
    callId,
    remoteUserId,
    isCaller,
    stunServers,
    turnServers,
    onSignalingData,
    onRemoteStream: useCallback(() => {
      logger.info('Remote stream received', { callId, remoteUserId });
    }, [callId, remoteUserId]),
    onConnectionStateChange: useCallback(
      (state: 'connecting' | 'connected' | 'disconnected' | 'failed') => {
        logger.info('Connection state changed', { state, callId });
        if (state === 'connected') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (state === 'failed') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      },
      [callId]
    ),
  });

  // Call duration timer
  useEffect(() => {
    if (callState.isConnected) {
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callState.isConnected]);

  // Network quality monitoring (basic implementation)
  useEffect(() => {
    if (!callState.isConnected) {
      return;
    }

    const monitorNetworkQuality = (): void => {
      // Basic network quality estimation based on connection state
      // In production, this would use RTCStats to get actual metrics
      if (callState.error) {
        setNetworkQuality('poor');
      } else if (callState.isConnected) {
        // Simulate quality monitoring - replace with actual RTCStats in production
        setNetworkQuality('good');
      }
    };

    const interval = setInterval(monitorNetworkQuality, 5000);
    return () => clearInterval(interval);
  }, [callState.isConnected, callState.error]);

  // Animation values
  const connectingPulse = useSharedValue(0);
  const controlButtonScale = useSharedValue(1);
  const localVideoScale = useSharedValue(1);
  const localVideoTranslateX = useSharedValue(0);
  const localVideoTranslateY = useSharedValue(0);

  // Connecting pulse animation
  useEffect(() => {
    if (callState.isConnecting && !callState.isConnected) {
      connectingPulse.value = withSpring(1, springConfigs.bouncy, () => {
        connectingPulse.value = withSpring(0, springConfigs.smooth);
      });
    }
  }, [callState.isConnecting, callState.isConnected, connectingPulse]);

  // Picture-in-picture gesture for local video
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      localVideoTranslateX.value = event.translationX;
      localVideoTranslateY.value = event.translationY;
    })
    .onEnd(() => {
      // Snap to nearest corner
      const snapThreshold = 50;
      const screenWidth = width;
      const screenHeight = height;
      const localVideoWidth = 120;
      const localVideoHeight = 160;

      const currentX = localVideoTranslateX.value;
      const currentY = localVideoTranslateY.value;

      let targetX = currentX;
      let targetY = currentY;

      // Snap to left or right
      if (Math.abs(currentX) < snapThreshold) {
        targetX = 0;
      } else if (currentX > 0 && currentX + localVideoWidth > screenWidth - snapThreshold) {
        targetX = screenWidth - localVideoWidth - 20;
      } else if (currentX < 0 && Math.abs(currentX) > screenWidth / 2) {
        targetX = 20 - localVideoWidth;
      }

      // Snap to top or bottom
      if (Math.abs(currentY) < snapThreshold) {
        targetY = 0;
      } else if (currentY > screenHeight / 2) {
        targetY = screenHeight - localVideoHeight - 100;
      } else {
        targetY = 60;
      }

      localVideoTranslateX.value = withSpring(targetX, springConfigs.smooth);
      localVideoTranslateY.value = withSpring(targetY, springConfigs.smooth);

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = useCallback((): void => {
    toggleMute();
    controlButtonScale.value = withSequence(
      withSpring(1.2, springConfigs.bouncy),
      withSpring(1, springConfigs.smooth)
    );
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [toggleMute, controlButtonScale]);

  const handleToggleCamera = useCallback((): void => {
    toggleCamera();
    controlButtonScale.value = withSequence(
      withSpring(1.2, springConfigs.bouncy),
      withSpring(1, springConfigs.smooth)
    );
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [toggleCamera, controlButtonScale]);

  const handleEndCall = useCallback(async (): Promise<void> => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await endCall();
    onEndCall();
  }, [endCall, onEndCall]);

  // Animated styles
  const connectingPulseStyle = useAnimatedStyle(() => {
    const opacity = interpolate(connectingPulse.value, [0, 1], [0.3, 0.7], Extrapolation.CLAMP);
    return {
      opacity,
    };
  });

  const controlButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: controlButtonScale.value }],
  }));

  const localVideoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: localVideoTranslateX.value },
      { translateY: localVideoTranslateY.value },
      { scale: localVideoScale.value },
    ],
  }));

  const getNetworkQualityColor = (quality: NetworkQuality): string => {
    switch (quality) {
      case 'excellent':
        return '#10b981';
      case 'good':
        return '#3b82f6';
      case 'fair':
        return '#f59e0b';
      case 'poor':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getNetworkQualityText = (quality: NetworkQuality): string => {
    switch (quality) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Remote Video Area */}
        <View style={styles.remoteVideoContainer}>
          {callState.isConnecting && !callState.isConnected ? (
            <View style={styles.connectingContainer}>
              <Animated.View style={[styles.connectingPulse, connectingPulseStyle]}>
                <ActivityIndicator size="large" color="#ffffff" />
              </Animated.View>
              <Text style={styles.connectingText}>Connecting...</Text>
            </View>
          ) : callState.error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{callState.error}</Text>
              <Text style={styles.errorSubtext}>Please try again</Text>
            </View>
          ) : callState.remoteStream && isVideoModuleLoaded && RTCView ? (
            <RTCView
              streamURL={callState.remoteStream.toURL()}
              style={styles.remoteVideo}
              objectFit="cover"
            />
          ) : (
            <View style={styles.remoteVideoPlaceholder}>
              {remotePhoto ? (
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{remoteName.charAt(0).toUpperCase()}</Text>
                </View>
              ) : null}
              <Text style={styles.remoteNameText}>{remoteName}</Text>
              <Text style={styles.statusText}>
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
              <View style={styles.localVideoPlaceholder}>
                <Text style={styles.localVideoText}>You</Text>
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
                style={[styles.controlButton, callState.isMuted && styles.controlButtonActive]}
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
                style={[styles.controlButton, styles.endCallButton]}
                onPress={handleEndCall}
                accessibilityLabel="End call"
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>📞</Text>
              </Pressable>
            </Animated.View>

            {/* Camera Toggle Button */}
            <Animated.View style={controlButtonStyle}>
              <Pressable
                style={[styles.controlButton, !callState.isCameraOn && styles.controlButtonActive]}
                onPress={handleToggleCamera}
                accessibilityLabel={callState.isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>{callState.isCameraOn ? '📹' : '📷'}</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>

        {/* Network Quality Indicator */}
        {callState.isConnected && (
          <View style={styles.networkIndicator}>
            <View
              style={[
                styles.networkDot,
                { backgroundColor: getNetworkQualityColor(networkQuality) },
              ]}
            />
            <Text style={styles.networkText}>
              {getNetworkQualityText(networkQuality)} Connection
            </Text>
          </View>
        )}

        {/* Call Duration */}
        {callState.isConnected && (
          <View style={styles.durationContainer}>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  remoteVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  remoteVideo: {
    width: width,
    height: height,
  },
  remoteVideoPlaceholder: {
    width: width,
    height: height * 0.7,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  remoteNameText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 18,
    color: '#cccccc',
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
    color: '#ffffff',
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
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: '#cccccc',
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
    borderColor: '#ffffff',
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
    backgroundColor: '#3a3a3a',
  },
  localVideoText: {
    color: '#ffffff',
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
    backgroundColor: '#4a4a4a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controlButtonActive: {
    backgroundColor: '#ef4444',
  },
  endCallButton: {
    backgroundColor: '#ef4444',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  networkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  durationContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
  },
  durationText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
