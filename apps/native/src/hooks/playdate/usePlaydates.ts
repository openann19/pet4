import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { Playdate } from '../../components/playdate/PlaydateCard';
import type { PlaydateData } from '../../components/playdate/PlaydateScheduler';
import { createLogger } from '../../utils/logger';
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('usePlaydates');

const STORAGE_KEY = '@playdates';

export const usePlaydates = (currentUserId: string = 'my-user-id') => {
  const [playdates, setPlaydates] = useState<Playdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlaydates();
  }, []);

  const loadPlaydates = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (isTruthy(saved)) {
        const parsedPlaydates: Playdate[] = JSON.parse(saved);
        setPlaydates(parsedPlaydates);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load playdates', err, { context: 'loadPlaydates' });
    } finally {
      setIsLoading(false);
    }
  };

  const savePlaydates = async (newPlaydates: Playdate[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPlaydates));
      setPlaydates(newPlaydates);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save playdates', err, { context: 'savePlaydates' });
      throw error;
    }
  };

  const createPlaydate = useCallback(
    async (data: PlaydateData) => {
      try {
        const newPlaydate: Playdate = {
          id: `playdate_${String(Date.now() ?? '')}`,
          title: data.title,
          date: data.date.toISOString(),
          time: data.time.toISOString(),
          location: data.location,
          duration: data.duration,
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          attendees: data.attendees,
          status: 'pending',
          createdBy: currentUserId,
        };

        const updatedPlaydates = [...playdates, newPlaydate];
        await savePlaydates(updatedPlaydates);

        return { success: true, playdate: newPlaydate };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to create playdate', err, { context: 'createPlaydate', userId: currentUserId });
        return { success: false, error: 'Failed to create playdate' };
      }
    },
    [playdates, currentUserId]
  );

  const updatePlaydate = useCallback(
    async (playdateId: string, updates: Partial<Playdate>) => {
      try {
        const updatedPlaydates = playdates.map((p) =>
          p.id === playdateId ? { ...p, ...updates } : p
        );
        await savePlaydates(updatedPlaydates);

        return { success: true };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to update playdate', err, { context: 'updatePlaydate', playdateId });
        return { success: false, error: 'Failed to update playdate' };
      }
    },
    [playdates]
  );

  const deletePlaydate = useCallback(
    async (playdateId: string) => {
      try {
        const updatedPlaydates = playdates.filter((p) => p.id !== playdateId);
        await savePlaydates(updatedPlaydates);

        return { success: true };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to delete playdate', err, { context: 'deletePlaydate', playdateId });
        return { success: false, error: 'Failed to delete playdate' };
      }
    },
    [playdates]
  );

  const updateRSVP = useCallback(
    async (playdateId: string, response: 'yes' | 'no' | 'maybe') => {
      try {
        const updatedPlaydates = playdates.map((p) => {
          if (p.id === playdateId) {
            // Update RSVP
            const updated = { ...p, currentUserRSVP: response };
            
            // If user responded 'yes', change status to confirmed
            if (response === 'yes') {
              updated.status = 'confirmed';
            }
            
            return updated;
          }
          return p;
        });

        await savePlaydates(updatedPlaydates);

        return { success: true };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to update RSVP', err, { context: 'updateRSVP', playdateId, response });
        return { success: false, error: 'Failed to update RSVP' };
      }
    },
    [playdates]
  );

  const cancelPlaydate = useCallback(
    async (playdateId: string) => {
      return updatePlaydate(playdateId, { status: 'cancelled' });
    },
    [updatePlaydate]
  );

  const getUpcomingPlaydates = useCallback(() => {
    const now = new Date();
    return playdates.filter((p) => new Date(p.date) >= now);
  }, [playdates]);

  const getPastPlaydates = useCallback(() => {
    const now = new Date();
    return playdates.filter((p) => new Date(p.date) < now);
  }, [playdates]);

  const getPlaydatesByStatus = useCallback(
    (status: 'pending' | 'confirmed' | 'cancelled') => {
      return playdates.filter((p) => p.status === status);
    },
    [playdates]
  );

  return {
    playdates,
    isLoading,
    createPlaydate,
    updatePlaydate,
    deletePlaydate,
    updateRSVP,
    cancelPlaydate,
    getUpcomingPlaydates,
    getPastPlaydates,
    getPlaydatesByStatus,
    refreshPlaydates: loadPlaydates,
  };
};
