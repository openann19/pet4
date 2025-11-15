import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildCommunityStrings, useCommunityViewLogic } from './CommunityView.logic';
import { haptics } from '@/lib/haptics';
import { renderHook, act } from '@testing-library/react';

// Mock dependent feature hooks used inside useCommunityViewLogic
vi.mock('@/components/community/features/feed', () => ({
  useFeedManagement: vi.fn().mockImplementation(() => ({
    posts: [],
    loading: false,
    hasMore: false,
    loadFeed: vi.fn(),
    refreshFeed: vi.fn(),
    resetFeed: vi.fn(),
  })),
}));
vi.mock('@/components/community/features/trending-tags', () => ({
  useTrendingTags: vi.fn().mockImplementation(() => ({
    trendingTags: ['dogs', 'cats'],
    loadTrendingTags: vi.fn(),
  })),
}));
vi.mock('@/components/community/features/pull-to-refresh', () => ({
  usePullToRefresh: vi.fn().mockImplementation(() => ({
    refreshing: false,
    onRefresh: vi.fn(),
  })),
}));
vi.mock('@/components/community/features/post-actions', () => ({
  usePostActions: vi.fn().mockImplementation(() => ({
    createPost: vi.fn(),
    onPostCreated: vi.fn(),
    onRefreshFeed: vi.fn(),
  })),
}));
vi.mock('@/lib/haptics', () => ({
  haptics: { selection: vi.fn(), impact: vi.fn() },
}));

vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn().mockImplementation(() => ({
    t: {
      community: {
        title: 'Community',
        feed: 'Feed Desc',
        trending: 'Trending',
        forYou: 'For You',
        following: 'Following',
        noPosts: 'No posts',
        noFollowingPosts: 'No following posts',
        noPostsDesc: 'Be first',
        createPost: 'Create Post',
        endOfFeed: 'End',
      },
      adoption: {
        title: 'Adoption',
        subtitle: 'Find a pet',
        noProfiles: 'None',
        noProfilesDesc: 'Check later',
        endOfList: 'Done',
      },
      lostFound: { sightingSubmitted: 'Sighting reported' },
      common: { loading: 'Loading...' },
    },
  })),
}));
vi.mock('@/hooks/use-network-status', () => ({ useNetworkStatus: () => ({ isOnline: true }) }));

describe('buildCommunityStrings', () => {
  it('returns provided translation strings (happy path)', () => {
    const result = buildCommunityStrings({
      community: {
        title: 'Comm',
        feed: 'Share',
        trending: 'Hot',
        forYou: 'You',
        following: 'Follow',
        noPosts: 'None',
        noFollowingPosts: 'No follow',
        noPostsDesc: 'Start',
        createPost: 'Create',
        endOfFeed: 'Done',
      },
      adoption: {
        title: 'Adopt',
        subtitle: 'Find',
        noProfiles: 'No',
        noProfilesDesc: 'Later',
        endOfList: 'End',
      },
      lostFound: { sightingSubmitted: 'Reported' },
      common: { loading: 'Load' },
    });
    expect(result.community.title).toBe('Comm');
    expect(result.adoption.subtitle).toBe('Find');
    expect(result.lostFound.sightingSubmitted).toBe('Reported');
    expect(result.common.loading).toBe('Load');
  });

  it('falls back to defaults when keys missing', () => {
    const result = buildCommunityStrings(undefined);
    expect(result.community.title).toBe('Community');
    expect(result.adoption.title).toBe('Adoption');
    expect(result.common.loading).toBe('Loading...');
  });
});

describe('useCommunityViewLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with feed tab active and for-you subtab', () => {
    const { result } = renderHook(() => useCommunityViewLogic());
    expect(result.current.activeTab).toBe('feed');
    expect(result.current.feedTab).toBe('for-you');
    expect(result.current.showComposer).toBe(false);
  });

  it('handles main tab change with haptic selection', () => {
    const { result } = renderHook(() => useCommunityViewLogic());
    const { handleMainTabChange } = result.current;
    act(() => handleMainTabChange('adoption'));
    expect(result.current.activeTab).toBe('adoption');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Using spy to assert calls
    expect(haptics.selection).toHaveBeenCalledTimes(1);
  });

  it('handles feed tab change resetting feed', () => {
    const { result } = renderHook(() => useCommunityViewLogic());
    const { handleFeedTabChange, feedManagement } = result.current;
    act(() => handleFeedTabChange('following'));
    expect(result.current.feedTab).toBe('following');
    expect(feedManagement.resetFeed).toHaveBeenCalledTimes(1);
  });

  it('opens composer and triggers impact haptic', () => {
    const { result } = renderHook(() => useCommunityViewLogic());
    act(() => result.current.handleCreatePost());
    expect(result.current.showComposer).toBe(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Using spy to assert calls
    expect(haptics.impact).toHaveBeenCalledTimes(1);
  });

  it('refreshes feed and trending tags with haptic impact', () => {
    const { result } = renderHook(() => useCommunityViewLogic());
    const { handleRefreshFeed, feedManagement, trendingTagsHook } = result.current;
    act(() => handleRefreshFeed());
    expect(feedManagement.refreshFeed).toHaveBeenCalledTimes(1);
    expect(trendingTagsHook.loadTrendingTags).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Using spy to assert calls
    expect(haptics.impact).toHaveBeenCalledTimes(1);
  });
});
