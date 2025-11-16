'use client';
import { memo, useEffect, useState, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  MotionView,
} from '@petspark/motion';
import { isTruthy } from '@petspark/shared';
import { communityAPI } from '@/api/community-api';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { communityService } from '@/lib/community-service';
import type { Post } from '@/lib/community-types';
import { triggerHaptic } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import {
  BookmarkSimple,
  ChatCircle,
  DotsThree,
  Flag,
  Heart,
  MapPin,
  Share,
  Tag,
} from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useHoverTap } from '@/effects/reanimated';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { Suspense } from 'react';
import { CommentsSheet } from './CommentsSheet';
import { MediaViewer, type MediaItem } from '@/components/lazy-exports';
import { PostDetailView } from './PostDetailView';
import { ReportDialog } from './ReportDialog';

const logger = createLogger('PostCard');

interface PostCardProps {
  post: Post;
  onAuthorClick?: (authorId: string) => void;
  onPostClick?: (postId: string) => void;
}

function PostCardComponent({ post, onAuthorClick, onPostClick }: PostCardProps): JSX.Element {
  const { t } = useApp();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.reactionsCount ?? 0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showFullText, setShowFullText] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState(false);

  // Container animation
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(20);

  useEffect(() => {
    containerOpacity.value = withTiming(1, timingConfigs.smooth);
    containerTranslateY.value = withTiming(0, timingConfigs.smooth);
  }, [containerOpacity, containerTranslateY]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      transform: [{ translateY: containerTranslateY.value }],
    };
  }) as AnimatedStyle;

  // Author button hover
  const authorButtonHover = useHoverTap({
    hoverScale: 1,
    tapScale: 1,
    damping: 25,
    stiffness: 400,
  });
  const authorButtonTranslateX = useSharedValue(0);

  const authorButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: authorButtonTranslateX.value },
        { scale: authorButtonHover.scale.value },
      ],
    };
  }) as AnimatedStyle;

  const handleAuthorMouseEnter = useCallback(() => {
    authorButtonHover.handleMouseEnter();
    authorButtonTranslateX.value = withSpring(2, springConfigs.smooth);
  }, [authorButtonHover, authorButtonTranslateX]);

  const handleAuthorMouseLeave = useCallback(() => {
    authorButtonHover.handleMouseLeave();
    authorButtonTranslateX.value = withSpring(0, springConfigs.smooth);
  }, [authorButtonHover, authorButtonTranslateX]);

  // Avatar hover/tap
  const avatarHover = useHoverTap({
    hoverScale: 1.05,
    tapScale: 0.95,
    damping: 20,
    stiffness: 400,
  });

  // Options button hover/tap
  const optionsButtonHover = useHoverTap({
    hoverScale: 1.08,
    tapScale: 0.95,
  });

  // Media image opacity
  const mediaOpacity = useSharedValue(0);

  useEffect(() => {
    mediaOpacity.value = withTiming(1, timingConfigs.fast);
  }, [currentMediaIndex, mediaOpacity]);

  const mediaStyle = useAnimatedStyle(() => {
    return {
      opacity: mediaOpacity.value,
    };
  }) as AnimatedStyle;

  // Like button animation
  const likeScale = useSharedValue(1);

  useEffect(() => {
    if (isTruthy(isLiked)) {
      likeScale.value = withSequence(
        withSpring(1.3, springConfigs.bouncy),
        withSpring(1, springConfigs.smooth)
      );
    }
  }, [isLiked, likeScale]);

  const likeButtonHover = useHoverTap({
    tapScale: 0.85,
  });

  const likeButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: likeScale.value * likeButtonHover.scale.value }],
    };
  }) as AnimatedStyle;

  // Bookmark button animation
  const bookmarkHover = useHoverTap({
    tapScale: 0.85,
  });

  useEffect(() => {
    setIsLiked(false);
    setIsSaved(false);
  }, [post.id]);

  const handleLike = useCallback(async () => {
    triggerHaptic('selection');

    try {
      const spark = window.spark;
      if (!spark) {
        toast.error('User service not available');
        return;
      }
      const user = await spark.user();
      const result = await communityAPI.toggleReaction(
        post.id,

        user.id,

        user.login,

        user.avatarUrl,
        '❤️'
      );

      setIsLiked(result.added);
      setLikesCount(result.reactionsCount);

      if (result.added) {
        triggerHaptic('success');
      }
    } catch (error) {
      logger.error(
        'Failed to toggle reaction',
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error('Failed to react to post');
    }
  }, [post.id, logger]);

  const handleSave = useCallback(async () => {
    try {
      triggerHaptic('selection');

      if (isSaved) {
        await communityService.unsavePost(post.id);
        setIsSaved(false);
        toast.success(t.community?.unsaved ?? 'Post removed from saved');
      } else {
        await communityService.savePost(post.id);
        setIsSaved(true);
        toast.success(t.community?.saved ?? 'Post saved');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('PostCard handleSave error', err, { postId: post.id, isSaved });
      toast.error('Failed to save post. Please try again.');
    }
  }, [isSaved, post.id, t, logger]);

  const handleShare = useCallback(async () => {
    try {
      triggerHaptic('selection');

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: `Post by ${post.authorName}`,
            text: post.text?.slice(0, 100) ?? '',
            url: `${window.location.origin}/community/post/${post.id}`,
          });
        } catch (error) {
          // User cancelled share - AbortError is expected
          if (error instanceof Error && error.name !== 'AbortError') {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('PostCard handleShare navigator.share error', err, { postId: post.id });
            toast.error('Failed to share post. Please try again.');
          }
        }
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(
            `${window.location.origin}/community/post/${post.id}`
          );
          toast.success(t.community?.linkCopied ?? 'Link copied to clipboard');
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('PostCard handleShare clipboard.writeText error', err, { postId: post.id });
          toast.error('Failed to copy link. Please try again.');
        }
      } else {
        logger.warn('PostCard handleShare navigator.share and navigator.clipboard not available');
        toast.error('Sharing is not supported in this browser.');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('PostCard handleShare error', err, { postId: post.id });
      toast.error('Failed to share post. Please try again.');
    }
  }, [post.authorName, post.text, post.id, t, logger]);

  const handleReport = useCallback(() => {
    try {
      triggerHaptic('selection');
      setShowReportDialog(true);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('PostCard handleReport error', err, { postId: post.id });
    }
  }, [post.id, logger]);

  const handleMediaClick = useCallback(
    (index: number) => {
      try {
        if (index < 0 || !Array.isArray(post.media) || index >= post.media.length) {
          logger.warn('PostCard handleMediaClick invalid index', {
            postId: post.id,
            index,
            mediaLength: post.media?.length ?? 0,
          });
          return;
        }
        setMediaViewerIndex(index);
        setShowMediaViewer(true);
        triggerHaptic('selection');
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('PostCard handleMediaClick error', err, { postId: post.id, index });
      }
    },
    [post.id, post.media, logger]
  );

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      try {
        // Don't open detail view if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('[role="button"]') ||
          target.closest('a') ||
          target.closest('[role="link"]')
        ) {
          return;
        }

        triggerHaptic('selection');
        setShowPostDetail(true);
        onPostClick?.(post.id);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('PostCard handleCardClick error', err, { postId: post.id });
      }
    },
    [onPostClick, post.id, logger]
  );

  const handleCommentClick = useCallback(() => {
    try {
      setShowComments(true);
      triggerHaptic('selection');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('PostCard handleCommentClick error', err, { postId: post.id });
    }
  }, [post.id, logger]);

  const truncatedText =
    (post.text?.length ?? 0) > 150 ? post.text?.slice(0, 150) + '...' : (post.text ?? '');
  const shouldShowMore = (post.text?.length ?? 0) > 150;

  // Convert media strings or PostMedia objects to MediaItem format for MediaViewer
  const allMedia = (post.media ?? []).map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: `media-${String(index ?? '')}`,
        url: item,
        thumbnail: item,
        type: 'photo' as const,
      };
    } else {
      // It's already a PostMedia object
      const mediaItem: MediaItem = {
        id: item.id || `media-${String(index ?? '')}`,
        url: item.url,
        thumbnail: item.thumbnail ?? item.url,
        type: item.type,
      };
      if (item.width !== undefined) {
        mediaItem.width = item.width;
      }
      if (item.height !== undefined) {
        mediaItem.height = item.height;
      }
      return mediaItem;
    }
  });

  return (
    <>
      <MotionView style={containerStyle}>
        <Card
          className="overflow-hidden bg-linear-to-br from-card via-card to-card/95 border border-border/60 shadow-lg hover:shadow-xl hover:border-border transition-all duration-500 backdrop-blur-sm cursor-pointer"
          onClick={handleCardClick}
        >
          {/* Author Header */}
          <div className="flex items-center justify-between p-4 pb-3">
            <MotionView
              style={authorButtonStyle}
              onMouseEnter={handleAuthorMouseEnter}
              onMouseLeave={handleAuthorMouseLeave}
              onClick={() => onAuthorClick?.(post.authorId)}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <MotionView
                style={avatarHover.animatedStyle}
                onMouseEnter={avatarHover.handleMouseEnter}
                onMouseLeave={avatarHover.handleMouseLeave}
                onClick={avatarHover.handlePress}
              >
                <Avatar className="h-11 w-11 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300">
                  {post.authorAvatar ? (
                    <img src={post.authorAvatar} alt={post.authorName} className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-base">
                      {post.authorName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </Avatar>
              </MotionView>
              <div className="text-left">
                <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-200">
                  {post.authorName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
            </MotionView>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <MotionView
                  style={optionsButtonHover.animatedStyle}
                  onMouseEnter={optionsButtonHover.handleMouseEnter}
                  onMouseLeave={optionsButtonHover.handleMouseLeave}
                  onClick={optionsButtonHover.handlePress}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 transition-colors duration-200"
                    aria-label="Post options"
                  >
                    <DotsThree size={22} weight="bold" />
                  </Button>
                </MotionView>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleReport} className="text-destructive">
                  <Flag size={18} className="mr-2" />
                  Report Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Post Text */}
          {post.text && (
            <div className="px-4 pb-3">
              <p className="text-foreground whitespace-pre-wrap wrap-break-word">
                {showFullText ? post.text : truncatedText}
              </p>
              {shouldShowMore && (
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="text-sm text-primary font-medium mt-1 hover:underline"
                >
                  {showFullText
                    ? t.community?.showLess ?? 'Show less'
                    : t.community?.showMore ?? 'Show more'}
                </button>
              )}
            </div>
          )}

          {/* Media Carousel */}
          {post.media && post.media.length > 0 && post.media[currentMediaIndex] && (
            <div className="relative bg-muted">
              <div className="relative aspect-square overflow-hidden">
                <MotionView style={mediaStyle} className="w-full h-full">
                  <img
                    key={currentMediaIndex}
                    src={
                      typeof post.media[currentMediaIndex] === 'string'
                        ? post.media[currentMediaIndex]
                        : (post.media[currentMediaIndex] as { url: string }).url
                    }
                    alt="Post media"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handleMediaClick(currentMediaIndex)}
                  />
                </MotionView>
              </div>

              {/* Media Navigation Dots */}
              {post.media.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {post.media.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMediaIndex(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${index === currentMediaIndex
                        ? 'w-6 bg-white'
                        : 'w-1.5 bg-white/50 hover:bg-white/75'
                        }`}
                      aria-label={`View photo ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Media Counter */}
              {post.media.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                  {currentMediaIndex + 1} / {post.media.length}
                </div>
              )}
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  void handleLike();
                }}
                className="flex items-center gap-1.5 group"
              >
                <MotionView
                  style={likeButtonStyle}
                  onMouseEnter={likeButtonHover.handleMouseEnter}
                  onMouseLeave={likeButtonHover.handleMouseLeave}
                  onClick={likeButtonHover.handlePress}
                >
                  <Heart
                    size={24}
                    weight={isLiked ? 'fill' : 'regular'}
                    className={`transition-colors ${isLiked ? 'text-red-500' : 'text-foreground group-hover:text-red-500'
                      }`}
                  />
                </MotionView>
                {likesCount > 0 && (
                  <span className="text-sm font-medium text-foreground">{likesCount}</span>
                )}
              </button>

              <button onClick={handleCommentClick} className="flex items-center gap-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)" aria-label="Button">
                <ChatCircle
                  size={24}
                  weight="regular"
                  className="text-foreground group-hover:text-primary transition-colors"
                />
                {(post.commentsCount ?? 0) > 0 && (
                  <span className="text-sm font-medium text-foreground">
                    {post.commentsCount ?? 0}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  void handleShare();
                }}
                className="group"
              >
                <Share
                  size={24}
                  weight="regular"
                  className="text-foreground group-hover:text-primary transition-colors"
                />
              </button>
            </div>

            <button
              onClick={() => {
                void handleSave();
              }}
            >
              <MotionView
                style={bookmarkHover.animatedStyle}
                onMouseEnter={bookmarkHover.handleMouseEnter}
                onMouseLeave={bookmarkHover.handleMouseLeave}
                onClick={bookmarkHover.handlePress}
              >
                <BookmarkSimple
                  size={24}
                  weight={isSaved ? 'fill' : 'regular'}
                  className={`transition-colors ${isSaved ? 'text-primary' : 'text-foreground hover:text-primary'
                    }`}
                />
              </MotionView>
            </button>
          </div>

          {/* Tags and Location */}
          {((post.tags?.length ?? 0) > 0 || post.location) && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {post.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag size={12} className="mr-1" />
                  {tag}
                </Badge>
              ))}
              {post.location && (
                <Badge variant="outline" className="text-xs">
                  <MapPin size={12} className="mr-1" />
                  {post.location.city}, {post.location.country}
                </Badge>
              )}
            </div>
          )}

          {/* Views Footer */}
          {(post.viewsCount ?? 0) > 0 && (
            <div className="px-4 pb-3 text-xs text-muted-foreground">
              {post.viewsCount} {post.viewsCount === 1 ? 'view' : 'views'}
            </div>
          )}

          <CommentsSheet
            open={showComments}
            onOpenChange={setShowComments}
            postId={post.id}
            postAuthor={post.authorName}
          />

          {showMediaViewer && (
            <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>}>
              <MediaViewer
                open={showMediaViewer}
                onOpenChange={setShowMediaViewer}
                media={allMedia}
                initialIndex={mediaViewerIndex}
                authorName={post.authorName}
              />
            </Suspense>
          )}

          <ReportDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            resourceType="post"
            resourceId={post.id}
            resourceName={`Post by ${post.authorName}`}
            onReported={() => {
              toast.success('Report submitted. Thank you for helping keep our community safe.');
            }}
          />
        </Card>
      </MotionView>
      <PostDetailView
        open={showPostDetail}
        onOpenChange={setShowPostDetail}
        postId={post.id}
        {...(onAuthorClick ? { onAuthorClick } : {})}
      />
    </>
  );
}

// Memoize PostCard to prevent unnecessary re-renders
export const PostCard = memo(PostCardComponent, (prev, next) => {
  return (
    prev.post.id === next.post.id &&
    prev.post.reactionsCount === next.post.reactionsCount &&
    prev.post.commentsCount === next.post.commentsCount &&
    prev.post.text === next.post.text
  );
});
