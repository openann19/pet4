/**
 * LiveStreamScreen Component
 *
 * Mobile screen for viewing and hosting live streams
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RTCView } from 'react-native-webrtc';
import { Animated, useAnimatedStyle, withSpring } from '@petspark/motion';
import * as Haptics from 'expo-haptics';
import { colors } from '@mobile/theme/colors';
import { useWebRTC } from '@mobile/hooks/call/use-web-rtc';
import type { MediaStream as WebRTCMediaStream } from '@/types/webrtc';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LiveStreamScreenProps {
  streamId?: string;
  isHost?: boolean;
  onEndStream?: () => void;
}

export function LiveStreamScreen({
  streamId,
  isHost = false,
  onEndStream,
}: LiveStreamScreenProps): React.JSX.Element {
  const [viewerCount, setViewerCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [localStream, setLocalStream] = useState<WebRTCMediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<WebRTCMediaStream | null>(null);

  // Note: useWebRTC requires callId and remoteUserId - these should come from props or navigation params
  // For now, using placeholder values - this should be fixed when integrating with actual call system
  const { callState, handleSignalingData } = useWebRTC({
    callId: streamId || 'live-stream',
    remoteUserId: 'host', // Placeholder - should be actual host user ID
    isCaller: !isHost,
    onRemoteStream: (stream) => {
      setRemoteStream(stream);
    },
    onConnectionStateChange: (state) => {
      // Handle connection state changes
      if (state === 'connected') {
        setIsLive(true);
      } else if (state === 'disconnected' || state === 'failed') {
        setIsLive(false);
      }
    },
  });

  // Update remote stream from callState
  useEffect(() => {
    if (callState.remoteStream) {
      setRemoteStream(callState.remoteStream);
    }
    if (callState.localStream) {
      setLocalStream(callState.localStream);
    }
  }, [callState.remoteStream, callState.localStream]);

  useEffect(() => {
    if (isHost) {
      void startStreaming();
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (callState.localStream) {
        callState.localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isHost, localStream, callState.localStream]);

  const startStreaming = async (): Promise<void> => {
    try {
      // On mobile, we need to use react-native-webrtc's mediaDevices
      // This is handled by the useWebRTC hook internally
      // For now, we'll rely on the hook to manage the stream
      setIsLive(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to start streaming:', error);
    }
  };

  const endStream = (): void => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setIsLive(false);
    onEndStream?.();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.videoContainer}>
        {isHost && localStream ? (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.video}
            objectFit="cover"
            mirror={true}
          />
        ) : remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.video}
            objectFit="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No stream available</Text>
          </View>
        )}

        <View style={styles.overlay}>
          <View style={styles.header}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.viewerCount}>{viewerCount} viewers</Text>
          </View>

          {isHost && (
            <TouchableOpacity style={styles.endButton} onPress={endStream}>
              <Text style={styles.endButtonText}>End Stream</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewerCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
