/**
 * Type declarations for react-native-gesture-handler
 * This is an optional dependency that may not be available in all environments
 */

declare module 'react-native-gesture-handler' {
  export interface GestureHandler {
    Pan: () => {
      onUpdate: (handler: (e: { absoluteX: number; absoluteY: number }) => void) => unknown
      onEnd: (handler: () => void) => unknown
      onBegin: (handler: () => void) => unknown
      onFinalize: (handler: () => void) => unknown
    }
    Tap: () => {
      onEnd: (handler: () => void) => unknown
    }
    LongPress: () => {
      onEnd: (handler: () => void) => unknown
    }
  }

  export interface GestureModule {
    Gesture: GestureHandler
  }

  const gestureModule: GestureModule
  export default gestureModule
  export { GestureHandler, GestureModule }
}
