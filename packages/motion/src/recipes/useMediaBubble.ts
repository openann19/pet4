/**
 * useMediaBubble
 * Shared animation hook for media bubble animations (images, videos, voice)
 * 
 * @packageDocumentation
 * @category Animation Hooks
 * @subcategory Chat Effects
 */

import { useCallback, useEffect } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated'
import { springConfigs, timingConfigs } from '../shared-transitions'
import { useReducedMotionSV } from '../reduced-motion'
import { makeRng } from '@petspark/shared'
import { isTruthy, isDefined } from '@/core/guards';

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

  const isReducedMotion = useReducedMotionSV()
  const imageOpacity = useSharedValue(0)
  const imageScale = useSharedValue(0.95)
  const zoomModalOpacity = useSharedValue(0)
  const zoomModalScale = useSharedValue(0.9)

  const waveformScales = Array.from({ length: 20 }, () => useSharedValue(0.3))

  useEffect(() => {
    if (isLoaded && type === 'image') {
      if (isTruthy(isReducedMotion.value)) {
        imageOpacity.value = 1
        imageScale.value = 1
      } else {
        imageOpacity.value = withSpring(1, springConfigs.smooth)
        imageScale.value = withSpring(1, springConfigs.bouncy)
      }
    }
  }, [isLoaded, type, imageOpacity, imageScale, isReducedMotion])

  useEffect(() => {
    if (type === 'voice') {
      // Create seeded RNG for deterministic waveform variation
      const seed = Date.now() + waveformScales.length
      const rng = makeRng(seed)
      
      waveformScales.forEach((scale, index) => {
        if (isTruthy(isPlaying)) {
          const baseValue = waveform[index] ?? 0.3
          const variation = rng() * 0.3
          if (isTruthy(isReducedMotion.value)) {
            scale.value = baseValue
          } else {
            scale.value = withSequence(
              withTiming(baseValue + variation, { duration: 200 }),
              withTiming(Math.max(0.2, baseValue - variation), { duration: 200 }),
              withTiming(baseValue, { duration: 200 })
            )
          }
        } else {
          const baseValue = waveform[index] ?? 0.3
          scale.value = withTiming(baseValue, timingConfigs.fast)
        }
      })
    }
  }, [isPlaying, type, waveform, waveformScales, isReducedMotion])

  const handleImageLoad = useCallback(() => {
    if (isTruthy(isReducedMotion.value)) {
      imageOpacity.value = 1
      imageScale.value = 1
    } else {
      imageOpacity.value = withSpring(1, springConfigs.smooth)
      imageScale.value = withSpring(1, springConfigs.bouncy)
    }
  }, [imageOpacity, imageScale, isReducedMotion])

  const handleImageTap = useCallback(() => {
    if (isTruthy(onZoom)) {
      if (isTruthy(isReducedMotion.value)) {
        zoomModalOpacity.value = 1
        zoomModalScale.value = 1
      } else {
        zoomModalOpacity.value = withSpring(1, springConfigs.smooth)
        zoomModalScale.value = withSpring(1, springConfigs.bouncy)
      }
      if (onZoom) {
        onZoom()
      }
    }
  }, [onZoom, zoomModalOpacity, zoomModalScale, isReducedMotion])

  const closeZoom = useCallback(() => {
    if (isTruthy(isReducedMotion.value)) {
      zoomModalOpacity.value = 0
      zoomModalScale.value = 0.9
    } else {
      zoomModalOpacity.value = withTiming(0, timingConfigs.fast)
      zoomModalScale.value = withTiming(0.9, timingConfigs.fast)
    }
  }, [zoomModalOpacity, zoomModalScale, isReducedMotion])

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

