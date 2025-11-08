import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface CallInterfaceProps {
  callId: string;
  remoteUserId: string;
  remoteName: string;
  remotePhoto?: string;
  onEndCall: () => void;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({
  callId,
  remoteUserId,
  remoteName,
  remotePhoto,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callStatus]);

  // Simulate connection (in real implementation, this would use WebRTC)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallStatus('connected');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    // NOTE: WebRTC mute implementation pending - currently updates UI state only
  }, []);

  const toggleCamera = useCallback(() => {
    setIsCameraOn((prev) => !prev);
    // NOTE: WebRTC camera toggle implementation pending - currently updates UI state only
  }, []);

  const handleEndCall = useCallback(() => {
    setCallStatus('ended');
    onEndCall();
  }, [onEndCall]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Remote Video Area */}
      <View style={styles.remoteVideoContainer}>
        <View style={styles.remoteVideoPlaceholder}>
          <Text style={styles.remoteNameText}>{remoteName}</Text>
          <Text style={styles.statusText}>
            {callStatus === 'connecting' ? 'Connecting...' : formatDuration(duration)}
          </Text>
        </View>
      </View>

      {/* Local Video (Picture-in-Picture) */}
      <View style={styles.localVideoContainer}>
        <View style={styles.localVideoPlaceholder}>
          <Text style={styles.localVideoText}>You</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controls}>
          {/* Mute Button */}
          <Pressable
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Text style={styles.controlButtonText}>{isMuted ? '🔇' : '🎤'}</Text>
          </Pressable>

          {/* End Call Button */}
          <Pressable style={[styles.controlButton, styles.endCallButton]} onPress={handleEndCall}>
            <Text style={styles.controlButtonText}>📞</Text>
          </Pressable>

          {/* Camera Toggle Button */}
          <Pressable
            style={[styles.controlButton, !isCameraOn && styles.controlButtonActive]}
            onPress={toggleCamera}
          >
            <Text style={styles.controlButtonText}>{isCameraOn ? '📹' : '📷'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Network Quality Indicator */}
      <View style={styles.networkIndicator}>
        <View style={[styles.networkDot, styles.networkGood]} />
        <Text style={styles.networkText}>Good Connection</Text>
      </View>
    </SafeAreaView>
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
  },
  remoteVideoPlaceholder: {
    width: width,
    height: height * 0.7,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  localVideoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  networkGood: {
    backgroundColor: '#10b981',
  },
  networkText: {
    color: '#ffffff',
    fontSize: 12,
  },
});
