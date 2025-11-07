import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { Highlight } from '../../components/stories/highlights/StoryHighlights';
import { createLogger } from '../../utils/logger';
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('useHighlights');

const STORAGE_KEY = '@story_highlights';

export const useHighlights = (userId: string) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHighlights();
  }, [userId]);

  const loadHighlights = async () => {
    try {
      const key = `${String(STORAGE_KEY ?? '')}_${String(userId ?? '')}`;
      const saved = await AsyncStorage.getItem(key);
      if (isTruthy(saved)) {
        const parsedHighlights: Highlight[] = JSON.parse(saved);
        setHighlights(parsedHighlights);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load highlights', err, { context: 'loadHighlights', userId });
    } finally {
      setIsLoading(false);
    }
  };

  const saveHighlights = async (newHighlights: Highlight[]) => {
    try {
      const key = `${String(STORAGE_KEY ?? '')}_${String(userId ?? '')}`;
      await AsyncStorage.setItem(key, JSON.stringify(newHighlights));
      setHighlights(newHighlights);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save highlights', err, { context: 'saveHighlights', userId });
      throw error;
    }
  };

  const createHighlight = useCallback(
    async (title: string, storyIds: string[], coverImage: string) => {
      try {
        const newHighlight: Highlight = {
          id: `highlight_${String(Date.now() ?? '')}`,
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
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to create highlight', err, { context: 'createHighlight', userId, title });
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
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to update highlight', err, { context: 'updateHighlight', highlightId });
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
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to delete highlight', err, { context: 'deleteHighlight', highlightId });
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
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to add stories to highlight', err, { context: 'addStoriesToHighlight', highlightId, storyIds });
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
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to remove story from highlight', err, { context: 'removeStoryFromHighlight', highlightId, storyId });
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
