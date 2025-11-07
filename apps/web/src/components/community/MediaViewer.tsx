'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, interpolate, Extrapolation } from 'react-native-reanimated'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useApp } from '@/contexts/AppContext'
import type { PostMedia, PostVideo } from '@/lib/community-types'
import { haptics } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'
import { CaretLeft, CaretRight, DotsThree, DownloadSimple, Pause, Play, Share, SpeakerHigh, SpeakerSlash, X } from '@phosphor-icons/react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { toastSuccess, toastError } from '@/effects/confetti-web'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useHoverTap } from '@/effects/reanimated'
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('MediaViewer')

export type MediaItem = PostMedia | (PostVideo & { type: 'video' })

interface MediaViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  media: MediaItem[]
  initialIndex?: number
  authorName?: string
}

interface SlideTransitionProps {
  children: React.ReactNode
  direction: number
  isVisible: boolean
}

function SlideTransition({ children, direction, isVisible }: SlideTransitionProps): JSX.Element | null {
  const translateX = useSharedValue(direction > 0 ? 1000 : -1000)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.9)

  useEffect(() => {
    if (isTruthy(isVisible)) {
      translateX.value = withSpring(0, springConfigs.smooth)
      opacity.value = withTiming(1, timingConfigs.fast)
      scale.value = withSpring(1, springConfigs.smooth)
    } else {
      translateX.value = withSpring(direction > 0 ? -1000 : 1000, springConfigs.smooth)
      opacity.value = withTiming(0, timingConfigs.fast)
      scale.value = withTiming(0.9, timingConfigs.fast)
    }
  }, [isVisible, direction, translateX, opacity, scale])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value }
      ],
      opacity: opacity.value
    }
  }) as AnimatedStyle

  if (!isVisible) return null

  return (
    <AnimatedView style={animatedStyle} className="absolute inset-0 flex items-center justify-center">
      {children}
    </AnimatedView>
  )
}

