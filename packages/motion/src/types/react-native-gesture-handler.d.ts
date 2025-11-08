/**
 * Type declarations for react-native-gesture-handler
 * This is an optional dependency that may not be available in all environments (e.g., web)
 */

declare module 'react-native-gesture-handler' {
  import type { ComponentType, ReactElement } from 'react'
  import type { ViewStyle } from 'react-native'

  export interface GestureHandlerRootViewProps {
    children: ReactElement | ReactElement[]
    style?: ViewStyle
  }

  export interface GestureUpdateEvent {
    translationX: number
    translationY: number
    absoluteX: number
    absoluteY: number
    velocityX: number
    velocityY: number
  }

  export interface GestureStateChangeEvent {
    state: number
    oldState: number
  }

  export interface GestureHandler {
    onUpdate(handler: (event: GestureUpdateEvent) => void): GestureHandler
    onEnd(handler: () => void): GestureHandler
    onStart(handler: () => void): GestureHandler
    onChange(handler: (event: GestureUpdateEvent) => void): GestureHandler
    onFinalize(handler: () => void): GestureHandler
    enabled(enabled: boolean): GestureHandler
    simultaneousWithExternalGesture(...gestures: GestureHandler[]): GestureHandler
    requireExternalGestureToFail(...gestures: GestureHandler[]): GestureHandler
  }

  export interface PanGestureHandler extends GestureHandler {
    minDistance(distance: number): PanGestureHandler
    activeOffsetX(offset: number | [number, number]): PanGestureHandler
    activeOffsetY(offset: number | [number, number]): PanGestureHandler
    failOffsetX(offset: number | [number, number]): PanGestureHandler
    failOffsetY(offset: number | [number, number]): PanGestureHandler
  }

  export interface PinchGestureHandler extends GestureHandler {
    minPointers(minPointers: number): PinchGestureHandler
  }

  export class Gesture {
    static Pan(): PanGestureHandler
    static Tap(): GestureHandler
    static LongPress(): GestureHandler
    static Pinch(): PinchGestureHandler
    static Rotation(): GestureHandler
    static Fling(): GestureHandler
    static ForceTouch(): GestureHandler
    static Native(): GestureHandler
    static Race(...gestures: GestureHandler[]): GestureHandler
    static Simultaneous(...gestures: GestureHandler[]): GestureHandler
    static Exclusive(...gestures: GestureHandler[]): GestureHandler
  }

  export interface GestureDetectorProps {
    gesture: GestureHandler
    children: ReactElement
  }

  export const GestureDetector: ComponentType<GestureDetectorProps>
  export const GestureHandlerRootView: ComponentType<GestureHandlerRootViewProps>

  const moduleExports: {
    Gesture: typeof Gesture
    GestureDetector: typeof GestureDetector
    GestureHandlerRootView: typeof GestureHandlerRootView
    default?: {
      Gesture?: typeof Gesture
      GestureDetector?: typeof GestureDetector
      GestureHandlerRootView?: typeof GestureHandlerRootView
    }
  } = {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
  }

  export default moduleExports
}
