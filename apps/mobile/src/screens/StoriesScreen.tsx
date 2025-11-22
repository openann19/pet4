/**
 * StoriesScreen Component
 *
 * Mobile screen for viewing and creating stories
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoriesBar } from '@mobile/components/stories/StoriesBar.native';
import { StoryViewer } from '@mobile/components/stories/StoryViewer.native';
import type { Story } from '@petspark/core';
import { colors } from '@mobile/theme/colors';
import { useUserStore } from '@mobile/store/user-store';

export function StoriesScreen(): React.JSX.Element {
  const [viewingStories, setViewingStories] = useState<Story[] | null>(null);
  const user = useUserStore((state) => state.user);

  // Mock stories data - in real app, fetch from API
  const [allStories, setAllStories] = useState<Story[]>([]);

  const handleStoryRingPress = useCallback((stories: Story[]) => {
    setViewingStories(stories);
  }, []);

  const handleStoryCreated = useCallback((story: Story) => {
    setAllStories((prev) => [story, ...prev]);
  }, []);

  const handleStoryUpdate = useCallback((story: Story) => {
    setAllStories((prev) =>
      prev.map((s) => (s.id === story.id ? story : s))
    );
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewingStories(null);
  }, []);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          {/* Empty state */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <StoriesBar
          allStories={allStories}
          currentUserId={user.id}
          currentUserName={user.name ?? 'User'}
          currentUserPetId="pet-1"
          currentUserPetName="My Pet"
          currentUserPetPhoto="https://via.placeholder.com/150"
          onStoryCreated={handleStoryCreated}
          onStoryUpdate={handleStoryUpdate}
          onStoryRingPress={handleStoryRingPress}
        />
      </ScrollView>

      {viewingStories && (
        <StoryViewer
          stories={viewingStories}
          currentUserId={user.id}
          currentUserName={user.name ?? 'User'}
          onClose={handleCloseViewer}
          onStoryUpdate={handleStoryUpdate}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

