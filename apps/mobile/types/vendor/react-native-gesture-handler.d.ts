/**
 * Type declarations for react-native-gesture-handler
 * Note: Temporary type definitions - Update to use official types when available
 * This is a workaround until the official @types/react-native-gesture-handler package is updated
 */

import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

declare module 'react-native-gesture-handler' {
  export interface GestureType {
    Pan: () => GestureHandler
    Tap: () => GestureHandler
    LongPress: () => GestureHandler
    Pinch: () => GestureHandler
    Rotation: () => GestureHandler
    Simultaneous: (...gestures: GestureHandler[]) => GestureHandler
  }

  export interface GestureEvent {
    translationX: number
    translationY: number
    velocityX: number
    velocityY: number
    x: number
    y: number
    absoluteX: number
    absoluteY: number
    scale?: number
    rotation?: number
  }

  export interface GestureHandler {
    onUpdate: (handler: (e: GestureEvent) => void) => GestureHandler
    onEnd: (handler: (e: GestureEvent) => void) => GestureHandler
    onBegin: (handler: () => void) => GestureHandler
    onStart: (handler: () => void) => GestureHandler
    onChange: (handler: (e: GestureEvent) => void) => GestureHandler
    onFinalize: (handler: () => void) => GestureHandler
    enabled: (value: boolean) => GestureHandler
    runOnJS: (fn: (...args: unknown[]) => void) => GestureHandler
  }

  export interface GestureDetectorProps {
    gesture: GestureHandler
    children: ReactNode
    style?: ViewStyle
  }

  export interface GestureHandlerRootViewProps {
    children: ReactNode
    style?: ViewStyle
  }

  export const Gesture: GestureType
  export const GestureDetector: React.ComponentType<GestureDetectorProps>
  export const GestureHandlerRootView: React.ComponentType<GestureHandlerRootViewProps>

  export default { Gesture, GestureDetector, GestureHandlerRootView }
}
