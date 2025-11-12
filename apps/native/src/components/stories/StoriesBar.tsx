import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { StoryRing } from './StoryRing';
import StoryViewer from './StoryViewer';
import CreateStoryDialog from './CreateStoryDialog';
import { groupStoriesByUser, filterActiveStories } from '@petspark/shared';
import type { Story } from '@petspark/shared';

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
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  allStories,
  currentUserId,
  currentUserName,
  currentUserPetId,
  currentUserPetName,
  currentUserPetPhoto,
  currentUserAvatar,
  onStoryCreated,
  onStoryUpdate,
}) => {
  const [viewingStories, setViewingStories] = useState<Story[] | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const activeStories = filterActiveStories(allStories);
  const storiesByUser = groupStoriesByUser(activeStories);

  const ownStories = activeStories.filter((s) => s.userId === currentUserId);
  const otherStories = activeStories.filter((s) => s.userId !== currentUserId);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleStoryRingClick = (userId: string) => {
    const userStories = storiesByUser.get(userId);
    if (userStories && userStories.length > 0) {
      setViewingStories(userStories);
    }
  };

  const handleOwnStoryClick = () => {
    if (ownStories.length > 0) {
      setViewingStories(ownStories);
    } else {
      setShowCreateDialog(true);
    }
  };

  if (activeStories.length === 0 && ownStories.length === 0) {
    return (
      <>
        <Animated.View
          style={[
            styles.emptyContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.emptyContent}>
            <View>
              <Text style={styles.emptyTitle}>Share Your Story</Text>
              <Text style={styles.emptySubtitle}>Be the first to share a story!</Text>
            </View>
            <Pressable style={styles.addButton} onPress={() => setShowCreateDialog(true)}>
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </View>
        </Animated.View>

        <CreateStoryDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          userId={currentUserId}
          userName={currentUserName}
          petId={currentUserPetId}
          petName={currentUserPetName}
          petPhoto={currentUserPetPhoto}
          userAvatar={currentUserAvatar}
          onStoryCreated={onStoryCreated}
        />
      </>
    );
  }

  const uniqueUserIds = Array.from(new Set([...otherStories.map((s) => s.userId)]));

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <StoryRing
            stories={ownStories}
            petName={currentUserPetName}
            petPhoto={currentUserPetPhoto}
            isOwn
            onClick={handleOwnStoryClick}
          />

          {uniqueUserIds.map((userId) => {
            const userStories = storiesByUser.get(userId);

            if (!userStories || userStories.length === 0) return null;

            const firstStory = userStories[0];

            return (
              <StoryRing
                key={userId}
                stories={userStories}
                petName={firstStory!.petName}
                petPhoto={firstStory!.petPhoto}
                hasUnviewed={
                  !userStories.some(
                    (s) => Array.isArray(s.views) && s.views.some((v) => v.userId === currentUserId)
                  )
                }
                onClick={() => handleStoryRingClick(userId)}
              />
            );
          })}
        </ScrollView>
      </Animated.View>

      {viewingStories && (
        <StoryViewer
          stories={viewingStories}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar ?? ''}
          onClose={() => setViewingStories(null)}
          onStoryUpdate={onStoryUpdate}
        />
      )}

      <CreateStoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        userId={currentUserId}
        userName={currentUserName}
        petId={currentUserPetId}
        petName={currentUserPetName}
        petPhoto={currentUserPetPhoto}
        userAvatar={currentUserAvatar ?? ''}
        onStoryCreated={onStoryCreated}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollContainer: {
    paddingVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default StoriesBar;

// Re-export types for convenience
export type { Story };
export type StoryItem = Story;
