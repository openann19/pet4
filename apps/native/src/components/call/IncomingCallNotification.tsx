import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Caller {
  id: string;
  name: string;
  photo?: string;
}

interface IncomingCallNotificationProps {
  visible: boolean;
  caller: Caller;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  visible,
  caller,
  onAccept,
  onDecline,
}) => {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      pulseScale.value = withRepeat(
        withTiming(1.1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [visible, pulseScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Caller Photo */}
          <Animated.View style={[styles.photoContainer, animatedStyle]}>
            {caller.photo ? (
              <Image source={{ uri: caller.photo }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.photoPlaceholderText}>
                  {caller.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Caller Name */}
          <Text style={styles.callerName}>{caller.name}</Text>
          <Text style={styles.callType}>Incoming Video Call</Text>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Decline Button */}
            <Pressable style={[styles.actionButton, styles.declineButton]} onPress={onDecline}>
              <Text style={styles.buttonIcon}>✕</Text>
              <Text style={styles.buttonLabel}>Decline</Text>
            </Pressable>

            {/* Accept Button */}
            <Pressable style={[styles.actionButton, styles.acceptButton]} onPress={onAccept}>
              <Text style={styles.buttonIcon}>📹</Text>
              <Text style={styles.buttonLabel}>Accept</Text>
            </Pressable>
          </View>

          {/* Animated Rings */}
          <View style={styles.ringsContainer}>
            <View style={[styles.ring, styles.ring1]} />
            <View style={[styles.ring, styles.ring2]} />
            <View style={[styles.ring, styles.ring3]} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  photoContainer: {
    marginBottom: 32,
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  photoPlaceholder: {
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  callerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  callType: {
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 48,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
  },
  actionButton: {
    width: 120,
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: '#ef4444',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 4,
  },
  ringsContainer: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: [{ translateX: -70 }],
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
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
});
