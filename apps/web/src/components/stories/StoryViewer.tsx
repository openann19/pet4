import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { useStoryAnalytics } from '@/hooks/use-story-analytics';
import { useStoryGestures } from '@/hooks/use-story-gestures';
import { haptics } from '@/lib/haptics';
import type { Story } from '@petspark/shared';
import { STORY_REACTION_EMOJIS } from '@petspark/shared';
import { addStoryView, formatStoryTime } from '@/lib/stories-utils';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import {
  ArrowsIn,
  ArrowsOut,
  BookmarkSimple,
  DotsThree,
  Heart,
  PaperPlaneRight,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerSlash,
  X,
} from '@phosphor-icons/react';
import { AnimatePresence } from '@/effects/reanimated/animate-presence';
import { useMotionVariants, useHoverLift, useBounceOnTap } from '@/effects/reanimated';
import * as Reanimated from '@petspark/motion';
import { interpolate, Extrapolation, MotionView } from '@petspark/motion';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { toast } from 'sonner';
import SaveToHighlightDialog from './SaveToHighlightDialog';
import { ProgressiveImage } from '@/components/enhanced/ProgressiveImage';

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onClose: () => void;
  onComplete?: () => void;
  onStoryUpdate?: (story: Story) => void;
}

export default function StoryViewer({
  stories,
  initialIndex = 0,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onClose,
  onComplete,
  onStoryUpdate,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const progressIntervalRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const swipeProgress = Reanimated.useSharedValue(0);

  const currentStory = stories[currentIndex];
  const isOwn = currentStory?.userId === currentUserId;
  const prefersReducedMotion = usePrefersReducedMotion();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const { trackReaction, trackInteraction } = useStoryAnalytics({
    story: currentStory ?? null,
    currentUserId,
    isActive: !isPaused,
  });

  const handleNext = useCallback(() => {
    const viewDuration = (Date.now() - startTimeRef.current) / 1000;
    const completedView = viewDuration >= (currentStory?.duration ?? 5) * 0.8;

    if (currentStory && !isOwn) {
      const updatedStory = addStoryView(
        currentStory,
        currentUserId,
        currentUserName,
        viewDuration,
        completedView,
        currentUserAvatar ?? undefined
      );
      onStoryUpdate?.(updatedStory);
    }

    trackInteraction('skip');

    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onComplete?.();
      onClose();
    }
  }, [
    currentStory,
    currentUserId,
    currentUserName,
    currentUserAvatar,
    isOwn,
    currentIndex,
    stories.length,
    onStoryUpdate,
    onComplete,
    onClose,
    trackInteraction,
  ]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  const handlePauseToggle = useCallback(() => {
    haptics.trigger('selection');
    setIsPaused((prev) => !prev);
  }, []);

  const handleMuteToggle = useCallback(() => {
    haptics.trigger('selection');
    setIsMuted((prev) => !prev);
  }, []);

  const {
    gestureState,
    handlers: gestureHandlers,
    reset: resetGestures,
  } = useStoryGestures({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
    onTap: handlePauseToggle,
    onLongPress: () => {
      if (!isOwn) {
        setShowReactions(true);
      }
    },
    onPinchZoom: (scale: number) => {
      if (mediaContainerRef.current) {
        mediaContainerRef.current.style.transform = `scale(${scale})`;
      }
    },
    enablePinchZoom: currentStory?.type === 'photo',
    swipeThreshold: 50,
  });

  const swipeOpacityStyle = Reanimated.useAnimatedStyle(() => {
    const opacity = interpolate(
      swipeProgress.value,
      [-1, 0, 1],
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const swipeScaleStyle = Reanimated.useAnimatedStyle(() => {
    const scale = interpolate(
      swipeProgress.value,
      [-1, 0, 1],
      [0.95, 1, 0.95],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }] };
  });

  const startProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const duration = currentStory?.duration ?? 5;
    const interval = 50;

    progressIntervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (interval / (duration * 1000)) * 100;

        if (newProgress >= 100) {
          handleNext();
          return 0;
        }

        return newProgress;
      });
    }, interval);
  }, [currentStory, handleNext]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);
    resetGestures();

    if (mediaContainerRef.current) {
      mediaContainerRef.current.style.transform = 'scale(1)';
    }

    if (!isPaused) {
      startProgress();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentIndex, isPaused, resetGestures, startProgress]);

  useEffect(() => {
    if (currentStory?.type === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
        trackInteraction('pause');
      } else {
        videoRef.current.play().catch(() => {
          // Video play failed
        });
      }
      videoRef.current.muted = isMuted;
    }
  }, [isPaused, isMuted, currentStory, trackInteraction]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);
    resetGestures();

    if (mediaContainerRef.current) {
      mediaContainerRef.current.style.transform = 'scale(1)';
    }

    if (!isPaused) {
      startProgress();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentIndex, isPaused, resetGestures, startProgress]);

  useEffect(() => {
    if (currentStory?.type === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
        trackInteraction('pause');
      } else {
        videoRef.current.play().catch(() => {
          // Video play failed
        });
      }
      videoRef.current.muted = isMuted;
    }
  }, [isPaused, isMuted, currentStory, trackInteraction]);

  const handleReaction = useCallback(
    (emoji: string) => {
      haptics.trigger('success');

      if (currentStory && !isOwn) {
        trackReaction(emoji);
        const updatedStory = {
          ...currentStory,
          reactions: [
            ...currentStory.reactions,
            {
              emoji,
              userId: currentUserId,
              userName: currentUserName,
              ...(currentUserAvatar !== undefined ? { userAvatar: currentUserAvatar } : {}),
              timestamp: new Date().toISOString(),
            },
          ],
        };
        onStoryUpdate?.(updatedStory);
      }

      toast.success(`Reacted with ${emoji}`, {
        duration: 1500,
        position: 'top-center',
      });

      setShowReactions(false);
    },
    [
      currentStory,
      isOwn,
      currentUserId,
      currentUserName,
      currentUserAvatar,
      trackReaction,
      onStoryUpdate,
    ]
  );

  const handleReply = useCallback(() => {
    if (!replyText.trim()) return;

    haptics.trigger('light');
    trackInteraction('reply');

    toast.success('Reply sent!', {
      duration: 2000,
      position: 'top-center',
    });

    setReplyText('');
  }, [replyText, trackInteraction]);

  const handleSaveStory = useCallback(() => {
    if (currentStory) {
      haptics.trigger('selection');
      setShowSaveDialog(true);
    }
  }, [currentStory]);

  const handleShare = useCallback(() => {
    if (currentStory) {
      trackInteraction('share');
      if (navigator.share) {
        navigator
          .share({
            title: `Story by ${currentStory.userName}`,
            text: currentStory.caption ?? '',
            url: `${window.location.origin}/stories/${currentStory.id}`,
          })
          .catch(() => {
            // Share cancelled
          });
      } else {
        navigator.clipboard.writeText(`${window.location.origin}/stories/${currentStory.id}`);
        toast.success('Link copied to clipboard');
      }
    }
  }, [currentStory, trackInteraction]);

  const transitionConfig = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: [0.4, 0, 0.2, 1] as number[] };

  // Animation hooks for story viewer
  const viewerEntry = useMotionVariants({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: transitionConfig,
  });

  const reactionButtonHover = useHoverLift({ scale: 1.3 });
  const reactionButtonTap = useBounceOnTap({ scale: 0.9 });

  const captionAnimation = useMotionVariants({
    initial: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: transitionConfig,
  });

  const reactionsAnimation = useMotionVariants({
    initial: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: transitionConfig,
  });

  const analyticsAnimation = useMotionVariants({
    initial: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: transitionConfig,
  });

  const imageEntry = useMotionVariants({
    initial: { scale: prefersReducedMotion ? 1 : 1.1, opacity: 0 },
    animate: { scale: gestureState.pinchScale, opacity: 1 },
    transition: transitionConfig,
  });

  // Combined style for reaction buttons
  const combinedReactionButtonStyle = useMemo(() => {
    return {
      ...reactionButtonHover.animatedStyle,
      ...reactionButtonTap.animatedStyle,
    };
  }, [reactionButtonHover.animatedStyle, reactionButtonTap.animatedStyle]);

  const mediaContainerStyle = Reanimated.useAnimatedStyle(() => {
    const opacity = gestureState.isSwiping ? 0.5 : 1;
    const scale = gestureState.isSwiping ? 0.95 : gestureState.pinchScale;
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // Combined style for media container
  const combinedMediaContainerStyle = useMemo(() => {
    return {
      ...mediaContainerStyle,
      ...swipeOpacityStyle,
      ...swipeScaleStyle,
    };
  }, [mediaContainerStyle, swipeOpacityStyle, swipeScaleStyle]);

  if (!currentStory) return null;

  return (
                          <motion.div
      style={viewerEntry.animatedStyle as any}
      className="fixed inset-0 z-100 bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Story viewer"
      {...gestureHandlers}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Progress bars */}
        <div
          className="absolute top-0 left-0 right-0 z-20 p-4 space-y-3"
          aria-label="Story progress"
        >
          <div className="flex gap-1">
            {stories.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={idx === currentIndex ? progress : idx < currentIndex ? 100 : 0}
                aria-valuemin={0}
                aria-valuemax={100}
                  aria-label={`Story ${String(idx + 1)} of ${String(stories.length)}`}
              >
                                      <motion.div
                  className="h-full bg-white"
                  style={{
                    width:
                      idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                    transition: prefersReducedMotion ? 'none' : 'width 0.1s linear',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-white">
                <AvatarImage src={currentStory.userAvatar} alt={currentStory.userName} />
                <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold">
                  {currentStory.userName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold text-sm">{currentStory.petName}</p>
                <p className="text-white/80 text-xs">{formatStoryTime(currentStory.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void handlePauseToggle()}
                className="text-white hover:bg-white/20"
                aria-label={isPaused ? 'Play story' : 'Pause story'}
              >
                {isPaused ? <Play size={20} weight="fill" /> : <Pause size={20} weight="fill" />}
              </Button>

              {currentStory.type === 'video' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void handleMuteToggle()}
                  className="text-white hover:bg-white/20"
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? (
                    <SpeakerSlash size={20} weight="fill" />
                  ) : (
                    <SpeakerHigh size={20} weight="fill" />
                  )}
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => void toggleFullscreen()}
                className="text-white hover:bg-white/20"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <ArrowsIn size={20} weight="fill" />
                ) : (
                  <ArrowsOut size={20} weight="fill" />
                )}
              </Button>

              {isOwn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      aria-label="Story options"
                    >
                      <DotsThree size={24} weight="bold" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-lg">
                    <DropdownMenuItem onClick={() => void handleSaveStory()}>
                      <BookmarkSimple size={18} className="mr-2" />
                      Save to Highlight
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void handleShare()}>
                      <PaperPlaneRight size={18} className="mr-2" />
                      Share Story
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => void onClose()}
                className="text-white hover:bg-white/20"
                aria-label="Close story viewer"
              >
                <X size={24} weight="bold" />
              </Button>
            </div>
          </div>
        </div>

        {/* Swipe areas */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="flex-1 cursor-w-resize" aria-label="Previous story" />
          <div className="flex-1 cursor-e-resize" aria-label="Next story" />
        </div>

        {/* Media container with pinch-zoom support */}
                              <motion.div
          ref={mediaContainerRef}
          className="relative w-full h-full max-w-2xl mx-auto touch-none"
          style={combinedMediaContainerStyle}
        >
          {currentStory.type === 'photo' && (
            <MotionView key={currentStory.id} style={imageEntry.animatedStyle}>
              <ProgressiveImage
                src={currentStory.mediaUrl}
                alt={currentStory.caption ?? 'Story'}
                className="w-full h-full object-contain select-none"
                aria-label={currentStory.caption ?? 'Story image'}
                draggable={false}
              />
            </MotionView>
          )}

          {currentStory.type === 'video' && (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              aria-label={`Video story by ${String(currentStory.userName ?? '')}`}
            />
          )}

          {currentStory.caption && (
            <div className="absolute bottom-24 left-0 right-0 px-4">
                                    <motion.div
                className="glass-strong p-4 rounded-2xl backdrop-blur-xl"
                style={captionAnimation.animatedStyle as any}
              >
                <p className="text-white text-center">{currentStory.caption}</p>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Interaction area */}
        {!isOwn && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 space-y-3">
            <AnimatePresence>
              {showReactions && (
                                      <motion.div
                  key="reactions"
                  style={reactionsAnimation.animatedStyle as any}
                  className="glass-strong p-4 rounded-2xl backdrop-blur-xl"
                  role="dialog"
                  aria-label="React to story"
                >
                  <div className="flex justify-center gap-4">
                    {STORY_REACTION_EMOJIS.map((emoji) => (
                                            <motion.button
                        key={emoji}
                        type="button"
                        className="text-4xl focus:outline-none focus:ring-2 focus:ring-white rounded-lg p-2"
                        style={combinedReactionButtonStyle as any}
                        onMouseEnter={reactionButtonHover.handleEnter}
                        onMouseLeave={reactionButtonHover.handleLeave}
                        onClick={() => {
                          reactionButtonTap.handlePress();
                          handleReaction(emoji);
                        }}
                        aria-label={`React with ${String(emoji ?? '')}`}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  value={replyText}
                  onChange={(e) => { setReplyText(e.target.value); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleReply();
                    }
                  }}
                  placeholder="Send a reply..."
                  className="glass-strong border-white/30 text-white placeholder:text-white/60 pr-12 backdrop-blur-xl"
                  aria-label="Reply to story"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setShowReactions(!showReactions); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  aria-label={showReactions ? 'Hide reactions' : 'Show reactions'}
                  aria-pressed={showReactions}
                >
                  <Heart size={20} weight={showReactions ? 'fill' : 'regular'} />
                </Button>
              </div>

              <Button
                onClick={() => void handleReply()}
                disabled={!replyText.trim()}
                size="icon"
                className="shrink-0 bg-white text-black hover:bg-white/90"
                aria-label="Send reply"
              >
                <PaperPlaneRight size={20} weight="fill" />
              </Button>
            </div>
          </div>
        )}

        {/* Analytics for story owner */}
        {isOwn && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
                                  <motion.div
              className="glass-strong p-4 rounded-2xl backdrop-blur-xl"
              style={analyticsAnimation.animatedStyle as any}
              role="region"
              aria-label="Story analytics"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-white text-2xl font-bold">{currentStory.viewCount}</p>
                    <p className="text-white/60 text-xs">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-2xl font-bold">{currentStory.reactions.length}</p>
                    <p className="text-white/60 text-xs">Reactions</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white"
                  aria-label="View detailed insights"
                >
                  View Insights
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      {showSaveDialog && currentStory && (
        <SaveToHighlightDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          story={currentStory}
          onSaved={() => {
            setShowSaveDialog(false);
          }}
        />
      )}
    </motion.div>
  );
}
