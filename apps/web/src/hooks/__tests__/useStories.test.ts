import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStories } from '../useStories';
import { useStorage } from '@/hooks/use-storage';

vi.mock('@/hooks/use-storage', () => ({
  useStorage: vi.fn(),
}));

describe('useStories', () => {
  const mockStories = [
    {
      id: 'story-1',
      userId: 'user-1',
      userName: 'User 1',
      petId: 'pet-1',
      petName: 'Pet 1',
      petPhoto: 'https://example.com/pet1.jpg',
      type: 'photo' as const,
      mediaType: 'photo' as const,
      mediaUrl: 'https://example.com/story1.jpg',
      duration: 5000,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      visibility: 'everyone' as const,
      viewCount: 0,
      views: [],
      reactions: [],
    },
    {
      id: 'story-2',
      userId: 'user-2',
      userName: 'User 2',
      petId: 'pet-2',
      petName: 'Pet 2',
      petPhoto: 'https://example.com/pet2.jpg',
      type: 'video' as const,
      mediaType: 'video' as const,
      mediaUrl: 'https://example.com/story2.mp4',
      duration: 10000,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      visibility: 'everyone' as const,
      viewCount: 0,
      views: [],
      reactions: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStorage).mockReturnValue([mockStories, vi.fn(), vi.fn()] as never);
  });

  it('should return all stories by default', () => {
    const { result } = renderHook(() => useStories());

    expect(result.current.stories).toEqual(mockStories);
    expect(result.current.hasStories).toBe(true);
  });

  it('should filter stories by petId when filterByUser is true', () => {
    vi.mocked(useStorage).mockReturnValue([mockStories, vi.fn(), vi.fn()] as never);

    const { result } = renderHook(() =>
      useStories({
        currentPetId: 'pet-1',
        filterByUser: true,
      })
    );

    expect(result.current.stories.length).toBe(1);
    expect(result.current.stories[0]?.petId).toBe('pet-1');
  });

  it('should return user stories', () => {
    vi.mocked(useStorage).mockReturnValue([mockStories, vi.fn(), vi.fn()] as never);

    const { result } = renderHook(() =>
      useStories({
        currentPetId: 'pet-1',
      })
    );

    expect(result.current.userStories.length).toBe(1);
    expect(result.current.userStories[0]?.petId).toBe('pet-1');
  });

  it('should add story', () => {
    const setStories = vi.fn();
    vi.mocked(useStorage).mockReturnValue([mockStories, setStories, vi.fn()] as never);

    const { result } = renderHook(() => useStories());

    const newStory = {
      id: 'story-3',
      userId: 'user-1',
      userName: 'User 1',
      petId: 'pet-1',
      petName: 'Pet 1',
      petPhoto: 'https://example.com/pet1.jpg',
      type: 'photo' as const,
      mediaType: 'photo' as const,
      mediaUrl: 'https://example.com/story3.jpg',
      duration: 5000,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      visibility: 'everyone' as const,
      viewCount: 0,
      views: [],
      reactions: [],
    };

    act(() => {
      result.current.addStory(newStory);
    });

    expect(setStories).toHaveBeenCalled();
  });

  it('should update story', () => {
    const setStories = vi.fn();
    vi.mocked(useStorage).mockReturnValue([mockStories, setStories] as never);

    const { result } = renderHook(() => useStories());

    act(() => {
      result.current.updateStory('story-1', { caption: 'Updated content' });
    });

    expect(setStories).toHaveBeenCalled();
  });

  it('should delete story', () => {
    const setStories = vi.fn();
    vi.mocked(useStorage).mockReturnValue([mockStories, setStories] as never);

    const { result } = renderHook(() => useStories());

    act(() => {
      result.current.deleteStory('story-1');
    });

    expect(setStories).toHaveBeenCalled();
  });

  it('should select story', () => {
    vi.mocked(useStorage).mockReturnValue([mockStories, vi.fn()] as never);

    const { result } = renderHook(() => useStories());

    act(() => {
      result.current.selectStory(mockStories[0]!);
    });

    expect(result.current.selectedStory).toEqual(mockStories[0]);
  });

  it('should clear selected story', () => {
    vi.mocked(useStorage).mockReturnValue([mockStories, vi.fn()] as never);

    const { result } = renderHook(() => useStories());

    act(() => {
      result.current.selectStory(mockStories[0]!);
      result.current.clearSelectedStory();
    });

    expect(result.current.selectedStory).toBe(null);
  });

  it('should return empty array when no stories', () => {
    vi.mocked(useStorage).mockReturnValue([[], vi.fn()] as never);

    const { result } = renderHook(() => useStories());

    expect(result.current.stories).toEqual([]);
    expect(result.current.hasStories).toBe(false);
  });
});
