import { adoptionApi } from '@/api/adoption-api';
import { lostFoundAPI } from '@/api/lost-found-api';
import { AdoptionCard } from '@/components/adoption/AdoptionCard';
import { AdoptionDetailDialog } from '@/components/adoption/AdoptionDetailDialog';
import { PostCard } from '@/components/community/PostCard';
import { PostComposer } from '@/components/community/PostComposer';
import { RankingSkeleton } from '@/components/community/RankingSkeleton';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { CreateLostAlertDialog } from '@/components/lost-found/CreateLostAlertDialog';
import LostFoundMap from '@/components/maps/LostFoundMap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { useStorage } from '@/hooks/use-storage';
import type { AdoptionProfile } from '@/lib/adoption-types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import type { LostAlert } from '@/lib/lost-found-types';
import type { LostPetAlert } from '@/lib/maps/types';
import {
  ArrowsClockwise,
  Fire,
  Heart,
  MapPin,
  PawPrint,
  Plus,
  Sparkle,
  TrendUp,
} from '@phosphor-icons/react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { usePageTransition } from '@/effects/reanimated/use-page-transition';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useFeedManagement, useInfiniteScroll } from '@/components/community/features/feed';
import { VirtualList, VirtualGrid } from '@/components/virtual';
import { usePullToRefresh } from '@/components/community/features/pull-to-refresh';
import { useTrendingTags } from '@/components/community/features/trending-tags';
import { usePostActions } from '@/components/community/features/post-actions';

const logger = createLogger('CommunityView');

function convertLostAlertToLostPetAlert(alert: LostAlert): LostPetAlert {
  return {
    id: alert.id,
    petId: alert.id,
    petName: alert.petSummary.name ?? 'Unknown',
    petPhoto: alert.photos[0] ?? '',
    breed: alert.petSummary.breed ?? 'Unknown',
    lastSeen: {
      lat: alert.lastSeen.lat ?? 0,
      lng: alert.lastSeen.lon ?? 0,
    },
    lastSeenTime: new Date(alert.createdAt),
    description: alert.description ?? '',
    contactInfo: alert.contactMask ?? '',
    radius: 10, // Default radius
    status: alert.status === 'active' ? 'active' : alert.status === 'found' ? 'found' : 'expired',
    sightings: [],
    createdBy: alert.ownerId,
    createdAt: new Date(alert.createdAt),
  };
}

