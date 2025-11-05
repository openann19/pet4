import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Highlight } from '../../components/stories/highlights/StoryHighlights';

const STORAGE_KEY = '@story_highlights';

export const useHighlights = (userId: string) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHighlights();
  }, [userId]);

  const loadHighlights = async () => {
    try {
      const key = `${STORAGE_KEY}_${userId}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        const parsedHighlights: Highlight[] = JSON.parse(saved);
        setHighlights(parsedHighlights);
      }
    } catch (error) {
      console.error('Failed to load highlights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveHighlights = async (newHighlights: Highlight[]) => {
    try {
      const key = `${STORAGE_KEY}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(newHighlights));
      setHighlights(newHighlights);
    } catch (error) {
      console.error('Failed to save highlights:', error);
      throw error;
    }
  };

  const createHighlight = useCallback(
    async (title: string, storyIds: string[], coverImage: string) => {
      try {
        const newHighlight: Highlight = {
          id: `highlight_${Date.now()}`,
          title,
          coverImage,
          storyIds,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedHighlights = [...highlights, newHighlight];
        await saveHighlights(updatedHighlights);

        return { success: true, highlight: newHighlight };
      } catch (error) {
        console.error('Failed to create highlight:', error);
        return { success: false, error: 'Failed to create highlight' };
      }
    },
    [highlights, userId]
  );

  const updateHighlight = useCallback(
    async (highlightId: string, updates: Partial<Highlight>) => {
      try {
        const updatedHighlights = highlights.map((h) =>
          h.id === highlightId
            ? { ...h, ...updates, updatedAt: new Date().toISOString() }
            : h
        );
        await saveHighlights(updatedHighlights);

        return { success: true };
      } catch (error) {
        console.error('Failed to update highlight:', error);
        return { success: false, error: 'Failed to update highlight' };
      }
    },
    [highlights]
  );

  const deleteHighlight = useCallback(
    async (highlightId: string) => {
      try {
        const updatedHighlights = highlights.filter((h) => h.id !== highlightId);
        await saveHighlights(updatedHighlights);

        return { success: true };
      } catch (error) {
        console.error('Failed to delete highlight:', error);
        return { success: false, error: 'Failed to delete highlight' };
      }
    },
    [highlights]
  );

  const addStoriesToHighlight = useCallback(
    async (highlightId: string, storyIds: string[]) => {
      try {
        const updatedHighlights = highlights.map((h) => {
          if (h.id === highlightId) {
            const uniqueStoryIds = Array.from(
              new Set([...h.storyIds, ...storyIds])
            );
            return {
              ...h,
              storyIds: uniqueStoryIds,
              updatedAt: new Date().toISOString(),
            };
          }
          return h;
        });
        await saveHighlights(updatedHighlights);

        return { success: true };
      } catch (error) {
        console.error('Failed to add stories to highlight:', error);
        return { success: false, error: 'Failed to add stories' };
      }
    },
    [highlights]
  );

  const removeStoryFromHighlight = useCallback(
    async (highlightId: string, storyId: string) => {
      try {
        const updatedHighlights = highlights.map((h) => {
          if (h.id === highlightId) {
            return {
              ...h,
              storyIds: h.storyIds.filter((id) => id !== storyId),
              updatedAt: new Date().toISOString(),
            };
          }
          return h;
        });
        await saveHighlights(updatedHighlights);

        return { success: true };
      } catch (error) {
        console.error('Failed to remove story from highlight:', error);
        return { success: false, error: 'Failed to remove story' };
      }
    },
    [highlights]
  );

  return {
    highlights,
    isLoading,
    createHighlight,
    updateHighlight,
    deleteHighlight,
    addStoriesToHighlight,
    removeStoryFromHighlight,
    refreshHighlights: loadHighlights,
  };
};
