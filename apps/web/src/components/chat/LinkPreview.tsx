/**
 * Link Preview — Web
 * - Skeleton shimmer → content crossfade
 * - Reduced motion instant crossfade (≤120ms)
 * - No duplicate style props; accessible & trimmed
 * 
 * Location: apps/web/src/components/chat/LinkPreview.tsx
 */

import { useMemo } from 'react'
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export interface LinkPreviewProps {
  url: string
  title?: string
  description?: string
  image?: string
  isLoading?: boolean
  className?: string
}

export function LinkPreview({
  url,
  title,
  description,
  image,
  isLoading = false,
  className,
}: LinkPreviewProps) {
  const reduced = useReducedMotion()
  const showContent = !isLoading && (!!title || !!image)

  const s = useSharedValue(showContent ? 1 : 0)
  const dur = getReducedMotionDuration(360, reduced)

  useMemo(() => {
    s.value = withTiming(showContent ? 1 : 0, { duration: dur })
  }, [showContent, dur, s])

  const skeletonStyle = useAnimatedStyle(() => ({ opacity: 1 - s.value })) as AnimatedStyle
  const contentStyle = useAnimatedStyle(() => ({ opacity: s.value })) as AnimatedStyle

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className ?? ''}`}
      aria-busy={isLoading}
      aria-live="polite"
    >
      {/* Skeleton */}
      <Animated.div style={skeletonStyle} className="absolute inset-0">
        <div className="flex gap-3 p-3">
          {image && (
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </Animated.div>

      {/* Content */}
      {showContent && (
        <Animated.a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={contentStyle}
          className="relative flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
        >
          {image && (
            <img
              src={image}
              alt={title ?? new URL(url).hostname}
              className="w-20 h-20 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="text-sm font-semibold text-foreground line-clamp-1">{title}</h4>
            )}
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {new URL(url).hostname}
            </p>
          </div>
        </Animated.a>
      )}
    </div>
  )
}

