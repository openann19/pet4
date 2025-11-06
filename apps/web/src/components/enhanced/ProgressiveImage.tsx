import { useState, useEffect, useRef, useCallback } from 'react'
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { Presence } from '@petspark/motion'
import { cn } from '@/lib/utils'

interface ProgressiveImageProps {
  src: string
  alt: string
  placeholderSrc?: string
  className?: string
  containerClassName?: string
  blurAmount?: number
  aspectRatio?: string
  priority?: boolean
  sizes?: string
  onLoad?: () => void
  onError?: (error: Error) => void
}

export function ProgressiveImage({
  src,
  alt,
  placeholderSrc,
  className,
  containerClassName,
  blurAmount = 20,
  aspectRatio,
  priority = false,
  sizes,
  onLoad,
  onError
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || src)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const loadImage = useCallback(() => {
    const img = new Image()
    
    img.onload = () => {
      setCurrentSrc(src)
      setIsLoaded(true)
      onLoad?.()
    }
    
    img.onerror = () => {
      const err = new Error(`Failed to load image: ${src}`)
      setError(true)
      onError?.(err)
    }
    
    img.src = src
  }, [src, onLoad, onError])

  useEffect(() => {
    if (priority) {
      loadImage()
      return
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage()
            observer.disconnect()
          }
        })
      },
      { rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [src, priority, loadImage])

  const placeholderOpacity = useSharedValue(1)
  const imageOpacity = useSharedValue(0)

  useEffect(() => {
    if (isLoaded) {
      placeholderOpacity.value = withTiming(0, { duration: 300 })
      imageOpacity.value = withTiming(1, { duration: 300 })
    }
  }, [isLoaded, placeholderOpacity, imageOpacity])

  const placeholderStyle = useAnimatedStyle(() => ({
    opacity: placeholderOpacity.value,
  }))

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }))

  return (
    <div
      className={cn('relative overflow-hidden', containerClassName)}
      style={{ aspectRatio }}
    >
      <Presence visible={!isLoaded && !!placeholderSrc}>
        <AnimatedView
          style={placeholderStyle}
          className={cn('absolute inset-0 w-full h-full', className)}
        >
          <img
            ref={imgRef}
            src={placeholderSrc}
            alt={alt}
            className={cn('w-full h-full object-cover', className)}
            style={{ filter: `blur(${blurAmount}px)` }}
          />
        </AnimatedView>
      </Presence>

      <AnimatedView style={imageStyle} className={cn('w-full h-full', className)}>
        <img
          src={currentSrc}
          alt={alt}
          className={cn('w-full h-full object-cover', className)}
          sizes={sizes}
        />
      </AnimatedView>

      {!isLoaded && !placeholderSrc && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Failed to load image
        </div>
      )}
    </div>
  )
}
