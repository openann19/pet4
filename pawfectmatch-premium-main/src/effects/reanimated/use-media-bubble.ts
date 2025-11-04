'use client'

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
  type SharedValue
} from 'react-native-reanimated'
import { useCallback, useEffect } from 'react'
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions'

export type MediaType = 'image' | 'video' | 'voice'

export interface UseMediaBubbleOptions {
  type: MediaType
  isLoaded?: boolean
  isPlaying?: boolean
  onZoom?: () => void
  waveform?: number[]
}

export interface UseMediaBubbleReturn {
  imageOpacity: SharedValue<number>
  imageScale: SharedValue<number>
  zoomModalOpacity: SharedValue<number>
  zoomModalScale: SharedValue<number>
  waveformScales: SharedValue<number>[]
  imageStyle: ReturnType<typeof useAnimatedStyle>
  zoomModalStyle: ReturnType<typeof useAnimatedStyle>
  waveformStyles: ReturnType<typeof useAnimatedStyle>[]
  handleImageLoad: () => void
  handleImageTap: () => void
  closeZoom: () => void
}

const DEFAULT_IS_LOADED = false
const DEFAULT_IS_PLAYING = false

export function useMediaBubble(
  options: UseMediaBubbleOptions
): UseMediaBubbleReturn {
  const {
    type,
    isLoaded = DEFAULT_IS_LOADED,
    isPlaying = DEFAULT_IS_PLAYING,
    onZoom,
    waveform = []
  } = options

  const imageOpacity = useSharedValue(0)
  const imageScale = useSharedValue(0.95)
  const zoomModalOpacity = useSharedValue(0)
  const zoomModalScale = useSharedValue(0.9)

  const waveformScales = Array.from({ length: 20 }, () => useSharedValue(0.3))

  useEffect(() => {
    if (isLoaded && type === 'image') {
      imageOpacity.value = withSpring(1, springConfigs.smooth)
      imageScale.value = withSpring(1, springConfigs.bouncy)
    }
  }, [isLoaded, type, imageOpacity, imageScale])

  useEffect(() => {
    if (type === 'voice') {
      waveformScales.forEach((scale, index) => {
        if (isPlaying) {
          const baseValue = waveform[index] ?? 0.3
          const variation = Math.random() * 0.3
          scale.value = withSequence(
            withTiming(baseValue + variation, { duration: 200 }),
            withTiming(Math.max(0.2, baseValue - variation), { duration: 200 }),
            withTiming(baseValue, { duration: 200 })
          )
        } else {
          const baseValue = waveform[index] ?? 0.3
          scale.value = withTiming(baseValue, timingConfigs.fast)
        }
      })
    }
  }, [isPlaying, type, waveform, waveformScales])

  const handleImageLoad = useCallback(() => {
    imageOpacity.value = withSpring(1, springConfigs.smooth)
    imageScale.value = withSpring(1, springConfigs.bouncy)
  }, [imageOpacity, imageScale])

  const handleImageTap = useCallback(() => {
    if (onZoom) {
      zoomModalOpacity.value = withSpring(1, springConfigs.smooth)
      zoomModalScale.value = withSpring(1, springConfigs.bouncy)
      onZoom()
    }
  }, [onZoom, zoomModalOpacity, zoomModalScale])

  const closeZoom = useCallback(() => {
    zoomModalOpacity.value = withTiming(0, timingConfigs.fast)
    zoomModalScale.value = withTiming(0.9, timingConfigs.fast)
  }, [zoomModalOpacity, zoomModalScale])

  const imageStyle = useAnimatedStyle(() => {
    return {
      opacity: imageOpacity.value,
      transform: [{ scale: imageScale.value }]
    }
  })

  const zoomModalStyle = useAnimatedStyle(() => {
    return {
      opacity: zoomModalOpacity.value,
      transform: [{ scale: zoomModalScale.value }]
    }
  })

  const waveformStyles = waveformScales.map((scale) => {
    return useAnimatedStyle(() => {
      const height = interpolate(
        scale.value,
        [0, 1],
        [8, 32],
        Extrapolation.CLAMP
      )

      return {
        height,
        transform: [{ scaleY: scale.value }]
      }
    })
  })

  return {
    imageOpacity,
    imageScale,
    zoomModalOpacity,
    zoomModalScale,
    waveformScales,
    imageStyle,
    zoomModalStyle,
    waveformStyles,
    handleImageLoad,
    handleImageTap,
    closeZoom
  }
}
