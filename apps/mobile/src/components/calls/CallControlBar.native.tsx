/**
 * Call Control Bar (Mobile)
 *
 * Control bar for mobile video calls with mute, camera, and hang up
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import * as Haptics from 'expo-haptics';

export interface CallControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

export function CallControlBar({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
}: CallControlBarProps): React.JSX.Element {
  const handleToggleMute = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleMute();
  };

  const handleToggleCamera = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleCamera();
  };

  const handleEndCall = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEndCall();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isMuted && styles.buttonMuted]}
        onPress={handleToggleMute}
        accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
        accessibilityRole="button"
      >
        {isMuted ? (
          <MicOff size={24} color={colors.foreground} />
        ) : (
          <Mic size={24} color={colors.foreground} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isCameraOff && styles.buttonMuted]}
        onPress={handleToggleCamera}
        accessibilityLabel={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        accessibilityRole="button"
      >
        {isCameraOff ? (
          <VideoOff size={24} color={colors.foreground} />
        ) : (
          <Video size={24} color={colors.foreground} />
        )}
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.button, styles.buttonEndCall]}
        onPress={handleEndCall}
        accessibilityLabel="End call"
        accessibilityRole="button"
      >
        <PhoneOff size={24} color={colors.destructiveForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonMuted: {
    backgroundColor: colors.destructive,
    borderColor: colors.destructive,
  },
  buttonEndCall: {
    backgroundColor: colors.destructive,
    borderColor: colors.destructive,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
});

