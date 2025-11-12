import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated'
import { useCallback } from 'react'
import type { AnimatedStyle } from './animated-view'

export interface UseParallaxTiltOptions {
  maxTilt?: number
  damping?: number
  stiffness?: number
  enabled?: boolean
  perspective?: number
}

export interface UseParallaxTiltReturn {
  rotateX: SharedValue<number>
  rotateY: SharedValue<number>
  animatedStyle: AnimatedStyle
  handleMove: (x: number, y: number, width: number, height: number) => void
  handleLeave: () => void
}

const DEFAULT_MAX_TILT = 15
const DEFAULT_DAMPING = 15
const DEFAULT_STIFFNESS = 150
const DEFAULT_PERSPECTIVE = 1000

export function useParallaxTilt(options: UseParallaxTiltOptions = {}): UseParallaxTiltReturn {
  const {
    maxTilt = DEFAULT_MAX_TILT,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    enabled = true,
    perspective = DEFAULT_PERSPECTIVE,
  } = options

  const rotateX = useSharedValue(0)
  const rotateY = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return {
        transform: [{ perspective }, { rotateX: '0deg' }, { rotateY: '0deg' }],
      }
    }

    return {
      transform: [
        { perspective },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
      ],
    }
  }) as AnimatedStyle

  const handleMove = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (!enabled) return

      const centerX = width / 2
      const centerY = height / 2

      const deltaX = x - centerX
      const deltaY = y - centerY

      const tiltX = interpolate(deltaY, [-height / 2, height / 2], [maxTilt, -maxTilt])

      const tiltY = interpolate(deltaX, [-width / 2, width / 2], [-maxTilt, maxTilt])

      rotateX.value = withSpring(tiltX, { damping, stiffness })
      rotateY.value = withSpring(tiltY, { damping, stiffness })
    },
    [enabled, maxTilt, damping, stiffness, rotateX, rotateY]
  )

  const handleLeave = useCallback(() => {
    if (!enabled) return
    rotateX.value = withSpring(0, { damping, stiffness })
    rotateY.value = withSpring(0, { damping, stiffness })
  }, [enabled, damping, stiffness, rotateX, rotateY])

  return {
    rotateX,
    rotateY,
    animatedStyle,
    handleMove,
    handleLeave,
  }
}
