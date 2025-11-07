/**
 * Mobile Adapter: useBubbleTilt
 * Optimized bubble tilt animations for mobile platform
 */

import { useBubbleTilt as useSharedBubbleTilt, type UseBubbleTiltOptions } from '@petspark/motion'
import { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'
import { Gesture } from 'react-native-gesture-handler'
import { useRef } from 'react'

export type { UseBubbleTiltOptions }

export interface UseBubbleTiltReturn {
  rotateX: SharedValue<number>
  rotateY: SharedValue<number>
  shadowDepth: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  handleMove: (x: number, y: number, width: number, height: number) => void
  handleLeave: () => void
  // Mobile-specific gesture handler factory
  createGesture: (width: number, height: number) => ReturnType<typeof Gesture.Pan>
}

export function useBubbleTilt(
  options: UseBubbleTiltOptions = {}
): UseBubbleTiltReturn {
  const shared = useSharedBubbleTilt(options)
  const containerDimensions = useRef<{ width: number; height: number }>({ width: 200, height: 200 })

  // Convert shared style to mobile-compatible style
  const animatedStyle = useAnimatedStyle(() => {
    const sharedStyle = shared.animatedStyle.value as any

    return {
      transform: sharedStyle.transform,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowOffset: {
        width: 0,
        height: sharedStyle.shadowDepth * 4,
      },
      shadowOpacity: sharedStyle.shadowOpacity,
      shadowRadius: sharedStyle.shadowBlur,
      elevation: sharedStyle.shadowBlur / 2, // Android elevation
    }
  })

  // Create pan gesture handler factory for mobile
  const createGesture = (width: number, height: number) => {
    containerDimensions.current = { width, height }
    return Gesture.Pan()
      .onUpdate((e) => {
        shared.handleMove(e.x, e.y, width, height)
      })
      .onEnd(() => {
        shared.handleLeave()
      })
  }

  return {
    rotateX: shared.rotateX,
    rotateY: shared.rotateY,
    shadowDepth: shared.shadowDepth,
    animatedStyle,
    handleMove: shared.handleMove,
    handleLeave: shared.handleLeave,
    createGesture,
  }
}

