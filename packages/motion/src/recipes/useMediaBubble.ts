/**
 * useMediaBubble
 * Shared animation hook for media bubble animations (images, videos, voice)
 *
 * @packageDocumentation
 * @category Animation Hooks
 * @subcategory Chat Effects
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated'
import { springConfigs, timingConfigs } from '../shared-transitions'
import { useReducedMotionSV } from '../reduced-motion'
import { makeRng, isTruthy } from '../utils/guards';

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

  // Create 20 individual SharedValue instances for waveform animation
  // React Hook rules require individual calls at top level - do not refactor into loops/maps
  const waveformScale0 = useSharedValue(0.3)
  const waveformScale1 = useSharedValue(0.3)
  const waveformScale2 = useSharedValue(0.3)
  const waveformScale3 = useSharedValue(0.3)
  const waveformScale4 = useSharedValue(0.3)
  const waveformScale5 = useSharedValue(0.3)
  const waveformScale6 = useSharedValue(0.3)
  const waveformScale7 = useSharedValue(0.3)
  const waveformScale8 = useSharedValue(0.3)
  const waveformScale9 = useSharedValue(0.3)
  const waveformScale10 = useSharedValue(0.3)
  const waveformScale11 = useSharedValue(0.3)
  const waveformScale12 = useSharedValue(0.3)
  const waveformScale13 = useSharedValue(0.3)
  const waveformScale14 = useSharedValue(0.3)
  const waveformScale15 = useSharedValue(0.3)
  const waveformScale16 = useSharedValue(0.3)
  const waveformScale17 = useSharedValue(0.3)
  const waveformScale18 = useSharedValue(0.3)
  const waveformScale19 = useSharedValue(0.3)


  /* eslint-disable react-hooks/exhaustive-deps */
  const waveformScales = useMemo(() => [
    waveformScale0, waveformScale1, waveformScale2, waveformScale3, waveformScale4,
    waveformScale5, waveformScale6, waveformScale7, waveformScale8, waveformScale9,
    waveformScale10, waveformScale11, waveformScale12, waveformScale13, waveformScale14,
    waveformScale15, waveformScale16, waveformScale17, waveformScale18, waveformScale19
  ], []) // SharedValue references are stable and never change
  /* eslint-enable react-hooks/exhaustive-deps */

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
      onZoom()
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
      scale: imageScale.value
    }
  })

  const zoomModalStyle = useAnimatedStyle(() => {
    return {
      opacity: zoomModalOpacity.value,
      scale: zoomModalScale.value
    }
  })

  // Create 20 individual animated styles for waveform animation
  // Note: Individual calls required by React Hook rules - cannot use map callback
  const waveformStyle0 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale0.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale0.value }
  })
  const waveformStyle1 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale1.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale1.value }
  })
  const waveformStyle2 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale2.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale2.value }
  })
  const waveformStyle3 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale3.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale3.value }
  })
  const waveformStyle4 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale4.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale4.value }
  })
  const waveformStyle5 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale5.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale5.value }
  })
  const waveformStyle6 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale6.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale6.value }
  })
  const waveformStyle7 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale7.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale7.value }
  })
  const waveformStyle8 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale8.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale8.value }
  })
  const waveformStyle9 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale9.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale9.value }
  })
  const waveformStyle10 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale10.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale10.value }
  })
  const waveformStyle11 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale11.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale11.value }
  })
  const waveformStyle12 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale12.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale12.value }
  })
  const waveformStyle13 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale13.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale13.value }
  })
  const waveformStyle14 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale14.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale14.value }
  })
  const waveformStyle15 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale15.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale15.value }
  })
  const waveformStyle16 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale16.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale16.value }
  })
  const waveformStyle17 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale17.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale17.value }
  })
  const waveformStyle18 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale18.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale18.value }
  })
  const waveformStyle19 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale19.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, scaleY: waveformScale19.value }
  })

  const waveformStyles = [
    waveformStyle0, waveformStyle1, waveformStyle2, waveformStyle3, waveformStyle4,
    waveformStyle5, waveformStyle6, waveformStyle7, waveformStyle8, waveformStyle9,
    waveformStyle10, waveformStyle11, waveformStyle12, waveformStyle13, waveformStyle14,
    waveformStyle15, waveformStyle16, waveformStyle17, waveformStyle18, waveformStyle19
  ]

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
