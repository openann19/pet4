import React, { useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface StoryRingProps {
  hasViewed: boolean;
  userPhoto?: string;
  userName: string;
}

export const StoryRing: React.FC<StoryRingProps> = ({
  hasViewed,
  userPhoto,
  userName,
}) => {
  const pulseAnimation = useSharedValue(1);

  useEffect(() => {
    if (!hasViewed) {
      // Pulse animation for unviewed stories
      pulseAnimation.value = withRepeat(
        withTiming(1.05, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      pulseAnimation.value = 1;
    }
  }, [hasViewed, pulseAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View
        style={[
          styles.ring,
          hasViewed ? styles.ringViewed : styles.ringUnviewed,
        ]}
      >
        {userPhoto ? (
          <Image source={{ uri: userPhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initial}>
              {getInitial(userName)}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 72,
    height: 72,
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringUnviewed: {
    borderWidth: 3,
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  ringViewed: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#f3f4f6',
  },
  avatarPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
