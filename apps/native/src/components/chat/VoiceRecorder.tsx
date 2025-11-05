import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

const MAX_DURATION = 120; // 120 seconds max

interface VoiceRecorderProps {
  onSendVoice: (uri: string, duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSendVoice,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const waveScale = useSharedValue(1);

  useEffect(() => {
    if (isRecording && !isPaused) {
      // Animate waveform
      waveScale.value = withRepeat(
        withTiming(1.5, { duration: 500 }),
        -1,
        true
      );

      // Timer
      const interval = setInterval(() => {
        setDuration((prev) => {
          if (prev >= MAX_DURATION) {
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
        cancelAnimation(waveScale);
      };
    } else {
      cancelAnimation(waveScale);
      waveScale.value = 1;
    }
  }, [isRecording, isPaused]);

  const handleStartRecording = async () => {
    // Request permissions
    try {
      setIsRecording(true);
      setDuration(0);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    if (duration > 0) {
      // Generate a mock URI for the recording
      const mockUri = `voice_${Date.now()}.m4a`;
      onSendVoice(mockUri, duration);
    }
    setDuration(0);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    setDuration(0);
    onCancel();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const animatedWaveStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: waveScale.value }],
  }));

  if (!isRecording) {
    return (
      <Pressable
        style={styles.recordButton}
        onPress={handleStartRecording}
        onLongPress={handleStartRecording}
      >
        <Text style={styles.recordIcon}>🎤</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.recordingContainer}>
      {/* Waveform Animation */}
      <View style={styles.waveformContainer}>
        {[...Array(5)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveBar,
              animatedWaveStyle,
              { height: 10 + index * 8 },
            ]}
          />
        ))}
      </View>

      {/* Duration */}
      <Text style={styles.durationText}>{formatDuration(duration)}</Text>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          style={styles.cancelButton}
          onPress={handleCancelRecording}
        >
          <Text style={styles.cancelIcon}>✕</Text>
        </Pressable>

        <Pressable
          style={styles.pauseButton}
          onPress={() => setIsPaused(!isPaused)}
        >
          <Text style={styles.pauseIcon}>{isPaused ? '▶️' : '⏸️'}</Text>
        </Pressable>

        <Pressable
          style={styles.sendButton}
          onPress={handleStopRecording}
        >
          <Text style={styles.sendIcon}>📤</Text>
        </Pressable>
      </View>

      {/* Duration Warning */}
      {duration >= MAX_DURATION - 10 && (
        <Text style={styles.warningText}>
          {MAX_DURATION - duration}s remaining
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  recordButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIcon: {
    fontSize: 24,
  },
  recordingContainer: {
    flex: 1,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    width: 4,
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelIcon: {
    fontSize: 18,
    color: '#ef4444',
  },
  pauseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseIcon: {
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 16,
  },
  warningText: {
    position: 'absolute',
    top: -20,
    right: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#991b1b',
  },
});
