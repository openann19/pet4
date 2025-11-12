import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { Story, StoryItem } from '../../components/stories/StoriesBar';
import { createLogger } from '../../utils/logger';

const logger = createLogger('useStories');

const STORAGE_KEY_STORIES = '@stories';
const STORY_EXPIRATION_HOURS = 24;

export const useStories = (currentUserId: string = 'user-1') => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const saveStories = useCallback(async (newStories: Story[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_STORIES, JSON.stringify(newStories));
      setStories(newStories);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save stories', err, { context: 'saveStories' });
      throw error;
    }
  }, []);

  const loadStories = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_STORIES);
      if (saved) {
        const parsedStories: Story[] = JSON.parse(saved);
        // Filter out expired stories
        const validStories = parsedStories.filter((story) => {
          const createdAt = new Date(story.createdAt);
          const now = new Date();
          const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          return hoursDiff < STORY_EXPIRATION_HOURS;
        });
        setStories(validStories);

        // Save filtered stories back if any were removed
        if (validStories.length !== parsedStories.length) {
          await saveStories(validStories);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load stories', err, { context: 'loadStories' });
    } finally {
      setIsLoading(false);
    }
  }, [saveStories]);

  useEffect(() => {
    void loadStories();
  }, [loadStories]);

  const createStory = useCallback(
    async (
      imageUri: string,
      userName: string,
      userPhoto?: string,
      _text?: string,
      _privacy: 'public' | 'friends' | 'private' = 'public'
    ) => {
      try {
        const newStoryItem: StoryItem = {
          id: `item_${Date.now()}`,
          uri: imageUri,
          type: 'image',
          duration: 5000,
          createdAt: new Date().toISOString(),
        };

        // Check if user already has a story from today
        const userStoryIndex = stories.findIndex((s) => s.userId === currentUserId);

        if (userStoryIndex !== -1) {
          // Add to existing story
          const updatedStories = [...stories];
          const existingStory = updatedStories[userStoryIndex];
          if (existingStory) {
            existingStory.stories.push(newStoryItem);
            existingStory.hasViewed = false; // Reset viewed status
            await saveStories(updatedStories);
          }
        } else {
          // Create new story
          const newStory: Story = {
            id: `story_${Date.now()}`,
            userId: currentUserId,
            userName,
            ...(userPhoto !== undefined ? { userPhoto } : {}),
            hasViewed: false,
            stories: [newStoryItem],
            createdAt: new Date().toISOString(),
          };
          await saveStories([newStory, ...stories]);
        }

        return { success: true };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to create story', err, { context: 'createStory', imageUri, userName });
        return { success: false, error: 'Failed to create story' };
      }
    },
    [currentUserId, saveStories, stories]
  );

  const markStoryAsViewed = useCallback(
    async (storyId: string) => {
      try {
        const updatedStories = stories.map((story) =>
          story.id === storyId ? { ...story, hasViewed: true } : story
        );
        await saveStories(updatedStories);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to mark story as viewed', err, {
          context: 'markStoryAsViewed',
          storyId,
        });
      }
    },
    [saveStories, stories]
  );

  const deleteStory = useCallback(
    async (storyId: string) => {
      try {
        const updatedStories = stories.filter((story) => story.id !== storyId);
        await saveStories(updatedStories);
        return { success: true };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to delete story', err, { context: 'deleteStory', storyId });
        return { success: false, error: 'Failed to delete story' };
      }
    },
    [saveStories, stories]
  );

  const deleteStoryItem = useCallback(
    async (storyId: string, itemId: string) => {
      try {
        const updatedStories = stories
          .map((story) => {
            if (story.id === storyId) {
              const filteredItems = story.stories.filter((item) => item.id !== itemId);
              // If no items left, we'll filter out the entire story later
              return { ...story, stories: filteredItems };
            }
            return story;
          })
          .filter((story) => story.stories.length > 0);

        await saveStories(updatedStories);
        return { success: true };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to delete story item', err, {
          context: 'deleteStoryItem',
          storyId,
          itemId,
        });
        return { success: false, error: 'Failed to delete story item' };
      }
    },
    [saveStories, stories]
  );

  const getUnviewedStoriesCount = useCallback(() => {
    return stories.filter((story) => !story.hasViewed).length;
  }, [stories]);

  const hasUnviewedStories = getUnviewedStoriesCount() > 0;

  return {
    stories,
    isLoading,
    hasUnviewedStories,
    unviewedCount: getUnviewedStoriesCount(),
    createStory,
    markStoryAsViewed,
    deleteStory,
    deleteStoryItem,
    refreshStories: loadStories,
  };
};
