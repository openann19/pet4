'use client'

export type GestureState = 'UNDETERMINED' | 'FAILED' | 'BEGAN' | 'CANCELLED' | 'ACTIVE' | 'END'

export interface GestureEventPayload {
  translationX: number
  translationY: number
  velocityX: number
  velocityY: number
  x: number
  y: number
  absoluteX: number
  absoluteY: number
}

export interface PanGestureHandlerEventPayload extends GestureEventPayload {
  state: GestureState
}

export interface TapGestureHandlerEventPayload {
  x: number
  y: number
  absoluteX: number
  absoluteY: number
  state: GestureState
}

export interface LongPressGestureHandlerEventPayload {
  x: number
  y: number
  absoluteX: number
  absoluteY: number
  state: GestureState
  duration: number
}

export interface GestureConfig {
  enabled?: boolean
  shouldCancelWhenOutside?: boolean
  hitSlop?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
}

export interface PanGestureConfig extends GestureConfig {
  activeOffsetX?: number[]
  activeOffsetY?: number[]
  failOffsetX?: number[]
  failOffsetY?: number[]
  minPointers?: number
  maxPointers?: number
  minDistance?: number
}

export interface TapGestureConfig extends GestureConfig {
  numberOfTaps?: number
  maxDurationMs?: number
  maxDelayMs?: number
}

export interface LongPressGestureConfig extends GestureConfig {
  minDurationMs?: number
  maxDistance?: number
}
