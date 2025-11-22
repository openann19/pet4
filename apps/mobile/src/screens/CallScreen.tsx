/**
 * Call Screen
 *
 * Fullscreen call interface for mobile video calls
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RTCView } from 'react-native-webrtc';
import { CallControlBar } from '@/components/calls/CallControlBar.native';
import { CallParticipantTile } from '@/components/calls/CallParticipantTile.native';
import { useCallSession } from '@/hooks/use-call-session.native';
import { colors } from '@/theme/colors';
import { getTypographyStyle } from '@/theme/typography';
import * as Haptics from 'expo-haptics';
import type { CallSession } from '@petspark/core';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface CallScreenProps {
  session: CallSession;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

function formatCallDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function CallScreen({
  session,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
}: CallScreenProps): React.JSX.Element {
  const durationRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (session.status === 'in-call') {
      intervalRef.current = setInterval(() => {
        durationRef.current += 1;
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session.status]);

  const handleEndCall = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEndCall();
  };

  const handleToggleMute = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleMute();
  };

  const handleToggleCamera = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleCamera();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Remote video - fullscreen */}
      <View style={styles.remoteVideoContainer}>
        {remoteStream && !isCameraOff ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
            mirror={false}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={[getTypographyStyle('h2'), styles.placeholderText]}>
              {session.remoteParticipant?.displayName ?? 'Call'}
            </Text>
            {session.status === 'in-call' && (
              <Text style={[getTypographyStyle('caption'), styles.durationText]}>
                {formatCallDuration(durationRef.current)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Local video - picture-in-picture */}
      {localStream && (
        <View style={styles.localVideoContainer}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={true}
            zOrder={1}
          />
        </View>
      )}

      {/* Header overlay */}
      <View style={styles.headerOverlay}>
        <Text style={[getTypographyStyle('h3'), styles.headerText]}>
          {session.remoteParticipant?.displayName ?? 'Call'}
        </Text>
        {session.status === 'in-call' && (
          <Text style={[getTypographyStyle('caption'), styles.statusText]}>
            {formatCallDuration(durationRef.current)}
          </Text>
        )}
        <Text style={[getTypographyStyle('caption'), styles.statusText]}>
          {session.status === 'connecting' && 'Connecting...'}
          {session.status === 'in-call' && 'Connected'}
          {session.status === 'ringing' && 'Ringing...'}
        </Text>
      </View>

      {/* Control bar */}
      <CallControlBar
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onEndCall={handleEndCall}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  remoteVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  placeholderText: {
    color: colors.foreground,
    marginBottom: 8,
  },
  durationText: {
    color: colors.mutedForeground,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerText: {
    color: colors.foreground,
    marginBottom: 4,
  },
  statusText: {
    color: colors.mutedForeground,
  },
});

