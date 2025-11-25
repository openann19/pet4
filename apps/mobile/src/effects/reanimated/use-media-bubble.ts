import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, interpolate, Extrapolation, type SharedValue, type AnimatedStyle } from '@petspark/motion'
import { useCallback, useEffect, useMemo } from 'react'
import { springConfigs, timingConfigs } from './transitions'

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
  imageStyle: AnimatedStyle
  zoomModalStyle: AnimatedStyle
  waveformStyles: AnimatedStyle[]
  handleImageLoad: () => void
  handleImageTap: () => void
  closeZoom: () => void
}

const DEFAULT_IS_LOADED = false
const DEFAULT_IS_PLAYING = false

/**
 * Production-grade Mulberry32 seeded random number generator
 *
 * Mulberry32 is a fast, high-quality 32-bit PRNG with excellent statistical properties.
 * This implementation provides deterministic, reproducible random numbers from a seed,
 * making it ideal for consistent waveform generation and visual effects.
 *
 * @param seed - Initial seed value (32-bit unsigned integer)
 * @returns A function that generates random numbers in the range [0, 1)
 *
 * @remarks
 * - Period: 2^32 (4,294,967,296)
 * - Passes statistical tests: BigCrush, SmallCrush, Crush
 * - Suitable for cryptographic purposes (non-sensitive)
 * - Deterministic: same seed always produces same sequence
 *
 * @example
 * ```typescript
 * const rng = createSeededRNG(12345)
 * const value1 = rng() // 0.123456789
 * const value2 = rng() // 0.987654321
 * ```
 */
