import React, { useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { filterActiveStories } from '@petspark/shared';
import type { Story } from '@petspark/shared';
import { isTruthy, isDefined } from '@/core/guards';

interface StoryRingProps {
  stories: Story[]
  petName: string
  petPhoto: string
  isOwn?: boolean
  hasUnviewed?: boolean
  onClick: () => void
}

export const StoryRing: React.FC<StoryRingProps> = ({
  stories,
  petName,
  petPhoto,
  isOwn = false,
  hasUnviewed = false,
  onClick,
}) => {
  const pulseAnimation = useSharedValue(1);
  const activeStories = filterActiveStories(stories);
  const hasActiveStories = activeStories.length > 0;

  useEffect(() => {
    if (isTruthy(hasUnviewed)) {
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
  }, [hasUnviewed, pulseAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Pressable onPress={onClick} style={styles.container}>
      <Animated.View style={animatedStyle}>
        {isOwn && !hasActiveStories ? (
          <View style={styles.addRing}>
            <View style={styles.addButton}>
              <Text style={styles.addIcon}>+</Text>
            </View>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.ring,
                hasUnviewed ? styles.ringUnviewed : styles.ringViewed,
              ]}
            >
              <Image source={{ uri: petPhoto }} style={styles.avatar} />
            </View>

            {isOwn && hasActiveStories && (
              <View style={styles.addIndicator}>
                <Text style={styles.addIndicatorIcon}>+</Text>
              </View>
            )}
          </>
        )}
      </Animated.View>

      <Text style={styles.label} numberOfLines={1}>
        {isOwn ? 'Your Story' : petName}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 72,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
  },
  addRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  addIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIndicatorIcon: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    marginTop: 4,
    width: 72,
  },
});
