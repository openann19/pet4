'use client'

import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useEffect } from 'react'
import { springConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'

export interface UseSidebarAnimationOptions {
  isOpen: boolean
  openWidth?: number
  closedWidth?: number
  enableOpacity?: boolean
}

export interface UseSidebarAnimationReturn {
  width: number
  widthStyle: AnimatedStyle
  opacityStyle: AnimatedStyle
}

/**
 * Hook for animating sidebar width and opacity transitions
 * Uses React Reanimated for smooth 60fps animations on UI thread
 */
export function useSidebarAnimation(
  options: UseSidebarAnimationOptions
): UseSidebarAnimationReturn {
  const {
    isOpen,
    openWidth = 280,
    closedWidth = 80,
    enableOpacity = true
  } = options

  const width = useSharedValue(isOpen ? openWidth : closedWidth)
  const opacity = useSharedValue(isOpen ? 1 : 0)

  useEffect(() => {
    width.value = withSpring(
      isOpen ? openWidth : closedWidth,
      springConfigs.smooth
    )
    
    if (enableOpacity) {
      opacity.value = withSpring(
        isOpen ? 1 : 0,
        springConfigs.smooth
      )
    }
  }, [isOpen, openWidth, closedWidth, enableOpacity, width, opacity])

  const widthStyle = useAnimatedStyle(() => {
    return {
      width: width.value
    }
  }) as AnimatedStyle

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value
    }
  }) as AnimatedStyle

  return {
    width: isOpen ? openWidth : closedWidth,
    widthStyle,
    opacityStyle
  }
}

