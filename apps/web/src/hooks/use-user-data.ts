/**
 * React Query Hooks for User Data
 *
 * Replaces local storage usage with server-backed queries and mutations
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { queryKeys, mutationKeys } from '@/lib/query-client';
import { createLogger } from '@/lib/logger';
import { APIClient } from '@/lib/api-client';

const logger = createLogger('UserDataHooks');

// Types
export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  photos: string[];
  // Add other pet fields as needed
}

export interface Match {
  id: string;
  petId: string;
  matchedPetId: string;
  status: 'active' | 'passed' | 'matched';
  createdAt: string;
}

export interface SwipeAction {
  id: string;
  petId: string;
  targetPetId: string;
  action: 'like' | 'pass';
  timestamp: string;
}

export interface Playdate {
  id: string;
  title: string;
  location: string;
  date: string;
  participants: string[];
  // Add other playdate fields as needed
}

/**
 * Hook for user pets data
 */
export function useUserPets(): UseQueryResult<Pet[], Error> {
  return useQuery({
    queryKey: queryKeys.user.pets,
    queryFn: async () => {
      try {
        const response = await APIClient.get<Pet[]>('/user/pets');
        return response.data ?? [];
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to fetch user pets', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for matches data
 */
export function useMatches(): UseQueryResult<Match[], Error> {
  return useQuery({
    queryKey: queryKeys.matches.list,
    queryFn: async () => {
      try {
        const response = await APIClient.get<Match[]>('/matches');
        return response.data ?? [];
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to fetch matches', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - matches change frequently
  });
}

/**
 * Hook for swipe history
 */
export function useSwipeHistory(): UseQueryResult<SwipeAction[], Error> {
  return useQuery({
    queryKey: queryKeys.swipes.history,
    queryFn: async () => {
      try {
        const response = await APIClient.get<SwipeAction[]>('/swipes/history');
        return response.data ?? [];
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to fetch swipe history', err);
        throw err;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - history doesn't change often
  });
}

/**
 * Hook for playdates
 */
export function usePlaydates(): UseQueryResult<Playdate[], Error> {
  return useQuery({
    queryKey: queryKeys.playdates.list,
    queryFn: async () => {
      try {
        const response = await APIClient.get<Playdate[]>('/playdates');
        return response.data ?? [];
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to fetch playdates', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for swipe stats (computed from swipe history)
 */
export function useSwipeStats(): UseQueryResult<
  {
    totalSwipes: number;
    likes: number;
    passes: number;
    successRate: number;
  },
  Error
> {
  const { data: swipeHistory } = useSwipeHistory();

  return useQuery({
    queryKey: queryKeys.swipes.stats,
    queryFn: () => {
      const history = swipeHistory ?? [];
      const totalSwipes = history.length;
      const likes = history.filter((s) => s.action === 'like').length;
      const passes = history.filter((s) => s.action === 'pass').length;
      const successRate = likes > 0 ? Math.round((likes / totalSwipes) * 100) : 0;

      return {
        totalSwipes,
        likes,
        passes,
        successRate,
      };
    },
    enabled: swipeHistory !== undefined,
  });
}

/**
 * Mutation for performing a swipe action
 */
export function useSwipeMutation(): UseMutationResult<
  SwipeAction,
  Error,
  Omit<SwipeAction, 'id' | 'timestamp'>,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.swipe,
    mutationFn: async (swipe: Omit<SwipeAction, 'id' | 'timestamp'>) => {
      try {
        const response = await APIClient.post<SwipeAction>('/swipes', swipe);
        return response.data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Swipe mutation failed', err);
        throw err;
      }
    },
    onSuccess: (newSwipe) => {
      // Optimistically update swipe history
      queryClient.setQueryData<SwipeAction[]>(queryKeys.swipes.history, (old = []) => [
        ...old,
        newSwipe,
      ]);

      // Invalidate related queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.swipes.stats });
      void queryClient.invalidateQueries({ queryKey: queryKeys.matches.list });
    },
    onError: (error) => {
      logger.error('Swipe mutation failed', error);
    },
  });
}

/**
 * Mutation for creating a playdate
 */
export function useCreatePlaydateMutation(): UseMutationResult<
  Playdate,
  Error,
  Omit<Playdate, 'id'>,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.playdate,
    mutationFn: async (playdate: Omit<Playdate, 'id'>) => {
      try {
        const response = await APIClient.post<Playdate>('/playdates', playdate);
        return response.data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Create playdate mutation failed', err);
        throw err;
      }
    },
    onSuccess: (newPlaydate) => {
      // Optimistically update playdates list
      queryClient.setQueryData<Playdate[]>(queryKeys.playdates.list, (old = []) => [
        ...old,
        newPlaydate,
      ]);
    },
    onError: (error) => {
      logger.error('Create playdate mutation failed', error);
    },
  });
}

/**
 * Computed hook for active matches count
 */
export function useActiveMatchesCount(): number {
  const { data: matches = [] } = useMatches();

  return matches.filter((match) => match.status === 'active').length;
}

/**
 * Alias hooks for backward compatibility with tests
 */
export function useUserMatches(_userId: string): UseQueryResult<Match[], Error> {
  return useMatches();
}

export function useUserSwipes(_userId: string): UseQueryResult<SwipeAction[], Error> {
  return useSwipeHistory();
}

export function useUserPlaydates(_userId: string): UseQueryResult<Playdate[], Error> {
  return usePlaydates();
}
