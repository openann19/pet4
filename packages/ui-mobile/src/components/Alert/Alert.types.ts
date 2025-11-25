import type { ViewStyle, TextStyle } from 'react-native'
import type { ComponentVariant, ComponentSize } from '../../types/component.types'

export interface AlertAction {
  readonly label: string
  readonly onPress: () => void
  readonly variant?: ComponentVariant
  readonly disabled?: boolean
}

export interface AlertConfig {
  readonly variant: 'success' | 'warning' | 'error' | 'info'
  readonly size: ComponentSize
  readonly dismissible: boolean
  readonly autoDismiss: boolean
  readonly autoDismissDelay: number
  readonly hapticFeedback: boolean
  readonly showIcon: boolean
  readonly animated: boolean
  readonly position: 'top' | 'bottom' | 'center'
}

export interface AlertProps {
  readonly title?: string
  readonly message: string
  readonly variant?: 'success' | 'warning' | 'error' | 'info'
  readonly size?: ComponentSize
  readonly icon?: string
  readonly dismissible?: boolean
  readonly autoDismiss?: boolean
  readonly autoDismissDelay?: number
  readonly visible?: boolean
  readonly onDismiss?: () => void
  readonly actions?: readonly AlertAction[]
  readonly hapticFeedback?: boolean
  readonly showIcon?: boolean
  readonly animated?: boolean
  readonly position?: 'top' | 'bottom' | 'center'
  readonly style?: ViewStyle
  readonly titleStyle?: TextStyle
  readonly messageStyle?: TextStyle
  readonly iconStyle?: ViewStyle
  readonly testID?: string
  readonly accessibilityLabel?: string
}

export interface AlertState {
  readonly visible: boolean
  readonly dismissing: boolean
  readonly progress: number
}

export type AlertReducerAction =
  | { readonly type: 'SHOW' }
  | { readonly type: 'DISMISS' }
  | { readonly type: 'SET_DISMISSING'; readonly payload: boolean }
  | { readonly type: 'SET_PROGRESS'; readonly payload: number }

export interface ToastManager {
  readonly show: (props: Omit<AlertProps, 'visible'>) => string
  readonly hide: (id: string) => void
  readonly hideAll: () => void
}

export interface ToastItem extends AlertProps {
  readonly id: string
  readonly timestamp: number
}