export default function CommunityView(): JSX.Element {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<'feed' | 'adoption' | 'lost-found'>('feed');
  const [feedTab, setFeedTab] = useState<'for-you' | 'following'>('for-you');
  const [showComposer, setShowComposer] = useState(false);

  // Feed management hook
  const feedManagement = useFeedManagement({
    feedTab,
    enabled: activeTab === 'feed',
  });

  // Infinite scroll hook
  const infiniteScroll = useInfiniteScroll({
    hasMore: feedManagement.hasMore,
    loading: feedManagement.loading,
    onLoadMore: () => void feedManagement.loadFeed(true),
    enabled: activeTab === 'feed',
  });

  // Trending tags hook
  const trendingTags = useTrendingTags();

  // Pull to refresh hook
  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      await feedManagement.refreshFeed();
      await trendingTags.loadTrendingTags();
    },
    enabled: activeTab === 'feed',
    activeTab,
  });

  // Post actions hook
  const postActions = usePostActions({
    onPostCreated: () => {
      void feedManagement.refreshFeed();
      void trendingTags.loadTrendingTags();
    },
    onRefreshFeed: () => void feedManagement.refreshFeed(),
  });

  const mainTabsOpacity = useSharedValue(0);
  const mainTabsTranslateY = useSharedValue(20);

  useEffect(() => {
    mainTabsOpacity.value = withTiming(1, timingConfigs.smooth);
    mainTabsTranslateY.value = withTiming(0, timingConfigs.smooth);
  }, [mainTabsOpacity, mainTabsTranslateY]);

  const mainTabsStyle = useAnimatedStyle(() => {
    return {
      opacity: mainTabsOpacity.value,
      transform: [{ translateY: mainTabsTranslateY.value }],
    };
  }) as AnimatedStyle;

  const [adoptionProfiles, setAdoptionProfiles] = useState<AdoptionProfile[]>([]);
  const [adoptionLoading, setAdoptionLoading] = useState(true);
  const [adoptionHasMore, setAdoptionHasMore] = useState(true);
  const [_adoptionCursor, setAdoptionCursor] = useState<string | undefined>();
  const [selectedAdoptionProfile, setSelectedAdoptionProfile] = useState<AdoptionProfile | null>(
    null
  );
  const [favoritedProfiles, setFavoritedProfiles] = useStorage<string[]>(
    'favorited-adoption-profiles',
    []
  );
  const adoptionLoadingRef = useRef(false);
  const adoptionObserverTarget = useRef<HTMLDivElement>(null);

  const [lostFoundAlerts, setLostFoundAlerts] = useState<LostPetAlert[]>([]);
  const [lostFoundLoading, setLostFoundLoading] = useState(false);
  const [showLostAlertDialog, setShowLostAlertDialog] = useState(false);

  const loadLostFoundAlerts = useCallback(async () => {
    if (activeTab !== 'lost-found' || lostFoundLoading) return;

    setLostFoundLoading(true);
    try {
      const result = await lostFoundAPI.queryAlerts({ status: ['active'] });
      setLostFoundAlerts(result.alerts.map(convertLostAlertToLostPetAlert));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load lost found alerts', err);
    } finally {
      setLostFoundLoading(false);
    }
  }, [activeTab, lostFoundLoading]);

  useEffect(() => {
    void loadLostFoundAlerts();
  }, [loadLostFoundAlerts]);

  const loadAdoptionProfiles = useCallback(async (loadMore = false) => {
    if (adoptionLoadingRef.current) return;

    try {
      adoptionLoadingRef.current = true;
      setAdoptionLoading(true);

      const response = await adoptionApi.getAdoptionProfiles({ limit: 12 });

      if (loadMore) {
        setAdoptionProfiles((currentProfiles) => [
          ...(Array.isArray(currentProfiles) ? currentProfiles : []),
          ...(Array.isArray(response.profiles)
            ? response.profiles.map(
              (l: AdoptionProfile): AdoptionProfile => ({
                _id: l._id,
                petId: l.petId,
                petName: l.petName,
                petPhoto: l.petPhoto,
                breed: l.breed,
                age: l.age,
                gender: l.gender,
                size: l.size,
                location: l.location,
                shelterId: l.shelterId,
                shelterName: l.shelterName,
                status: l.status,
                description: l.description,
                healthStatus: l.healthStatus,
                vaccinated: l.vaccinated,
                spayedNeutered: l.spayedNeutered,
                goodWithKids: l.goodWithKids,
                goodWithPets: l.goodWithPets,
                energyLevel: l.energyLevel,
                ...(l.specialNeeds && { specialNeeds: l.specialNeeds }),
                adoptionFee: l.adoptionFee,
                postedDate: l.postedDate,
                personality: l.personality,
                photos: l.photos,
                ...(l.videoUrl && { videoUrl: l.videoUrl }),
                contactEmail: l.contactEmail,
                ...(l.contactPhone && { contactPhone: l.contactPhone }),
                ...(l.applicationUrl && { applicationUrl: l.applicationUrl }),
              })
            )
            : []),
        ]);
      } else {
        setAdoptionProfiles(
          Array.isArray(response.profiles)
            ? response.profiles.map(
              (l: AdoptionProfile): AdoptionProfile => ({
                _id: l._id,
                petId: l.petId,
                petName: l.petName,
                petPhoto: l.petPhoto,
                breed: l.breed,
                age: l.age,
                gender: l.gender,
                size: l.size,
                location: l.location,
                shelterId: l.shelterId,
                shelterName: l.shelterName,
                status: l.status,
                description: l.description,
                healthStatus: l.healthStatus,
                vaccinated: l.vaccinated,
                spayedNeutered: l.spayedNeutered,
                goodWithKids: l.goodWithKids,
                goodWithPets: l.goodWithPets,
                energyLevel: l.energyLevel,
                ...(l.specialNeeds && { specialNeeds: l.specialNeeds }),
                adoptionFee: l.adoptionFee,
                postedDate: l.postedDate,
                personality: l.personality,
                photos: l.photos,
                ...(l.videoUrl && { videoUrl: l.videoUrl }),
                contactEmail: l.contactEmail,
                ...(l.contactPhone && { contactPhone: l.contactPhone }),
                ...(l.applicationUrl && { applicationUrl: l.applicationUrl }),
              })
            )
            : []
        );
      }

      setAdoptionHasMore(!!response.nextCursor);
      setAdoptionCursor(response.nextCursor);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load adoption profiles', err, { action: 'loadAdoptionProfiles' });
    } finally {
      setAdoptionLoading(false);
      adoptionLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'feed') {
      void trendingTags.loadTrendingTags();
    }
  }, [activeTab, trendingTags]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry?.isIntersecting &&
          adoptionHasMore &&
          !adoptionLoading &&
          !adoptionLoadingRef.current &&
          activeTab === 'adoption'
        ) {
          void loadAdoptionProfiles(true);
        }
      },
      { threshold: 0.1 }
    );

    if (adoptionObserverTarget.current) {
      observer.observe(adoptionObserverTarget.current);
    }

    return () => observer.disconnect();
  }, [adoptionHasMore, adoptionLoading, activeTab, loadAdoptionProfiles]);

  const handleMainTabChange = useCallback((value: string) => {
    setActiveTab(value as 'feed' | 'adoption');
    haptics.selection();
  }, []);

  const handleFeedTabChange = useCallback((value: string) => {
    setFeedTab(value as 'for-you' | 'following');
    feedManagement.resetFeed();
    haptics.selection();
  }, [feedManagement]);

  const handleCreatePost = useCallback(() => {
    setShowComposer(true);
    haptics.impact();
  }, []);

  // Animation hooks
  const headerTransition = usePageTransition({ isVisible: true, direction: 'down', duration: 300 });
  const trendingTransition = usePageTransition({
    isVisible: trendingTags.trendingTags.length > 0,
    direction: 'up',
    duration: 300,
  });
  const emptyStateTransition = usePageTransition({
    isVisible: feedManagement.posts.length === 0 && !feedManagement.loading,
    direction: 'fade',
    duration: 500,
  });

  // Empty state animation
  const emptyScale = useSharedValue(1);
  const emptyRotation = useSharedValue(0);
  const loadingRotation = useSharedValue(0);

  useEffect(() => {
    if (feedManagement.posts.length === 0 && !feedManagement.loading) {
      emptyScale.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        true
      );
      emptyRotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 500 }),
          withTiming(-5, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      );
    }
  }, [feedManagement.posts.length, feedManagement.loading, emptyScale, emptyRotation]);

  useEffect(() => {
    if (feedManagement.loading || adoptionLoading) {
      loadingRotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
    } else {
      loadingRotation.value = 0;
    }
  }, [feedManagement.loading, adoptionLoading, loadingRotation]);

  const loadingSpinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${loadingRotation.value}deg` }],
  })) as AnimatedStyle;

  const emptyStateStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emptyScale.value }, { rotate: `${emptyRotation.value}deg` }],
  })) as AnimatedStyle;

  // Adoption skeleton animation
  const adoptionSkeletonOpacity = useSharedValue(0);
  const adoptionSkeletonTranslateY = useSharedValue(20);

  useEffect(() => {
    if (adoptionLoading && adoptionProfiles.length === 0) {
      adoptionSkeletonOpacity.value = withTiming(1, timingConfigs.smooth);
      adoptionSkeletonTranslateY.value = withTiming(0, timingConfigs.smooth);
    }
  }, [
    adoptionLoading,
    adoptionProfiles.length,
    adoptionSkeletonOpacity,
    adoptionSkeletonTranslateY,
  ]);

  // Adoption empty state animation
  const adoptionEmptyScale = useSharedValue(1);
  const adoptionEmptyRotation = useSharedValue(0);

  useEffect(() => {
    if (adoptionProfiles.length === 0 && !adoptionLoading) {
      adoptionEmptyScale.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        true
      );
      adoptionEmptyRotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 500 }),
          withTiming(-5, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      );
    }
  }, [adoptionProfiles.length, adoptionLoading, adoptionEmptyScale, adoptionEmptyRotation]);

  // Adoption profile card entry animation
  const adoptionCardOpacity = useSharedValue(0);
  const adoptionCardTranslateY = useSharedValue(20);

  useEffect(() => {
    if (adoptionProfiles.length > 0) {
      adoptionCardOpacity.value = withTiming(1, timingConfigs.smooth);
      adoptionCardTranslateY.value = withTiming(0, timingConfigs.smooth);
    }
  }, [adoptionProfiles.length, adoptionCardOpacity, adoptionCardTranslateY]);

  // Adoption loading spinner
  const adoptionLoadingRotation = useSharedValue(0);

  useEffect(() => {
    if (adoptionLoading) {
      adoptionLoadingRotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
    } else {
      adoptionLoadingRotation.value = 0;
    }
  }, [adoptionLoading, adoptionLoadingRotation]);

  const adoptionLoadingSpinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${adoptionLoadingRotation.value}deg` }],
  })) as AnimatedStyle;

  // Memoize render callbacks for VirtualList and VirtualGrid
  const renderPostItem = useCallback((post: typeof feedManagement.posts[0]) => (
    <div className="mb-4">
      <ErrorBoundary
        fallback={
          <div className="p-4 text-sm text-muted-foreground">
            Failed to load post. Please refresh.
          </div>
        }
      >
        <PostCard post={post} onAuthorClick={postActions.handleAuthorClick} />
      </ErrorBoundary>
    </div>
  ), [postActions.handleAuthorClick]);

  const handleAdoptionSelect = useCallback((profile: AdoptionProfile) => {
    setSelectedAdoptionProfile(profile);
  }, []);

  const renderAdoptionCard = useCallback((profile: AdoptionProfile) => (
    <AdoptionCard
      profile={profile}
      onSelect={handleAdoptionSelect}
      onFavorite={postActions.handleToggleFavorite}
      isFavorited={
        Array.isArray(favoritedProfiles) &&
        favoritedProfiles.includes(profile._id)
      }
    />
  ), [favoritedProfiles, postActions.handleToggleFavorite, handleAdoptionSelect]);

  const estimatePostSize = useCallback(() => 400, []);
  const postKeyExtractor = useCallback((post: typeof feedManagement.posts[0]) => post.id, []);
  const adoptionKeyExtractor = useCallback((profile: AdoptionProfile) => profile._id, []);

  const handleFeedEndReached = useCallback(() => {
    if (feedManagement.hasMore && !feedManagement.loading) {
      void feedManagement.loadFeed(true);
    }
  }, [feedManagement.hasMore, feedManagement.loading, feedManagement.loadFeed]);

  const handleAdoptionEndReached = useCallback(() => {
    if (adoptionHasMore && !adoptionLoading && activeTab === 'adoption') {
      void loadAdoptionProfiles(true);
    }
  }, [adoptionHasMore, adoptionLoading, activeTab, loadAdoptionProfiles]);

  return (
    <PageTransitionWrapper key="community-view" direction="up">
      <div ref={pullToRefresh.containerRef} className="max-w-6xl mx-auto space-y-6 pb-8 relative">
        {/* Pull-to-Refresh Indicator */}
        <AnimatedView
          className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={[pullToRefresh.pullTranslateStyle, pullToRefresh.pullOpacityStyle]}
        >
          <AnimatedView
            className="bg-card/95 backdrop-blur-xl shadow-xl rounded-full p-3 border border-border/50"
            style={[pullToRefresh.pullRotationStyle, pullToRefresh.pullScaleStyle]}
          >
            <ArrowsClockwise
              size={24}
              weight="bold"
              className={`${pullToRefresh.isRefreshing ? 'animate-spin' : ''} text-primary`}
            />
          </AnimatedView>
        </AnimatedView>

        {/* Header */}
        <AnimatedView style={headerTransition.style} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              {t.community?.title ?? 'Community'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'feed'
                ? (t.community?.feed ?? 'Share and discover pet moments')
                : (t.adoption?.subtitle ?? 'Find your perfect companion')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'feed' && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    haptics.impact();
                    try {
                      await feedManagement.refreshFeed();
                      await trendingTags.loadTrendingTags();
                      haptics.success();
                      toast.success(t.community?.refreshed ?? 'Feed refreshed!');
                    } catch (error) {
                      const err = error instanceof Error ? error : new Error(String(error));
                      logger.error('Failed to refresh feed', err);
                      haptics.error();
                      toast.error(t.community?.refreshError ?? 'Failed to refresh');
                    }
                  }}
                  aria-label="Refresh feed"
                  disabled={pullToRefresh.isRefreshing}
                  className="shadow-md"
                >
                  <ArrowsClockwise
                    size={20}
                    weight="bold"
                    className={pullToRefresh.isRefreshing ? 'animate-spin' : ''}
                  />
                </Button>
                <Button size="lg" className="gap-2 shadow-lg" onClick={handleCreatePost}>
                  <Plus size={20} weight="bold" />
                  <span className="hidden sm:inline">
                    {t.community?.createPost ?? 'Create Post'}
                  </span>
                  <span className="sm:hidden">{t.community?.post ?? 'Post'}</span>
                </Button>
              </>
            )}
          </div>
        </AnimatedView>

        {/* Main Tabs - Feed & Adoption */}
        <AnimatedView style={mainTabsStyle}>
          <Tabs value={activeTab} onValueChange={handleMainTabChange}>
            <TabsList className="grid w-full grid-cols-3 bg-card shadow-md">
              <TabsTrigger value="feed" className="gap-2">
                <Fire size={18} weight={activeTab === 'feed' ? 'fill' : 'regular'} />
                {t.community?.feed ?? 'Feed'}
              </TabsTrigger>
              <TabsTrigger value="adoption" className="gap-2">
                <Heart size={18} weight={activeTab === 'adoption' ? 'fill' : 'regular'} />
                {t.adoption?.title ?? 'Adoption'}
              </TabsTrigger>
              <TabsTrigger value="lost-found" className="gap-2">
                <MapPin size={18} weight={activeTab === 'lost-found' ? 'fill' : 'regular'} />
                {t.map?.lostAndFound ?? 'Lost & Found'}
              </TabsTrigger>
            </TabsList>

            {/* Feed Tab Content */}
            <TabsContent value="feed" className="mt-6 space-y-6">
              {/* Trending Tags */}
              {trendingTags.trendingTags.length > 0 && (
                <AnimatedView
                  style={trendingTransition.style}
                  className="bg-linear-to-br from-card via-card to-card/50 rounded-xl p-4 border border-border/50 shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <TrendUp size={20} className="text-accent" weight="bold" />
                    <h3 className="font-semibold text-foreground">
                      {t.community?.trending ?? 'Trending Today'}
                    </h3>
                    <Fire size={16} className="text-destructive ml-auto" weight="fill" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingTags.trendingTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => haptics.selection()}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </AnimatedView>
              )}

              {/* Feed Sub-Tabs */}
              <Tabs value={feedTab} onValueChange={handleFeedTabChange}>
                <TabsList className="grid w-full grid-cols-2 bg-card shadow-md max-w-md mx-auto">
                  <TabsTrigger value="for-you" className="gap-2">
                    <Sparkle size={18} weight={feedTab === 'for-you' ? 'fill' : 'regular'} />
                    {t.community?.forYou ?? 'For You'}
                  </TabsTrigger>
                  <TabsTrigger value="following" className="gap-2">
                    <Fire size={18} weight={feedTab === 'following' ? 'fill' : 'regular'} />
                    {t.community?.following ?? 'Following'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={feedTab} className="mt-6 space-y-4 max-w-3xl mx-auto">
                  {feedManagement.loading && feedManagement.posts.length === 0 ? (
                    <RankingSkeleton count={3} variant="post" />
                  ) : feedManagement.posts.length === 0 ? (
                    <AnimatedView style={emptyStateTransition.style} className="text-center py-20">
                      <AnimatedView style={emptyStateStyle} className="text-8xl mb-6">
                        🐾
                      </AnimatedView>
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        {t.community?.noPosts ?? 'No posts yet'}
                      </h3>
                      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        {feedTab === 'following'
                          ? (t.community?.noFollowingPosts ??
                            'Follow some pets to see their posts here!')
                          : (t.community?.noPostsDesc ??
                            'Be the first to share something amazing!')}
                      </p>
                      <Button size="lg" className="gap-2 shadow-lg" onClick={handleCreatePost}>
                        <Plus size={20} weight="bold" />
                        {t.community?.createPost ?? 'Create Post'}
                      </Button>
                    </AnimatedView>
                  ) : (
                    <>
                      <VirtualList
                        items={feedManagement.posts}
                        renderItem={renderPostItem}
                        estimateSize={estimatePostSize}
                        overscan={3}
                        containerClassName="space-y-4"
                        onEndReached={handleFeedEndReached}
                        endReachedThreshold={300}
                        keyExtractor={postKeyExtractor}
                      />

                      {/* Loading indicator */}
                      {feedManagement.loading && feedManagement.posts.length > 0 && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                          <AnimatedView style={loadingSpinnerStyle}>
                            <Sparkle size={20} />
                          </AnimatedView>
                          <span className="text-sm">{t.common?.loading ?? 'Loading...'}</span>
                        </div>
                      )}
                      {!feedManagement.hasMore && feedManagement.posts.length > 0 && (
                        <div className="text-center text-muted-foreground text-sm py-8">
                          {t.community?.endOfFeed ?? "You're all caught up! 🎉"}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Adoption Tab Content */}
            <TabsContent value="adoption" className="mt-6 space-y-6">
              {adoptionLoading && adoptionProfiles.length === 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-md"
                    >
                      <Skeleton className="h-64 w-full" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : adoptionProfiles.length === 0 ? (
                <AnimatedView
                  style={
                    usePageTransition({ isVisible: true, direction: 'fade', duration: 500 }).style
                  }
                  className="text-center py-20"
                >
                  <AnimatedView style={emptyStateStyle} className="text-8xl mb-6">
                    🏠
                  </AnimatedView>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {t.adoption?.noProfiles ?? 'No pets available for adoption'}
                  </h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    {t.adoption?.noProfilesDesc ??
                      'Check back soon for pets looking for their forever homes.'}
                  </p>
                </AnimatedView>
              ) : (
                <>
                  <VirtualGrid
                    items={adoptionProfiles}
                    renderItem={renderAdoptionCard}
                    columns={3}
                    itemHeight={400}
                    gap={24}
                    overscan={3}
                    containerClassName="p-4"
                    onEndReached={handleAdoptionEndReached}
                    endReachedThreshold={300}
                    keyExtractor={adoptionKeyExtractor}
                  />

                  {/* Loading indicator */}
                  {adoptionLoading && adoptionProfiles.length > 0 && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                      <AnimatedView style={adoptionLoadingSpinnerStyle}>
                        <PawPrint size={20} />
                      </AnimatedView>
                      <span className="text-sm">{t.common?.loading ?? 'Loading...'}</span>
                    </div>
                  )}
                  {!adoptionHasMore && adoptionProfiles.length > 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      {t.adoption?.endOfList ?? "You've seen all available pets! 🐾"}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="lost-found" className="mt-6 space-y-6">
              <LostFoundMap
                alerts={lostFoundAlerts}
                onReportSighting={(alertId, location) => {
                  void (async () => {
                    try {
                      const { userService } = await import('@/lib/user-service');
                      const currentUser = await userService.user();
                      if (!currentUser) {
                        toast.error('You must be logged in to report sightings');
                        return;
                      }
                      await lostFoundAPI.createSighting({
                        alertId,
                        whenISO: new Date().toISOString(),
                        lat: location.lat,
                        lon: location.lng,
                        radiusM: 1000,
                        description: '',
                        photos: [],
                        contactMask: '',
                        reporterId: typeof currentUser.id === 'string' ? currentUser.id : '',
                        reporterName:
                          typeof currentUser['name'] === 'string'
                            ? currentUser['name']
                            : 'Anonymous',
                        ...(currentUser.avatarUrl && { reporterAvatar: currentUser.avatarUrl }),
                      });
                      toast.success(t.lostFound?.sightingSubmitted ?? 'Sighting reported');
                    } catch (error) {
                      const err = error instanceof Error ? error : new Error(String(error));
                      logger.error('Failed to report sighting', err);
                      toast.error('Failed to report sighting');
                    }
                  })();
                }}
                onReportLost={() => {
                  setShowLostAlertDialog(true);
                  haptics.impact('light');
                }}
              />
            </TabsContent>
          </Tabs>
        </AnimatedView>
        <PostComposer
          open={showComposer}
          onOpenChange={setShowComposer}
          onPostCreated={postActions.handlePostCreated}
        />

        {/* Adoption Detail Dialog */}
        <AdoptionDetailDialog
          profile={selectedAdoptionProfile}
          open={!!selectedAdoptionProfile}
          onOpenChange={(open) => !open && setSelectedAdoptionProfile(null)}
        />

        {/* Lost Alert Dialog */}
        <CreateLostAlertDialog
          open={showLostAlertDialog}
          onClose={() => setShowLostAlertDialog(false)}
          onSuccess={() => {
            void loadLostFoundAlerts();
          }}
        />
      </div>
    </PageTransitionWrapper>
  );
}