export function MediaViewer({ 
  open, 
  onOpenChange, 
  media, 
  initialIndex = 0,
  authorName 
}: MediaViewerProps): JSX.Element | null {
  const { t } = useApp()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [direction, setDirection] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragX = useSharedValue(0)
  const dragStartX = useRef<number>(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showVideoControls, setShowVideoControls] = useState(true)
  const controlsTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex, open])

  useEffect(() => {
    if (!open) {
      setIsZoomed(false)
      setDirection(0)
      setIsPlaying(false)
      dragX.value = 0
      if (isTruthy(videoRef.current)) {
        videoRef.current.pause()
      }
    }
  }, [open, dragX])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => { setCurrentTime(video.currentTime); }
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration)
      }
    }
    const handlePlay = () => { setIsPlaying(true); }
    const handlePause = () => { setIsPlaying(false); }
    const handleEnded = () => { setIsPlaying(false); }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [currentIndex, media])

  const resetControlsTimeout = useCallback(() => {
    if (isTruthy(controlsTimeoutRef.current)) {
      clearTimeout(controlsTimeoutRef.current)
    }
    setShowVideoControls(true)
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isTruthy(isPlaying)) {
        setShowVideoControls(false)
      }
    }, 3000)
  }, [isPlaying])

  useEffect(() => {
    resetControlsTimeout()
    return () => {
      if (isTruthy(controlsTimeoutRef.current)) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [resetControlsTimeout])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(prev => prev - 1)
      setIsZoomed(false)
      if (isTruthy(videoRef.current)) {
        videoRef.current.pause()
      }
      haptics.selection()
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < media.length - 1) {
      setDirection(1)
      setCurrentIndex(prev => prev + 1)
      setIsZoomed(false)
      if (isTruthy(videoRef.current)) {
        videoRef.current.pause()
      }
      haptics.selection()
    }
  }, [currentIndex, media.length])

  const handleDragStart = useCallback((clientX: number) => {
    if (isZoomed || currentMedia?.type === 'video') return
    setIsDragging(true)
    dragStartX.current = clientX
  }, [isZoomed])

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || isZoomed || currentMedia?.type === 'video') return
    const delta = clientX - dragStartX.current
    dragX.value = delta
  }, [isDragging, isZoomed, dragX])

  const handleDragEnd = useCallback((clientX: number) => {
    if (!isDragging || isZoomed || currentMedia?.type === 'video') {
      setIsDragging(false)
      dragX.value = withSpring(0, springConfigs.smooth)
      return
    }

    const delta = clientX - dragStartX.current
    const swipeThreshold = 50

    if (Math.abs(delta) > swipeThreshold) {
      if (delta > 0 && currentIndex > 0) {
        handlePrevious()
      } else if (delta < 0 && currentIndex < media.length - 1) {
        handleNext()
      }
    }

    setIsDragging(false)
    dragX.value = withSpring(0, springConfigs.smooth)
  }, [isDragging, isZoomed, currentIndex, media.length, handlePrevious, handleNext, dragX])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleDragStart(e.clientX)
  }, [handleDragStart])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isTruthy(isDragging)) {
      handleDragMove(e.clientX)
    } else if (currentMedia?.type === 'video') {
      resetControlsTimeout()
    }
  }, [isDragging, handleDragMove, currentMedia?.type, resetControlsTimeout])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    handleDragEnd(e.clientX)
  }, [handleDragEnd])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTruthy(e.touches[0])) {
      handleDragStart(e.touches[0].clientX)
    }
  }, [handleDragStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches[0] && isDragging) {
      handleDragMove(e.touches[0].clientX)
    }
  }, [isDragging, handleDragMove])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isTruthy(e.changedTouches[0])) {
      handleDragEnd(e.changedTouches[0].clientX)
    }
  }, [handleDragEnd])

  const handleImageClick = useCallback(() => {
    setIsZoomed(!isZoomed)
    haptics.selection()
  }, [isZoomed])

  const handleVideoClick = useCallback(() => {
    if (!videoRef.current) return
    
    if (isTruthy(isPlaying)) {
      videoRef.current.pause()
    } else {
      void videoRef.current.play().catch(() => {
        // Play failed - silently fail
      })
    }
    resetControlsTimeout()
    haptics.impact()
  }, [isPlaying, resetControlsTimeout])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setIsMuted(!isMuted)
    haptics.selection()
  }, [isMuted])

  const handleSeek = useCallback((value: number[]) => {
    if (!videoRef.current || value[0] === undefined) return
    const seekTime = value[0]
    videoRef.current.currentTime = seekTime
    setCurrentTime(seekTime)
    resetControlsTimeout()
  }, [resetControlsTimeout])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(mins ?? '')}:${String(secs.toString().padStart(2, '0') ?? '')}`
  }, [])

  const handleDownload = useCallback(async () => {
    haptics.impact()
    try {
      const currentMedia = media[currentIndex]
      if (!currentMedia) {
        toastError(t.community?.mediaNotAvailable || 'Media not available')
        return
      }
      const isVideo = currentMedia.type === 'video'
      const url = isVideo ? (currentMedia as PostVideo).url : currentMedia.url
      
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `pawfectmatch-${String(currentMedia.id ?? '')}.${String(isVideo ? 'mp4' : 'jpg' ?? '')}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
      toastSuccess(t.community?.downloaded || `${String(isVideo ? 'Video' : 'Image' ?? '')} downloaded`)
    } catch (error) {
      logger.error('Failed to download', error instanceof Error ? error : new Error(String(error)))
      toastError(t.community?.downloadError || 'Failed to download')
    }
  }, [currentIndex, media, t, logger])

  const handleShare = useCallback(async () => {
    haptics.selection()
    const currentMedia = media[currentIndex]
    if (!currentMedia) {
      toastError(t.community?.mediaNotAvailable || 'Media not available')
      return
    }
    const isVideo = currentMedia.type === 'video'
    const url = isVideo ? (currentMedia as PostVideo).url : currentMedia.url
    
    if (isTruthy(navigator.share)) {
      try {
        await navigator.share({
          title: `${String(isVideo ? 'Video' : 'Photo' ?? '')} by ${String(authorName ?? '')}`,
          url
        })
      } catch {
        // Share was cancelled by user - no need to log
      }
    } else {
      void navigator.clipboard.writeText(url).then(() => {
        toastSuccess(t.community?.linkCopied || 'Link copied to clipboard')
      }).catch(() => {
        // Clipboard write failed - silently fail
      })
    }
  }, [currentIndex, media, authorName, t])

  const currentMedia = media[currentIndex]
  
  if (!currentMedia) {
    return null
  }
  
  const isVideo = currentMedia.type === 'video'

  const dragOpacity = useAnimatedStyle(() => {
    if (isTruthy(isVideo)) return { opacity: 1 }
    const opacityValue = interpolate(
      dragX.value,
      [-200, 0, 200],
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    )
    return { opacity: opacityValue }
  }) as AnimatedStyle

  const mediaContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: dragX.value }]
    }
  }) as AnimatedStyle

  const headerOpacity = useSharedValue(showVideoControls || !isVideo ? 1 : 0)
  const headerTranslateY = useSharedValue(0)

  useEffect(() => {
    if (showVideoControls || !isVideo) {
      headerOpacity.value = withTiming(1, timingConfigs.fast)
      headerTranslateY.value = withTiming(0, timingConfigs.fast)
    } else {
      headerOpacity.value = withTiming(0, timingConfigs.fast)
      headerTranslateY.value = withTiming(-20, timingConfigs.fast)
    }
  }, [showVideoControls, isVideo, headerOpacity, headerTranslateY])

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: headerTranslateY.value }]
    }
  }) as AnimatedStyle

  const imageScale = useSharedValue(isZoomed ? 2 : 1)

  useEffect(() => {
    imageScale.value = withSpring(isZoomed ? 2 : 1, springConfigs.smooth)
  }, [isZoomed, imageScale])

  const imageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: imageScale.value }]
    }
  }) as AnimatedStyle

  const videoControlsOpacity = useSharedValue(showVideoControls ? 1 : 0)
  const videoControlsTranslateY = useSharedValue(0)

  useEffect(() => {
    if (isTruthy(showVideoControls)) {
      videoControlsOpacity.value = withTiming(1, timingConfigs.fast)
      videoControlsTranslateY.value = withTiming(0, timingConfigs.fast)
    } else {
      videoControlsOpacity.value = withTiming(0, timingConfigs.fast)
      videoControlsTranslateY.value = withTiming(20, timingConfigs.fast)
    }
  }, [showVideoControls, videoControlsOpacity, videoControlsTranslateY])

  const videoControlsStyle = useAnimatedStyle(() => {
    return {
      opacity: videoControlsOpacity.value,
      transform: [{ translateY: videoControlsTranslateY.value }]
    }
  }) as AnimatedStyle

  const playButtonHover = useHoverTap({
    hoverScale: 1.1,
    tapScale: 0.95
  })

  const navButtonLeftOpacity = useSharedValue(currentIndex > 0 && showVideoControls ? 1 : 0)
  const navButtonLeftTranslateX = useSharedValue(-20)

  useEffect(() => {
    if (currentIndex > 0 && showVideoControls) {
      navButtonLeftOpacity.value = withTiming(1, timingConfigs.fast)
      navButtonLeftTranslateX.value = withTiming(0, timingConfigs.fast)
    } else {
      navButtonLeftOpacity.value = withTiming(0, timingConfigs.fast)
      navButtonLeftTranslateX.value = withTiming(-20, timingConfigs.fast)
    }
  }, [currentIndex, showVideoControls, navButtonLeftOpacity, navButtonLeftTranslateX])

  const navButtonLeftStyle = useAnimatedStyle(() => {
    return {
      opacity: navButtonLeftOpacity.value,
      transform: [{ translateX: navButtonLeftTranslateX.value }]
    }
  }) as AnimatedStyle

  const navButtonRightOpacity = useSharedValue(currentIndex < media.length - 1 && showVideoControls ? 1 : 0)
  const navButtonRightTranslateX = useSharedValue(20)

  useEffect(() => {
    if (currentIndex < media.length - 1 && showVideoControls) {
      navButtonRightOpacity.value = withTiming(1, timingConfigs.fast)
      navButtonRightTranslateX.value = withTiming(0, timingConfigs.fast)
    } else {
      navButtonRightOpacity.value = withTiming(0, timingConfigs.fast)
      navButtonRightTranslateX.value = withTiming(20, timingConfigs.fast)
    }
  }, [currentIndex, media.length, showVideoControls, navButtonRightOpacity, navButtonRightTranslateX])

  const navButtonRightStyle = useAnimatedStyle(() => {
    return {
      opacity: navButtonRightOpacity.value,
      transform: [{ translateX: navButtonRightTranslateX.value }]
    }
  }) as AnimatedStyle

  const hintOpacity = useSharedValue(0)

  useEffect(() => {
    if (!isVideo) {
      hintOpacity.value = withDelay(500, withTiming(1, timingConfigs.smooth))
    } else {
      hintOpacity.value = 0
    }
  }, [isVideo, hintOpacity])

  const hintStyle = useAnimatedStyle(() => {
    return {
      opacity: hintOpacity.value
    }
  }) as AnimatedStyle

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
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
              <AnimatedView style={headerStyle} className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { onOpenChange(false); }}
                      className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
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

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        void handleDownload()
                      }}
                      className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                    >
                      <DownloadSimple size={22} weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        void handleShare()
                      }}
                      className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                    >
                      <Share size={22} weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                    >
                      <DotsThree size={22} weight="bold" />
                    </Button>
                  </div>
                </div>
              </AnimatedView>
            )}

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <SlideTransition direction={direction} isVisible={true}>
                <AnimatedView 
                  style={[mediaContainerStyle, dragOpacity]}
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
                        onClick={handleVideoClick}
                      />
                      
                      {showVideoControls && (
                        <AnimatedView style={videoControlsStyle} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <AnimatedView
                            style={playButtonHover.animatedStyle}
                            onMouseEnter={playButtonHover.handleMouseEnter}
                            onMouseLeave={playButtonHover.handleMouseLeave}
                            onClick={handleVideoClick}
                            className="pointer-events-auto w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors cursor-pointer"
                          >
                            {isPlaying ? (
                              <Pause size={40} weight="fill" />
                            ) : (
                              <Play size={40} weight="fill" />
                            )}
                          </AnimatedView>
                        </AnimatedView>
                      )}

                      {showVideoControls && duration > 0 && !isNaN(duration) && (
                        <AnimatedView style={videoControlsStyle} className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleVideoClick}
                              className="h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm shrink-0"
                            >
                              {isPlaying ? (
                                <Pause size={20} weight="fill" />
                              ) : (
                                <Play size={20} weight="fill" />
                              )}
                            </Button>

                            <span className="text-white text-sm font-medium min-w-[45px]">
                              {formatTime(currentTime)}
                            </span>

                            <Slider
                              value={[currentTime]}
                              max={duration || 0}
                              step={0.1}
                              onValueChange={handleSeek}
                              className="flex-1"
                            />

                            <span className="text-white/60 text-sm min-w-[45px] text-right">
                              {formatTime(duration || 0)}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={toggleMute}
                              className="h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm shrink-0"
                            >
                              {isMuted ? (
                                <SpeakerSlash size={20} weight="fill" />
                              ) : (
                                <SpeakerHigh size={20} weight="fill" />
                              )}
                            </Button>
                          </div>
                        </AnimatedView>
                      )}
                    </div>
                  ) : (
                    <AnimatedView
                      style={imageStyle}
                      onClick={handleImageClick}
                      className="max-w-full max-h-full cursor-zoom-in select-none"
                    >
                      <img
                        src={currentMedia.url}
                        alt={`Post media ${String(currentIndex + 1 ?? '')}`}
                        className="max-w-full max-h-full object-contain select-none"
                        draggable={false}
                      />
                    </AnimatedView>
                  )}
                </AnimatedView>
              </SlideTransition>
            </div>

            {media.length > 1 && (
              <>
                {currentIndex > 0 && (
                  <AnimatedView style={navButtonLeftStyle} className="absolute left-4 top-1/2 -translate-y-1/2 z-50">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePrevious}
                      className="h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
                    >
                      <CaretLeft size={32} weight="bold" />
                    </Button>
                  </AnimatedView>
                )}

                {currentIndex < media.length - 1 && (
                  <AnimatedView style={navButtonRightStyle} className="absolute right-4 top-1/2 -translate-y-1/2 z-50">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNext}
                      className="h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
                    >
                      <CaretRight size={32} weight="bold" />
                    </Button>
                  </AnimatedView>
                )}
              </>
            )}

            {media.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                {media.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1)
                      setCurrentIndex(index)
                      if (isTruthy(videoRef.current)) {
                        videoRef.current.pause()
                      }
                      haptics.selection()
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      String(index === currentIndex 
                                                ? 'w-8 bg-white' 
                                                : 'w-2 bg-white/50 hover:bg-white/75' ?? '')
                    }`}
                    aria-label={`View ${String(media[index]?.type === 'video' ? 'video' : 'photo' ?? '')} ${String(index + 1 ?? '')}`}
                  />
                ))}
              </div>
            )}

            {!isVideo && (
              <AnimatedView style={hintStyle} className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                {isZoomed ? t.community?.tapToZoomOut || 'Tap to zoom out' : t.community?.tapToZoom || 'Tap to zoom in'}
              </AnimatedView>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
