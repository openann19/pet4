/**
 * Type extensions for react-native-reanimated Gesture API
 * These extend the base types to include APIs that exist at runtime
 * but may not be fully typed in the library
 */

import type { Gesture } from 'react-native-gesture-handler';

declare module 'react-native-gesture-handler' {
  interface PanGesture {
    activeOffsetX(value: number | [number, number]): PanGesture;
    minDistance(value: number): PanGesture;
    onBegin(callback: (event: { x: number; y: number }) => void): PanGesture;
  }
}

export {};

