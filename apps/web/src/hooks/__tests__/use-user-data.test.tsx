// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUserPets,
  useMatches,
  useSwipeHistory,
  usePlaydates,
  useSwipeStats,
  useSwipeMutation,
  useCreatePlaydateMutation,
  useActiveMatchesCount,
  type Match,
  type SwipeAction,
  type Playdate,
} from '../use-user-data';
import { APIClient } from '@/lib/api-client';

// Quiet logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock('@/lib/api-client', () => ({
  APIClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const createTestClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });

const makeWrapper = (client?: QueryClient) => {
  const queryClient = client ?? createTestClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('use-user-data hooks', () => {
  const mockAPIClient = vi.mocked(APIClient);

  beforeEach(() => {
    vi.clearAllMocks();
    mockAPIClient.get.mockReset();
    mockAPIClient.post.mockReset();

    mockAPIClient.get.mockImplementation(async (path: string) => {
      if (path === '/swipes/history') {
        return { data: [], status: 200 };
      }
      return { data: [], status: 200 };
    });

    mockAPIClient.post.mockImplementation(async (path: string, payload: unknown) => {
      if (path === '/swipes') {
        const swipe = {
          ...(payload as Omit<SwipeAction, 'id' | 'timestamp'>),
          id: `swipe-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
        return { data: swipe, status: 200 };
      }
      if (path === '/playdates') {
        return {
          data: {
            ...(payload as Omit<Playdate, 'id'>),
            id: `playdate-${Date.now()}`,
          },
          status: 200,
        };
      }
      return { data: payload, status: 200 };
    });
  });

  describe('useUserPets', () => {
    it('fetches user pets', async () => {
      const { result } = renderHook(() => useUserPets(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useMatches', () => {
    it('fetches matches', async () => {
      const { result } = renderHook(() => useMatches(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeDefined();
    });
  });

  describe('useSwipeHistory', () => {
    it('fetches swipe history', async () => {
      const { result } = renderHook(() => useSwipeHistory(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('usePlaydates', () => {
    it('fetches playdates', async () => {
      const { result } = renderHook(() => usePlaydates(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([]);
    });
  });

  describe('useSwipeStats', () => {
    it('computes stats from empty history', async () => {
      const { result } = renderHook(() => useSwipeStats(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({
        totalSwipes: 0,
        likes: 0,
        passes: 0,
        successRate: 0,
      });
    });

    it('computes stats from provided history', async () => {
      const client = createTestClient();
      client.setQueryData<SwipeAction[]>(['swipes', 'history'], [
        { id: '1', petId: 'p1', targetPetId: 'p2', action: 'like', timestamp: '2024-01-01' },
        { id: '2', petId: 'p1', targetPetId: 'p3', action: 'like', timestamp: '2024-01-02' },
        { id: '3', petId: 'p1', targetPetId: 'p4', action: 'pass', timestamp: '2024-01-03' },
      ]);
      const wrapper = makeWrapper(client);
      const { result } = renderHook(() => useSwipeStats(), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({
        totalSwipes: 3,
        likes: 2,
        passes: 1,
        successRate: 67,
      });
    });

    it('is disabled when history unavailable', () => {
      const wrapper = makeWrapper();
      const { result } = renderHook(() => useSwipeStats(), { wrapper });
      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useSwipeMutation', () => {
    it('performs swipe mutation', async () => {
      const client = createTestClient();
      const wrapper = makeWrapper(client);
      const { result } = renderHook(() => useSwipeMutation(), { wrapper });

      await waitFor(() => expect(result.current.isIdle).toBe(true));

      const swipe = await result.current.mutateAsync({
        petId: 'p1',
        targetPetId: 'p2',
        action: 'like',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(swipe).toMatchObject({
        petId: 'p1',
        targetPetId: 'p2',
        action: 'like',
        id: expect.any(String),
        timestamp: expect.any(String),
      });

      const history = client.getQueryData<SwipeAction[]>(['swipes', 'history']);
      expect(history).toContainEqual(swipe);
    });

    it('handles mutation with invalid-ish data (no validation yet)', async () => {
      const wrapper = makeWrapper();
      const { result } = renderHook(() => useSwipeMutation(), { wrapper });

      const res = await result.current.mutateAsync({
        petId: '',
        targetPetId: '',
        action: 'like',
      });
      expect(res).toBeDefined(); // current impl resolves
    });

    it('invalidates related queries on success', async () => {
      const client = createTestClient();
      const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
      const wrapper = makeWrapper(client);
      const { result } = renderHook(() => useSwipeMutation(), { wrapper });

      await result.current.mutateAsync({ petId: 'p1', targetPetId: 'p2', action: 'like' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['swipes', 'stats'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['matches', 'list'] });
    });
  });

  describe('useCreatePlaydateMutation', () => {
    it('creates a playdate', async () => {
      const client = createTestClient();
      const wrapper = makeWrapper(client);
      const { result } = renderHook(() => useCreatePlaydateMutation(), { wrapper });

      const data: Omit<Playdate, 'id'> = {
        title: 'Dog Park Meetup',
        location: 'Central Park',
        date: '2024-12-25',
        participants: ['user1', 'user2'],
      };

      const playdate = await result.current.mutateAsync(data);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(playdate).toMatchObject({ ...data, id: expect.any(String) });
      const list = client.getQueryData<Playdate[]>(['playdates', 'list']);
      expect(list).toContainEqual(playdate);
    });
  });

  describe('useActiveMatchesCount', () => {
    it('returns 0 when no matches', () => {
      const client = createTestClient();
      client.setQueryData<Match[]>(['matches', 'list'], []);
      const wrapper = makeWrapper(client);
      const { result } = renderHook(() => useActiveMatchesCount(), { wrapper });
      expect(result.current).toBe(0);
    });

    it('counts active matches', () => {
      const client = createTestClient();
      client.setQueryData<Match[]>(['matches', 'list'], [
        { id: '1', petId: 'p1', matchedPetId: 'p2', status: 'active', createdAt: '2024-01-01' },
        { id: '2', petId: 'p1', matchedPetId: 'p3', status: 'active', createdAt: '2024-01-02' },
        { id: '3', petId: 'p1', matchedPetId: 'p4', status: 'passed', createdAt: '2024-01-03' },
        { id: '4', petId: 'p1', matchedPetId: 'p5', status: 'matched', createdAt: '2024-01-04' },
      ]);
      const wrapper = makeWrapper(client);
      const { result } = renderHook(() => useActiveMatchesCount(), { wrapper });
      expect(result.current).toBe(2);
    });
  });
});
