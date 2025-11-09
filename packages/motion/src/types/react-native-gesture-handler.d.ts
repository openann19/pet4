/**
 * Type declarations for react-native-gesture-handler (optional module)
 *
 * This module may not be available in all environments (e.g., web),
 * so we provide optional type declarations to satisfy TypeScript.
 *
 * Location: packages/motion/src/types/react-native-gesture-handler.d.ts
 */

declare module 'react-native-gesture-handler' {
  export interface GestureHandler {
    Pan: () => {
      onUpdate: (handler: (e: { absoluteX: number; absoluteY: number }) => void) => unknown
      onEnd: (handler: () => void) => unknown
    }
  }

  export interface ReactNativeGestureHandlerModule {
    Gesture?: GestureHandler
    default?: {
      Gesture?: GestureHandler
    }
  }

  export const Gesture: GestureHandler | undefined
}
