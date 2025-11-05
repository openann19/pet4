import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Story, StoryItem } from '../../components/stories/StoriesBar';

const STORAGE_KEY_STORIES = '@stories';
const STORY_EXPIRATION_HOURS = 24;

export const useStories = (currentUserId: string = 'user-1') => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
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
      console.error('Failed to load stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStories = async (newStories: Story[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_STORIES, JSON.stringify(newStories));
      setStories(newStories);
    } catch (error) {
      console.error('Failed to save stories:', error);
      throw error;
    }
  };

  const createStory = useCallback(
    async (
      imageUri: string,
      userName: string,
      userPhoto?: string,
      text?: string,
      privacy: 'public' | 'friends' | 'private' = 'public'
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
          updatedStories[userStoryIndex].stories.push(newStoryItem);
          updatedStories[userStoryIndex].hasViewed = false; // Reset viewed status
          await saveStories(updatedStories);
        } else {
          // Create new story
          const newStory: Story = {
            id: `story_${Date.now()}`,
            userId: currentUserId,
            userName,
            userPhoto,
            hasViewed: false,
            stories: [newStoryItem],
            createdAt: new Date().toISOString(),
          };
          await saveStories([newStory, ...stories]);
        }

        return { success: true };
      } catch (error) {
        console.error('Failed to create story:', error);
        return { success: false, error: 'Failed to create story' };
      }
    },
    [stories, currentUserId]
  );

  const markStoryAsViewed = useCallback(
    async (storyId: string) => {
      try {
        const updatedStories = stories.map((story) =>
          story.id === storyId ? { ...story, hasViewed: true } : story
        );
        await saveStories(updatedStories);
      } catch (error) {
        console.error('Failed to mark story as viewed:', error);
      }
    },
    [stories]
  );

  const deleteStory = useCallback(
    async (storyId: string) => {
      try {
        const updatedStories = stories.filter((story) => story.id !== storyId);
        await saveStories(updatedStories);
        return { success: true };
      } catch (error) {
        console.error('Failed to delete story:', error);
        return { success: false, error: 'Failed to delete story' };
      }
    },
    [stories]
  );

  const deleteStoryItem = useCallback(
    async (storyId: string, itemId: string) => {
      try {
        const updatedStories = stories.map((story) => {
          if (story.id === storyId) {
            const filteredItems = story.stories.filter((item) => item.id !== itemId);
            // If no items left, we'll filter out the entire story later
            return { ...story, stories: filteredItems };
          }
          return story;
        }).filter((story) => story.stories.length > 0);
        
        await saveStories(updatedStories);
        return { success: true };
      } catch (error) {
        console.error('Failed to delete story item:', error);
        return { success: false, error: 'Failed to delete story item' };
      }
    },
    [stories]
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
