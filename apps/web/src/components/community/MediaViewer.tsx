'use client';;
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useSharedValue,
  use
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  MotionView,
} from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useApp } from '@/contexts/AppContext';
import type { PostMedia, PostVideo } from '@/lib/community-types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import {
  CaretLeft,
  CaretRight,
  DotsThree,
  DownloadSimple,
  Pause,
  Play,
  Share,
  SpeakerHigh,
  SpeakerSlash,
  X,
} from '@phosphor-icons/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { useHoverTap } from '@/effects/reanimated';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import type  from '@petspark/motion';

const logger = createLogger('MediaViewer');

export type MediaItem = PostMedia | (PostVideo & { type: 'video' });

interface MediaViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem[];
  initialIndex?: number;
  authorName?: string;
}

interface SlideTransitionProps {
  children: React.ReactNode;
  direction: number;
  isVisible: boolean;
}

function SlideTransition({
  children,
  direction,
  isVisible,
}: SlideTransitionProps): JSX.Element | null {
  const translateX = useSharedValue<number>(direction > 0 ? 1000 : -1000);
  const opacity = useSharedValue<number>(0);
  const scale = useSharedValue<number>(0.9);

  useEffect(() => {
    if (isVisible) {
      translateX.value = withSpring(0, springConfigs.smooth) as unknown as number;
      opacity.value = withTiming(1, timingConfigs.fast) as unknown as number;
      scale.value = withSpring(1, springConfigs.smooth) as unknown as number;
    } else {
      const targetX = direction > 0 ? -1000 : 1000;
      translateX.value = withSpring(targetX, springConfigs.smooth) as unknown as number;
      opacity.value = withTiming(0, timingConfigs.fast) as unknown as number;
      scale.value = withTiming(0.9, timingConfigs.fast) as unknown as number;
    }
  }, [isVisible, direction, translateX, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number>[] = [];
    transforms.push({ translateX: translateX.value });
    transforms.push({ scale: scale.value });
    return {
      transform: transforms,
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  if (!isVisible) return null;

  return (
    <MotionView
      style={animatedStyle as Record<string, unknown>}
      className="absolute inset-0 flex items-center justify-center"
    >
      {children}
    </MotionView>
  );
}

export function MediaViewer({
  open,
  onOpenChange,
  media,
  initialIndex = 0,
  authorName,
}: MediaViewerProps): JSX.Element | null {
  const { t } = useApp();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragX = useSharedValue<number>(0);
  const dragStartX = useRef<number>(0);

  // Get current media early for use in callbacks
  const currentMedia = media[currentIndex];

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, open]);

  useEffect(() => {
    if (!open) {
      setIsZoomed(false);
      setDirection(0);
      setIsPlaying(false);
      dragX.value = 0;
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [open, dragX]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, media]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowVideoControls(true);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowVideoControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      setIsZoomed(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      haptics.selection();
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < media.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      setIsZoomed(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      haptics.selection();
    }
  }, [currentIndex, media.length]);

  const handleDragStart = useCallback(
    (clientX: number) => {
      if (isZoomed || currentMedia?.type === 'video') return;
      setIsDragging(true);
      dragStartX.current = clientX;
    },
    [isZoomed]
  );

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging || isZoomed || currentMedia?.type === 'video') return;
      const delta = clientX - dragStartX.current;
      dragX.value = delta;
    },
    [isDragging, isZoomed, dragX, currentMedia?.type]
  );

  const handleDragEnd = useCallback(
    (clientX: number) => {
      if (!isDragging || isZoomed || currentMedia?.type === 'video') {
        setIsDragging(false);
        dragX.value = withSpring(0, springConfigs.smooth) as unknown as number;
        return;
      }

      const delta = clientX - dragStartX.current;
      const swipeThreshold = 50;

      if (Math.abs(delta) > swipeThreshold) {
        if (delta > 0 && currentIndex > 0) {
          handlePrevious();
        } else if (delta < 0 && currentIndex < media.length - 1) {
          handleNext();
        }
      }

      setIsDragging(false);
      dragX.value = withSpring(0, springConfigs.smooth) as unknown as number;
    },
    [isDragging, isZoomed, currentIndex, media.length, handlePrevious, handleNext, dragX]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleDragStart(e.clientX);
    },
    [handleDragStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        handleDragMove(e.clientX);
      } else if (currentMedia?.type === 'video') {
        resetControlsTimeout();
      }
    },
    [isDragging, handleDragMove, currentMedia?.type, resetControlsTimeout]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      handleDragEnd(e.clientX);
    },
    [handleDragEnd]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches[0]) {
        handleDragStart(e.touches[0].clientX);
      }
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches[0] && isDragging) {
        handleDragMove(e.touches[0].clientX);
      }
    },
    [isDragging, handleDragMove]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.changedTouches[0]) {
        handleDragEnd(e.changedTouches[0].clientX);
      }
    },
    [handleDragEnd]
  );

  const handleImageClick = useCallback(() => {
    setIsZoomed(!isZoomed);
    haptics.selection();
  }, [isZoomed]);

  const handleVideoClick = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      void videoRef.current.play().catch(() => {
        // Play failed - silently fail
      });
    }
    resetControlsTimeout();
    haptics.impact();
  }, [isPlaying, resetControlsTimeout]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
    haptics.selection();
  }, [isMuted]);

  const handleSeek = useCallback(
    (value: number[]) => {
      if (!videoRef.current || value[0] === undefined) return;
      const seekTime = value[0];
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      resetControlsTimeout();
    },
    [resetControlsTimeout]
  );

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleDownload = useCallback(async () => {
    haptics.impact();
    try {
      const currentMedia = media[currentIndex];
      if (!currentMedia) {
        toast.error(t.community?.mediaNotAvailable ?? 'Media not available');
        return;
      }
      const isVideo = currentMedia.type === 'video';
      const url = isVideo ? (currentMedia as PostVideo).url : currentMedia.url;

      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `pawfectmatch-${currentMedia.id}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(t.community?.downloaded ?? `${isVideo ? 'Video' : 'Image'} downloaded`);
    } catch (_error) {
      logger.error('Failed to download', _error instanceof Error ? _error : new Error(String(_error)));
      toast.error(t.community?.downloadError ?? 'Failed to download');
    }
  }, [currentIndex, media, t, logger]);

  const handleShare = useCallback(async () => {
    haptics.selection();
    const currentMedia = media[currentIndex];
    if (!currentMedia) {
      toast.error(t.community?.mediaNotAvailable ?? 'Media not available');
      return;
    }
    const isVideo = currentMedia.type === 'video';
    const url = isVideo ? (currentMedia as PostVideo).url : currentMedia.url;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${isVideo ? 'Video' : 'Photo'} by ${authorName}`,
          url,
        });
      } catch {
        // Share was cancelled by user - no need to log
      }
    } else {
      void navigator.clipboard
        .writeText(url)
        .then(() => {
          toast.success(t.community?.linkCopied ?? 'Link copied to clipboard');
        })
        .catch(() => {
          // Clipboard write failed - silently fail
        });
    }
  }, [currentIndex, media, authorName, t]);

  if (!currentMedia) {
    return null;
  }

  const isVideo = currentMedia.type === 'video';

  const dragOpacity = useAnimatedStyle(() => {
    if (isVideo) return { opacity: 1 };
    const       opacityValue = interpolate(
      dragX.value,
      [-200, 0, 200],
      [0.5, 1, 0.5],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
    return { opacity: opacityValue };
  }) as AnimatedStyle;

  const mediaContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: dragX.value }],
    };
  }) as AnimatedStyle;

  const headerOpacity = useSharedValue<number>(showVideoControls || !isVideo ? 1 : 0);
  const headerTranslateY = useSharedValue<number>(0);

  useEffect(() => {
    if (showVideoControls || !isVideo) {
      headerOpacity.value = withTiming(1, timingConfigs.fast) as unknown as number;
      headerTranslateY.value = withTiming(0, timingConfigs.fast) as unknown as number;
    } else {
      headerOpacity.value = withTiming(0, timingConfigs.fast) as unknown as number;
      headerTranslateY.value = withTiming(-20, timingConfigs.fast) as unknown as number;
    }
  }, [showVideoControls, isVideo, headerOpacity, headerTranslateY]);

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: headerTranslateY.value }],
    };
  }) as AnimatedStyle;

  const imageScale = useSharedValue<number>(isZoomed ? 2 : 1);

  useEffect(() => {
    const targetScale = isZoomed ? 2 : 1;
    imageScale.value = withSpring(targetScale, springConfigs.smooth) as unknown as number;
  }, [isZoomed, imageScale]);

  const imageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: imageScale.value }],
    };
  }) as AnimatedStyle;

  const videoControlsOpacity = useSharedValue<number>(showVideoControls ? 1 : 0);
  const videoControlsTranslateY = useSharedValue<number>(0);

  useEffect(() => {
    if (showVideoControls) {
      videoControlsOpacity.value = withTiming(1, timingConfigs.fast) as unknown as number;
      videoControlsTranslateY.value = withTiming(0, timingConfigs.fast) as unknown as number;
    } else {
      videoControlsOpacity.value = withTiming(0, timingConfigs.fast) as unknown as number;
      videoControlsTranslateY.value = withTiming(20, timingConfigs.fast) as unknown as number;
    }
  }, [showVideoControls, videoControlsOpacity, videoControlsTranslateY]);

  const videoControlsStyle = useAnimatedStyle(() => {
    return {
      opacity: videoControlsOpacity.value,
      transform: [{ translateY: videoControlsTranslateY.value }],
    };
  }) as AnimatedStyle;

  const playButtonHover = useHoverTap({
    hoverScale: 1.1,
    tapScale: 0.95,
  });

  const navButtonLeftOpacity = useSharedValue<number>(currentIndex > 0 && showVideoControls ? 1 : 0);
  const navButtonLeftTranslateX = useSharedValue<number>(-20);

  useEffect(() => {
    if (currentIndex > 0 && showVideoControls) {
      navButtonLeftOpacity.value = withTiming(1, timingConfigs.fast) as unknown as number;
      navButtonLeftTranslateX.value = withTiming(0, timingConfigs.fast) as unknown as number;
    } else {
      navButtonLeftOpacity.value = withTiming(0, timingConfigs.fast) as unknown as number;
      navButtonLeftTranslateX.value = withTiming(-20, timingConfigs.fast) as unknown as number;
    }
  }, [currentIndex, showVideoControls, navButtonLeftOpacity, navButtonLeftTranslateX]);

  const navButtonLeftStyle = useAnimatedStyle(() => {
    return {
      opacity: navButtonLeftOpacity.value,
      transform: [{ translateX: navButtonLeftTranslateX.value }],
    };
  }) as AnimatedStyle;

  const navButtonRightOpacity = useSharedValue<number>(
    currentIndex < media.length - 1 && showVideoControls ? 1 : 0
  );
  const navButtonRightTranslateX = useSharedValue<number>(20);

  useEffect(() => {
    if (currentIndex < media.length - 1 && showVideoControls) {
      navButtonRightOpacity.value = withTiming(1, timingConfigs.fast) as unknown as number;
      navButtonRightTranslateX.value = withTiming(0, timingConfigs.fast) as unknown as number;
    } else {
      navButtonRightOpacity.value = withTiming(0, timingConfigs.fast) as unknown as number;
      navButtonRightTranslateX.value = withTiming(20, timingConfigs.fast) as unknown as number;
    }
  }, [
    currentIndex,
    media.length,
    showVideoControls,
    navButtonRightOpacity,
    navButtonRightTranslateX,
  ]);

  const navButtonRightStyle = useAnimatedStyle(() => {
    return {
      opacity: navButtonRightOpacity.value,
      transform: [{ translateX: navButtonRightTranslateX.value }],
    };
  }) as AnimatedStyle;

  const hintOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isVideo) {
      hintOpacity.value = withDelay(500, withTiming(1, timingConfigs.smooth));
    } else {
      hintOpacity.value = 0;
    }
  }, [isVideo, hintOpacity]);

  const hintStyle = useAnimatedStyle(() => {
    return {
      opacity: hintOpacity.value,
    };
  }) as AnimatedStyle;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/98 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center"
          onPointerDownOutside={(e) => { e.preventDefault(); }}
        >
          <div
            className="relative w-full h-full flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {(showVideoControls || !isVideo) && (
              <MotionView
                style={headerStyle}
                className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { onOpenChange(false); }}
                      className="h-9 w-9 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors"
                    >
                      <X size={24} />
                    </Button>
                    {authorName && (
                      <div className="text-white">
                        <p className="text-sm font-medium">{authorName}</p>
                        <p className="text-xs text-white/60">
                          {currentIndex + 1} / {media.length}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        void handleDownload();
                      }}
                      className="h-9 w-9 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors"
                    >
                      <DownloadSimple size={22} weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        void handleShare();
                      }}
                      className="h-9 w-9 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors"
                    >
                      <Share size={22} weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors"
                    >
                      <DotsThree size={22} weight="bold" />
                    </Button>
                  </div>
                </div>
              </MotionView>
            )}

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <SlideTransition direction={direction} isVisible={true}>
                <MotionView
                  style={{ ...mediaContainerStyle, ...dragOpacity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {isVideo ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video
                        ref={videoRef}
                        src={(currentMedia as PostVideo).url}
                        poster={(currentMedia as PostVideo).thumbnail}
                        className="max-w-full max-h-full object-contain"
                        playsInline
                        onClick={() => void handleVideoClick()}
                      />

                      {showVideoControls && (
                        <MotionView
                          style={videoControlsStyle}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <MotionView
                            style={playButtonHover.animatedStyle}
                            onMouseEnter={playButtonHover.handleMouseEnter}
                            onMouseLeave={playButtonHover.handleMouseLeave}
                            onClick={() => void handleVideoClick()}
                            className="pointer-events-auto w-20 h-20 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black/90 transition-colors cursor-pointer"
                          >
                            {isPlaying ? (
                              <Pause size={40} weight="fill" />
                            ) : (
                              <Play size={40} weight="fill" />
                            )}
                          </MotionView>
                        </MotionView>
                      )}

                      {showVideoControls && duration > 0 && !isNaN(duration) && (
                        <MotionView
                          style={videoControlsStyle}
                          className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent"
                        >
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void handleVideoClick()}
                              className="h-9 w-9 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors shrink-0"
                            >
                              {isPlaying ? (
                                <Pause size={20} weight="fill" />
                              ) : (
                                <Play size={20} weight="fill" />
                              )}
                            </Button>

                            <span className="text-white text-xs font-medium min-w-[3rem] text-center">
                              {formatTime(currentTime)}
                            </span>

                            <Slider
                              value={[currentTime]}
                              max={duration || 0}
                              step={0.1}
                              onValueChange={handleSeek}
                              className="flex-1"
                            />

                            <span className="text-white/60 text-xs min-w-[3rem] text-right">
                              {formatTime(duration || 0)}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void toggleMute()}
                              className="h-9 w-9 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors shrink-0"
                            >
                              {isMuted ? (
                                <SpeakerSlash size={20} weight="fill" />
                              ) : (
                                <SpeakerHigh size={20} weight="fill" />
                              )}
                            </Button>
                          </div>
                        </MotionView>
                      )}
                    </div>
                  ) : (
                    <MotionView
                      style={imageStyle}
                      onClick={() => void handleImageClick()}
                      className="max-w-full max-h-full cursor-zoom-in select-none"
                    >
                      <img
                        src={currentMedia.url}
                          alt={`Post media ${String(currentIndex + 1)}`}
                        className="max-w-full max-h-full object-contain select-none"
                        draggable={false}
                      />
                    </MotionView>
                  )}
                </MotionView>
              </SlideTransition>
            </div>

            {media.length > 1 && (
              <>
                {currentIndex > 0 && (
                  <MotionView
                    style={navButtonLeftStyle}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handlePrevious()}
                      className="h-10 w-10 rounded-full bg-black/70 hover:bg-black/90 text-white shadow-lg"
                    >
                      <CaretLeft size={32} weight="bold" />
                    </Button>
                  </MotionView>
                )}

                {currentIndex < media.length - 1 && (
                  <MotionView
                    style={navButtonRightStyle}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleNext()}
                      className="h-10 w-10 rounded-full bg-black/70 hover:bg-black/90 text-white shadow-lg"
                    >
                      <CaretRight size={32} weight="bold" />
                    </Button>
                  </MotionView>
                )}
              </>
            )}

            {media.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/70 px-4 py-2 rounded-full shadow-lg">
                {media.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                      if (videoRef.current) {
                        videoRef.current.pause();
                      }
                      haptics.selection();
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                    }`}
                      aria-label={`View ${String(media[index]?.type === 'video' ? 'video' : 'photo')} ${String(index + 1)}`}
                  />
                ))}
              </div>
            )}

            {!isVideo && (
              <MotionView
                style={hintStyle}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm"
              >
                {isZoomed
                  ? t.community?.tapToZoomOut ?? 'Tap to zoom out'
                  : t.community?.tapToZoom ?? 'Tap to zoom in'}
              </MotionView>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
