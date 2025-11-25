import type { ViewStyle, PanGestureHandlerGestureEvent } from 'react-native'
import type { ComponentSize } from '../../types/component.types'

export interface SheetSnapPoint {
  readonly height: number
  readonly label?: string
}

export interface SheetConfig {
  readonly size: ComponentSize
  readonly draggable: boolean
  readonly dismissible: boolean
  readonly backdropDismiss: boolean
  readonly hapticFeedback: boolean
  readonly keyboardAvoidance: boolean
  readonly gestureEnabled: boolean
  readonly animated: boolean
  readonly springConfig: {
    readonly tension: number
    readonly friction: number
  }
}

export interface SheetProps {
  readonly children: React.ReactNode
  readonly visible?: boolean
  readonly onClose?: () => void
  readonly snapPoints?: readonly SheetSnapPoint[]
  readonly initialSnapIndex?: number
  readonly onSnapChange?: (index: number, height: number) => void
  readonly size?: ComponentSize
  readonly draggable?: boolean
  readonly dismissible?: boolean
  readonly backdropDismiss?: boolean
  readonly hapticFeedback?: boolean
  readonly keyboardAvoidance?: boolean
  readonly gestureEnabled?: boolean
  readonly animated?: boolean
  readonly springConfig?: {
    readonly tension: number
    readonly friction: number
  }
  readonly style?: ViewStyle
  readonly contentStyle?: ViewStyle
  readonly handleStyle?: ViewStyle
  readonly backdropStyle?: ViewStyle
  readonly testID?: string
  readonly accessibilityLabel?: string
}

export interface SheetState {
  readonly visible: boolean
  readonly currentSnapIndex: number
  readonly isDragging: boolean
  readonly keyboardHeight: number
  readonly contentHeight: number
}

export type SheetAction =
  | { readonly type: 'SHOW' }
  | { readonly type: 'HIDE' }
  | { readonly type: 'SET_SNAP_INDEX'; readonly payload: number }
  | { readonly type: 'SET_DRAGGING'; readonly payload: boolean }
  | { readonly type: 'SET_KEYBOARD_HEIGHT'; readonly payload: number }
  | { readonly type: 'SET_CONTENT_HEIGHT'; readonly payload: number }

export interface SheetGestureContext {
  readonly startY: number
  readonly snapPoints: readonly number[]
  readonly currentSnapIndex: number
}
