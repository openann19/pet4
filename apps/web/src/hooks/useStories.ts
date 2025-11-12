import { useState, useCallback, useMemo } from 'react';
import { useStorage } from '@/hooks/use-storage';
import type { Story } from '@/lib/stories-types';

interface UseStoriesOptions {
  currentUserId?: string;
  currentPetId?: string;
  filterByUser?: boolean;
}

export function useStories({
  currentUserId: _currentUserId,
  currentPetId,
  filterByUser = false,
}: UseStoriesOptions = {}) {
  const [allStories, setAllStories] = useStorage<Story[]>('pet-stories', []);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const stories = useMemo(() => {
    if (!Array.isArray(allStories)) return [];

    if (filterByUser && currentPetId) {
      return allStories.filter((story) => story.petId === currentPetId);
    }

    return allStories;
  }, [allStories, filterByUser, currentPetId]);

  const userStories = useMemo(() => {
    if (!currentPetId || !Array.isArray(allStories)) return [];
    return allStories.filter((story) => story.petId === currentPetId);
  }, [allStories, currentPetId]);

  const hasStories = useMemo(() => {
    return stories.length > 0;
  }, [stories.length]);

  const addStory = useCallback(
    (story: Story) => {
      setAllStories((prev) => [...(prev || []), story]);
    },
    [setAllStories]
  );

  const updateStory = useCallback(
    (storyId: string, updates: Partial<Story>) => {
      setAllStories((prev) =>
        (prev || []).map((story) => (story.id === storyId ? { ...story, ...updates } : story))
      );
    },
    [setAllStories]
  );

  const deleteStory = useCallback(
    (storyId: string) => {
      setAllStories((prev) => (prev || []).filter((story) => story.id !== storyId));
    },
    [setAllStories]
  );

  const selectStory = useCallback((story: Story | null) => {
    setSelectedStory(story);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedStory(null);
  }, []);

  return {
    stories,
    userStories,
    allStories,
    selectedStory,
    hasStories,
    addStory,
    updateStory,
    deleteStory,
    selectStory,
    clearSelection,
    setStories: setAllStories,
  };
}
