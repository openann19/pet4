/**
 * Mobile Adapter: useMediaBubble
 * Optimized media bubble animations for mobile platform
 */

import { useMediaBubble as useSharedMediaBubble, type UseMediaBubbleOptions } from '@petspark/motion'
import type { SharedValue } from 'react-native-reanimated'

export type { MediaType } from '@petspark/motion'

export interface MobileMediaBubbleOptions extends UseMediaBubbleOptions {
  /**
   * Use native driver for better performance
   * @default true
   */
  useNativeDriver?: boolean

  /**
   * Optimize for screen reader accessibility
   * @default true
   */
  accessibilityOptimized?: boolean
}

export interface UseMediaBubbleReturn {
  imageOpacity: SharedValue<number>
  imageScale: SharedValue<number>
  zoomModalOpacity: SharedValue<number>
  zoomModalScale: SharedValue<number>
  waveformScales: SharedValue<number>[]
  imageStyle: ReturnType<typeof useSharedMediaBubble>['imageStyle']
  zoomModalStyle: ReturnType<typeof useSharedMediaBubble>['zoomModalStyle']
  waveformStyles: ReturnType<typeof useSharedMediaBubble>['waveformStyles']
  handleImageLoad: () => void
  handleImageTap: () => void
  closeZoom: () => void
}

export function useMediaBubble(
  options: MobileMediaBubbleOptions
): UseMediaBubbleReturn {
  const {
    useNativeDriver = true,
    accessibilityOptimized = true,
    ...sharedOptions
  } = options

  return useSharedMediaBubble(sharedOptions)
}

