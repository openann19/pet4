import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { StoryRing } from './StoryRing';

export interface StoryItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  duration?: number;
  createdAt: string;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  hasViewed: boolean;
  stories: StoryItem[];
  createdAt: string;
}

interface StoriesBarProps {
  stories: Story[];
  onStoryPress: (story: Story) => void;
  onAddStory: () => void;
  currentUserId?: string;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  onStoryPress,
  onAddStory,
  currentUserId = 'user-1',
}) => {
  // Separate user's stories from others
  const userStories = stories.filter((s) => s.userId === currentUserId);
  const otherStories = stories.filter((s) => s.userId !== currentUserId);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Add Story Button */}
      <Pressable style={styles.addStoryContainer} onPress={onAddStory}>
        <View style={styles.addStoryRing}>
          <View style={styles.addStoryButton}>
            <Text style={styles.addStoryIcon}>+</Text>
          </View>
        </View>
        <Text style={styles.storyLabel}>Your Story</Text>
      </Pressable>

      {/* User's Stories (if any) */}
      {userStories.map((story) => (
        <Pressable
          key={story.id}
          style={styles.storyContainer}
          onPress={() => onStoryPress(story)}
        >
          <StoryRing
            hasViewed={story.hasViewed}
            userPhoto={story.userPhoto}
            userName={story.userName}
          />
          <Text style={styles.storyLabel}>Your Story</Text>
        </Pressable>
      ))}

      {/* Other Users' Stories */}
      {otherStories.map((story) => (
        <Pressable
          key={story.id}
          style={styles.storyContainer}
          onPress={() => onStoryPress(story)}
        >
          <StoryRing
            hasViewed={story.hasViewed}
            userPhoto={story.userPhoto}
            userName={story.userName}
          />
          <Text style={styles.storyLabel} numberOfLines={1}>
            {story.userName}
          </Text>
        </Pressable>
      ))}

      {/* Empty State */}
      {stories.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Be the first to share a story! 📸
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
  },
  addStoryContainer: {
    alignItems: 'center',
    width: 72,
  },
  addStoryRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  addStoryButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryIcon: {
    fontSize: 32,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  storyContainer: {
    alignItems: 'center',
    width: 72,
  },
  storyLabel: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    marginTop: 4,
    width: 72,
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
