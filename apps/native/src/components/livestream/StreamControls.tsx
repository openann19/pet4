import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface StreamControlsProps {
  onEndStream: () => void;
  onShowViewers: () => void;
}

export const StreamControls: React.FC<StreamControlsProps> = ({ onEndStream, onShowViewers }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const handleEndStream = () => {
    Alert.alert('End Live Stream', 'Are you sure you want to end this live stream?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Stream',
        style: 'destructive',
        onPress: onEndStream,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.controlButton} onPress={() => setIsMuted(!isMuted)}>
        <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🔊'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={() => setIsCameraOff(!isCameraOff)}>
        <Text style={styles.controlIcon}>{isCameraOff ? '📷' : '📹'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onShowViewers}>
        <Text style={styles.controlIcon}>👥</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.controlButton, styles.endButton]} onPress={handleEndStream}>
        <Text style={styles.endIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 24,
  },
  endButton: {
    backgroundColor: '#FF3B30',
  },
  endIcon: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '600',
  },
});
