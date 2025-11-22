import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useFeedManagement } from '@/components/community/features/feed';
import { useTrendingTags } from '@/components/community/features/trending-tags';
import { usePullToRefresh } from '@/components/community/features/pull-to-refresh';
import { usePostActions } from '@/components/community/features/post-actions';
import { haptics } from '@/lib/haptics';

export interface CommunityStrings {
  readonly community: {
    readonly title: string;
    readonly feed: string;
    readonly trending: string;
    readonly forYou: string;
    readonly following: string;
    readonly noPosts: string;
    readonly noFollowingPosts: string;
    readonly noPostsDesc: string;
    readonly createPost: string;
    readonly endOfFeed: string;
  };
  readonly adoption: {
    readonly title: string;
    readonly subtitle: string;
    readonly noProfiles: string;
    readonly noProfilesDesc: string;
    readonly endOfList: string;
  };
  readonly lostFound: { readonly sightingSubmitted: string };
  readonly common: { readonly loading: string };
}

interface TranslationRoot {
  readonly community?: {
    readonly title?: string;
    readonly feed?: string;
    readonly trending?: string;
    readonly forYou?: string;
    readonly following?: string;
    readonly noPosts?: string;
    readonly noFollowingPosts?: string;
    readonly noPostsDesc?: string;
    readonly createPost?: string;
    readonly endOfFeed?: string;
  };
  readonly adoption?: {
    readonly title?: string;
    readonly subtitle?: string;
    readonly noProfiles?: string;
    readonly noProfilesDesc?: string;
    readonly endOfList?: string;
  };
  readonly lostFound?: { readonly sightingSubmitted?: string };
  readonly common?: { readonly loading?: string };
}

export function buildCommunityStrings(t: TranslationRoot | undefined): CommunityStrings {
  const translation: TranslationRoot = t ?? {};
  return {
    community: {
      title: translation.community?.title ?? 'Community',
      feed: translation.community?.feed ?? 'Share and discover pet moments',
      trending: translation.community?.trending ?? 'Trending Today',
      forYou: translation.community?.forYou ?? 'For You',
      following: translation.community?.following ?? 'Following',
      noPosts: translation.community?.noPosts ?? 'No posts yet',
      noFollowingPosts:
        translation.community?.noFollowingPosts ?? 'Follow some pets to see their posts here!',
      noPostsDesc: translation.community?.noPostsDesc ?? 'Be the first to share something amazing!',
      createPost: translation.community?.createPost ?? 'Create Post',
      endOfFeed: translation.community?.endOfFeed ?? "You're all caught up! 🎉",
    },
    adoption: {
      title: translation.adoption?.title ?? 'Adoption',
      subtitle: translation.adoption?.subtitle ?? 'Find your perfect companion',
      noProfiles: translation.adoption?.noProfiles ?? 'No pets available for adoption',
      noProfilesDesc:
        translation.adoption?.noProfilesDesc ??
        'Check back soon for pets looking for their forever homes.',
      endOfList: translation.adoption?.endOfList ?? "You've seen all available pets! 🐾",
    },
    lostFound: {
      sightingSubmitted: translation.lostFound?.sightingSubmitted ?? 'Sighting reported',
    },
    common: { loading: translation.common?.loading ?? 'Loading...' },
  };
}

function useFeedAndTrending(
  activeTab: 'feed' | 'adoption' | 'lost-found',
  feedTab: 'for-you' | 'following',
  setFeedTab: (v: 'for-you' | 'following') => void
) {
  const feedManagement = useFeedManagement({ feedTab, enabled: activeTab === 'feed' });
  const trendingTagsHook = useTrendingTags();
  useEffect(() => {
    if (activeTab === 'feed') {
      void trendingTagsHook.loadTrendingTags();
    }
  }, [activeTab, trendingTagsHook]);
  const handleFeedTabChange = useCallback(
    (value: string) => {
      setFeedTab(value as typeof feedTab);
      feedManagement.resetFeed();
      void haptics.selection();
    },
    [feedManagement, feedTab, setFeedTab]
  );
  const handleRefreshFeed = useCallback(() => {
    void feedManagement.refreshFeed();
    void trendingTagsHook.loadTrendingTags();
    void haptics.impact();
  }, [feedManagement, trendingTagsHook]);
  const postActions = usePostActions({
    onPostCreated: () => {
      void feedManagement.refreshFeed();
      void trendingTagsHook.loadTrendingTags();
    },
    onRefreshFeed: () => void feedManagement.refreshFeed(),
  });
  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      await feedManagement.refreshFeed();
      await trendingTagsHook.loadTrendingTags();
    },
    enabled: activeTab === 'feed',
    activeTab,
  });
  return {
    feedManagement,
    trendingTagsHook,
    handleFeedTabChange,
    handleRefreshFeed,
    postActions,
    pullToRefresh,
  };
}

export function useCommunityViewLogic() {
  const { t } = useApp();
  const { isOnline } = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<'feed' | 'adoption' | 'lost-found'>('feed');
  const [feedTab, setFeedTab] = useState<'for-you' | 'following'>('for-you');
  const [showComposer, setShowComposer] = useState(false);
  const {
    feedManagement,
    trendingTagsHook,
    handleFeedTabChange,
    handleRefreshFeed,
    postActions,
    pullToRefresh,
  } = useFeedAndTrending(activeTab, feedTab, setFeedTab);
  const handleMainTabChange = useCallback((value: string) => {
    setActiveTab(value as typeof activeTab);
    void haptics.selection();
  }, []);
  const handleCreatePost = useCallback(() => {
    setShowComposer(true);
    void haptics.impact();
  }, []);
  const strings = buildCommunityStrings(t);
  return {
    strings,
    isOnline,
    activeTab,
    feedTab,
    showComposer,
    feedManagement,
    trendingTagsHook,
    pullToRefresh,
    postActions,
    handleMainTabChange,
    handleFeedTabChange,
    handleCreatePost,
    handleRefreshFeed,
    setShowComposer,
  };
}
