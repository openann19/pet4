import { useState, useEffect, useRef } from 'react'
import type { PanInfo} from 'framer-motion';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { X, CaretLeft, CaretRight, DownloadSimple, Share, DotsThree, Play, Pause, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { PostMedia, PostVideo } from '@/lib/community-types'
import { haptics } from '@/lib/haptics'
import { toast } from 'sonner'
import { useApp } from '@/contexts/AppContext'
import { createLogger } from '@/lib/logger'

const logger = createLogger('MediaViewer')

type MediaItem = PostMedia | (PostVideo & { type: 'video' })

interface MediaViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  media: MediaItem[]
  initialIndex?: number
  authorName?: string
}

export function MediaViewer({ 
  open, 
  onOpenChange, 
  media, 
  initialIndex = 0,
  authorName 
}: MediaViewerProps) {
  const { t } = useApp()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [direction, setDirection] = useState(0)
  const dragX = useMotionValue(0)
  const opacity = useTransform(dragX, [-200, 0, 200], [0.5, 1, 0.5])
  
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
      if (videoRef.current) {
        videoRef.current.pause()
      }
    }
  }, [open])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration)
      }
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

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

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    setShowVideoControls(true)
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowVideoControls(false)
      }
    }, 3000)
  }

  useEffect(() => {
    resetControlsTimeout()
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying])

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(prev => prev - 1)
      setIsZoomed(false)
      if (videoRef.current) {
        videoRef.current.pause()
      }
      haptics.selection()
    }
  }

  const handleNext = () => {
    if (currentIndex < media.length - 1) {
      setDirection(1)
      setCurrentIndex(prev => prev + 1)
      setIsZoomed(false)
      if (videoRef.current) {
        videoRef.current.pause()
      }
      haptics.selection()
    }
  }

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50
    const swipeVelocity = 500

    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > swipeVelocity) {
      if (info.offset.x > 0 && currentIndex > 0) {
        handlePrevious()
      } else if (info.offset.x < 0 && currentIndex < media.length - 1) {
        handleNext()
      }
    }

    dragX.set(0)
  }

  const handleImageClick = () => {
    setIsZoomed(!isZoomed)
    haptics.selection()
  }

  const handleVideoClick = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    resetControlsTimeout()
    haptics.impact()
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setIsMuted(!isMuted)
    haptics.selection()
  }

  const handleSeek = (value: number[]) => {
    if (!videoRef.current || value[0] === undefined) return
    const seekTime = value[0]
    videoRef.current.currentTime = seekTime
    setCurrentTime(seekTime)
    resetControlsTimeout()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = async () => {
    haptics.impact()
    try {
      const currentMedia = media[currentIndex]
      if (!currentMedia) {
        toast.error(t.community?.mediaNotAvailable || 'Media not available')
        return
      }
      const isVideo = currentMedia.type === 'video'
      const url = isVideo ? (currentMedia as PostVideo).url : currentMedia.url
      
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `pawfectmatch-${currentMedia.id}.${isVideo ? 'mp4' : 'jpg'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
      toast.success(t.community?.downloaded || `${isVideo ? 'Video' : 'Image'} downloaded`)
    } catch (error) {
      logger.error('Failed to download', error instanceof Error ? error : new Error(String(error)))
      toast.error(t.community?.downloadError || 'Failed to download')
    }
  }

  const handleShare = async () => {
    haptics.selection()
    const currentMedia = media[currentIndex]
    if (!currentMedia) {
      toast.error(t.community?.mediaNotAvailable || 'Media not available')
      return
    }
      const isVideo = currentMedia.type === 'video'
      const url = isVideo ? (currentMedia as PostVideo).url : currentMedia.url
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${isVideo ? 'Video' : 'Photo'} by ${authorName}`,
          url
        })
      } catch {
        // Share was cancelled by user - no need to log
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success(t.community?.linkCopied || 'Link copied to clipboard')
    }
  }

  const currentMedia = media[currentIndex]
  
  // Handle case where media is empty or index is out of bounds
  if (!currentMedia) {
    return null
  }
  
    const isVideo = currentMedia.type === 'video'

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
      scale: 0.9
    })
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onPointerDownOutside={(e) => e.preventDefault()}
          onMouseMove={isVideo ? resetControlsTimeout : undefined}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence>
              {(!isVideo || showVideoControls) && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
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
                        onClick={handleDownload}
                        className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                      >
                        <DownloadSimple size={22} weight="bold" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleShare}
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
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 }
                  }}
                  drag={!isZoomed && !isVideo ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  style={{ 
                    x: dragX,
                    opacity: !isVideo ? opacity : 1,
                    cursor: isVideo ? 'pointer' : (isZoomed ? 'zoom-out' : 'zoom-in')
                  }}
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
                      
                      <AnimatePresence>
                        {showVideoControls && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          >
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleVideoClick}
                              className="pointer-events-auto w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                            >
                              {isPlaying ? (
                                <Pause size={40} weight="fill" />
                              ) : (
                                <Play size={40} weight="fill" />
                              )}
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {showVideoControls && duration > 0 && !isNaN(duration) && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent"
                          >
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <motion.img
                      src={currentMedia.url}
                      alt={`Post media ${currentIndex + 1}`}
                      onClick={handleImageClick}
                      animate={{
                        scale: isZoomed ? 2 : 1
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                      }}
                      className="max-w-full max-h-full object-contain select-none"
                      draggable={false}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {media.length > 1 && (
              <>
                <AnimatePresence>
                  {currentIndex > 0 && showVideoControls && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-50"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevious}
                        className="h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
                      >
                        <CaretLeft size={32} weight="bold" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {currentIndex < media.length - 1 && showVideoControls && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-50"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNext}
                        className="h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
                      >
                        <CaretRight size={32} weight="bold" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                      if (videoRef.current) {
                        videoRef.current.pause()
                      }
                      haptics.selection()
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex 
                        ? 'w-8 bg-white' 
                        : 'w-2 bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`View ${media[index] && 'hlsUrl' in media[index] ? 'video' : 'photo'} ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {!isVideo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm"
              >
                {isZoomed ? t.community?.tapToZoomOut || 'Tap to zoom out' : t.community?.tapToZoom || 'Tap to zoom in'}
              </motion.div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