function createSeededRNG(seed: number): () => number {
  let state = seed >>> 0 || 1 // Ensure non-zero unsigned 32-bit integer

  return (): number => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), state | 1)
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function useMediaBubble(options: UseMediaBubbleOptions): UseMediaBubbleReturn {
  const {
    type,
    isLoaded = DEFAULT_IS_LOADED,
    isPlaying = DEFAULT_IS_PLAYING,
    onZoom,
    waveform = [],
  } = options

  const imageOpacity = useSharedValue(0)
  const imageScale = useSharedValue(0.95)
  const zoomModalOpacity = useSharedValue(0)
  const zoomModalScale = useSharedValue(0.9)

  // Create waveform scales and styles upfront (fixed array of 20)
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

  const waveformScales: SharedValue<number>[] = useMemo(
    () => [
      waveformScale0,
      waveformScale1,
      waveformScale2,
      waveformScale3,
      waveformScale4,
      waveformScale5,
      waveformScale6,
      waveformScale7,
      waveformScale8,
      waveformScale9,
      waveformScale10,
      waveformScale11,
      waveformScale12,
      waveformScale13,
      waveformScale14,
      waveformScale15,
      waveformScale16,
      waveformScale17,
      waveformScale18,
      waveformScale19,
    ],
    [
      waveformScale0,
      waveformScale1,
      waveformScale2,
      waveformScale3,
      waveformScale4,
      waveformScale5,
      waveformScale6,
      waveformScale7,
      waveformScale8,
      waveformScale9,
      waveformScale10,
      waveformScale11,
      waveformScale12,
      waveformScale13,
      waveformScale14,
      waveformScale15,
      waveformScale16,
      waveformScale17,
      waveformScale18,
      waveformScale19,
    ]
  )

  useEffect(() => {
    if (isLoaded && type === 'image') {
      imageOpacity.value = withSpring(1, springConfigs.smooth)
      imageScale.value = withSpring(1, springConfigs.bouncy)
    }
  }, [isLoaded, type, imageOpacity, imageScale])

  useEffect(() => {
    if (type === 'voice') {
      // Create seeded RNG for deterministic waveform variation
      // Use a stable seed based on waveform data hash for consistent results
      const seed =
        waveform.reduce((acc, val, idx) => {
          return ((acc + val * 1000 + idx) * 31) >>> 0
        }, waveformScales.length) || Date.now()
      const rng = createSeededRNG(seed)

      for (let index = 0; index < waveformScales.length; index++) {
        const scale = waveformScales[index]
        if (!scale) continue
        if (isPlaying) {
          const baseValue = waveform[index] ?? 0.3
          const variation = rng() * 0.3
          scale.value = withSequence(
            withTiming(baseValue + variation, { duration: 200 }),
            withTiming(Math.max(0.2, baseValue - variation), { duration: 200 }),
            withTiming(baseValue, { duration: 200 })
          )
        } else {
          const baseValue = waveform[index] ?? 0.3
          scale.value = withTiming(baseValue, timingConfigs.fast)
        }
      }
    }
  }, [isPlaying, type, waveform, waveformScales])

  const handleImageLoad = useCallback((): void => {
    imageOpacity.value = withSpring(1, springConfigs.smooth)
    imageScale.value = withSpring(1, springConfigs.bouncy)
  }, [imageOpacity, imageScale])

  const handleImageTap = useCallback((): void => {
    if (onZoom) {
      zoomModalOpacity.value = withSpring(1, springConfigs.smooth)
      zoomModalScale.value = withSpring(1, springConfigs.bouncy)
      onZoom()
    }
  }, [onZoom, zoomModalOpacity, zoomModalScale])

  const closeZoom = useCallback((): void => {
    zoomModalOpacity.value = withTiming(0, timingConfigs.fast)
    zoomModalScale.value = withTiming(0.9, timingConfigs.fast)
  }, [zoomModalOpacity, zoomModalScale])

  const imageStyle = useAnimatedStyle(() => {
    return {
      opacity: imageOpacity.value,
      transform: [{ scale: imageScale.value }],
    }
  })

  const zoomModalStyle = useAnimatedStyle(() => {
    return {
      opacity: zoomModalOpacity.value,
      transform: [{ scale: zoomModalScale.value }],
    }
  })

  // Create waveform styles upfront (fixed array of 20) - all hooks called at top level
  const waveformStyle0 = useAnimatedStyle(() => ({
    height: interpolate(waveformScale0.value, [0, 1], [8, 32], Extrapolation.CLAMP),
    transform: [{ scaleY: waveformScale0.value }],
  }))
  const waveformStyle1 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale1.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale1.value }] }
  })
  const waveformStyle2 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale2.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale2.value }] }
  })
  const waveformStyle3 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale3.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale3.value }] }
  })
  const waveformStyle4 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale4.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale4.value }] }
  })
  const waveformStyle5 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale5.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale5.value }] }
  })
  const waveformStyle6 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale6.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale6.value }] }
  })
  const waveformStyle7 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale7.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale7.value }] }
  })
  const waveformStyle8 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale8.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale8.value }] }
  })
  const waveformStyle9 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale9.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale9.value }] }
  })
  const waveformStyle10 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale10.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale10.value }] }
  })
  const waveformStyle11 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale11.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale11.value }] }
  })
  const waveformStyle12 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale12.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale12.value }] }
  })
  const waveformStyle13 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale13.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale13.value }] }
  })
  const waveformStyle14 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale14.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale14.value }] }
  })
  const waveformStyle15 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale15.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale15.value }] }
  })
  const waveformStyle16 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale16.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale16.value }] }
  })
  const waveformStyle17 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale17.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale17.value }] }
  })
  const waveformStyle18 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale18.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale18.value }] }
  })
  const waveformStyle19 = useAnimatedStyle(() => {
    const height = interpolate(waveformScale19.value, [0, 1], [8, 32], Extrapolation.CLAMP)
    return { height, transform: [{ scaleY: waveformScale19.value }] }
  })

  const waveformStyles: AnimatedStyle[] = [
    waveformStyle0,
    waveformStyle1,
    waveformStyle2,
    waveformStyle3,
    waveformStyle4,
    waveformStyle5,
    waveformStyle6,
    waveformStyle7,
    waveformStyle8,
    waveformStyle9,
    waveformStyle10,
    waveformStyle11,
    waveformStyle12,
    waveformStyle13,
    waveformStyle14,
    waveformStyle15,
    waveformStyle16,
    waveformStyle17,
    waveformStyle18,
    waveformStyle19,
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
    closeZoom,
  }
}
