/**
 * StoriesBar.native Component
 *
 * Mobile stories bar with Reanimated animations
 */

import React, { useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import type { Story } from '@petspark/core';
import { groupStoriesByUser, filterActiveStories } from '@petspark/shared';
import { colors } from '@mobile/theme/colors';
import { useEntryAnimation } from '@mobile/effects/reanimated/use-entry-animation';
import { useBounceOnTap } from '@mobile/effects/reanimated/use-bounce-on-tap';
import * as Haptics from 'expo-haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface StoriesBarProps {
  allStories: Story[];
  currentUserId: string;
  currentUserName: string;
  currentUserPetId: string;
  currentUserPetName: string;
  currentUserPetPhoto: string;
  currentUserAvatar?: string;
  onStoryCreated: (story: Story) => void;
  onStoryUpdate: (story: Story) => void;
  onStoryRingPress?: (stories: Story[]) => void;
}

interface StoryRingProps {
  _stories: Story[];
  petName: string;
  petPhoto: string;
  isOwn?: boolean;
  hasUnviewed?: boolean;
  onPress: () => void;
  index: number;
}

function StoryRing({ _stories, petName, petPhoto, isOwn, hasUnviewed, onPress, index }: StoryRingProps) {
  const entry = useEntryAnimation({ delay: index * 50 });
  const bounce = useBounceOnTap({ scale: 0.95 });
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * entry.scale.value }],
    opacity: opacity.value * entry.opacity.value,
  }));

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bounce.handlePress();
    onPress();
  }, [bounce, onPress]);

  return (
    <AnimatedTouchable
      style={[styles.storyRing, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={[styles.ringContainer, hasUnviewed && styles.ringUnviewed]}>
        <Image source={{ uri: petPhoto }} style={styles.ringImage} />
        {isOwn && (
          <View style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </View>
        )}
      </View>
      <Text style={styles.petName} numberOfLines={1}>
        {petName}
      </Text>
    </AnimatedTouchable>
  );
}

export function StoriesBar({
  allStories,
  currentUserId,
  currentUserPetName,
  currentUserPetPhoto,
  onStoryRingPress,
}: StoriesBarProps): React.JSX.Element {
  const activeStories = useMemo(() => filterActiveStories(allStories as unknown as import('@petspark/shared').Story[]), [allStories]);
  const storiesByUser = useMemo(() => groupStoriesByUser(activeStories), [activeStories]);

  const ownStories = useMemo(
    () => activeStories.filter((s) => s.userId === currentUserId),
    [activeStories, currentUserId]
  );
  const otherStories = useMemo(
    () => activeStories.filter((s) => s.userId !== currentUserId),
    [activeStories, currentUserId]
  );

  const uniqueUserIds = useMemo(
    () => Array.from(new Set([...otherStories.map((s) => s.userId)])),
    [otherStories]
  );

  const handleStoryRingClick = useCallback(
    (userId: string) => {
      const userStories = storiesByUser.get(userId);
      if (userStories && userStories.length > 0) {
        onStoryRingPress?.(userStories as unknown as Story[]);
      }
    },
    [storiesByUser, onStoryRingPress]
  );

  const handleOwnStoryClick = useCallback(() => {
    if (ownStories.length > 0) {
      onStoryRingPress?.(ownStories as unknown as Story[]);
    } else {
      // Open create story dialog
    }
  }, [ownStories, onStoryRingPress]);

  if (activeStories.length === 0 && ownStories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Share Your Story</Text>
        <Text style={styles.emptySubtitle}>Be the first to share a story!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <StoryRing
          _stories={ownStories as unknown as Story[]}
          petName={currentUserPetName}
          petPhoto={currentUserPetPhoto}
          isOwn
          onPress={handleOwnStoryClick}
          index={0}
        />

        {uniqueUserIds.map((userId, idx) => {
          const userStories = storiesByUser.get(userId);
          if (!userStories || userStories.length === 0) return null;

          const firstStory = userStories[0];
          const hasUnviewed = !userStories.some(
            (s) =>
              Array.isArray(s.views) && s.views.some((v) => v.userId === currentUserId)
          );

          if (!firstStory) return null;
          return (
            <StoryRing
              key={userId}
              _stories={userStories as unknown as Story[]}
              petName={firstStory.petName ?? 'Pet'}
              petPhoto={firstStory.petPhoto ?? ''}
              hasUnviewed={hasUnviewed}
              onPress={() => handleStoryRingClick(userId)}
              index={idx + 1}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  storyRing: {
    alignItems: 'center',
    width: 70,
  },
  ringContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 2,
    marginBottom: 4,
  },
  ringUnviewed: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  ringImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  petName: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    maxWidth: 70,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
