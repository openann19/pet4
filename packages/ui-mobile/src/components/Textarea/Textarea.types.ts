import type { TextInputProps, ViewStyle, TextStyle } from 'react-native'
import type { ComponentVariant, ComponentSize } from '../../types/component.types'

export interface TextareaConfig {
  readonly variant: ComponentVariant
  readonly size: ComponentSize
  readonly autoResize: boolean
  readonly showCharCount: boolean
  readonly hapticFeedback: boolean
  readonly animated: boolean
  readonly maxHeight: number
  readonly minHeight: number
}

export interface TextareaProps extends Omit<TextInputProps, 'multiline' | 'numberOfLines'> {
  readonly label?: string
  readonly error?: string
  readonly hint?: string
  readonly variant?: ComponentVariant
  readonly size?: ComponentSize
  readonly disabled?: boolean
  readonly required?: boolean
  readonly autoResize?: boolean
  readonly minHeight?: number
  readonly maxHeight?: number
  readonly rows?: number
  readonly maxLength?: number
  readonly showCharCount?: boolean
  readonly hapticFeedback?: boolean
  readonly animated?: boolean
  readonly leftIcon?: string
  readonly rightIcon?: string
  readonly onLeftIconPress?: () => void
  readonly onRightIconPress?: () => void
  readonly containerStyle?: ViewStyle
  readonly inputStyle?: TextStyle
  readonly labelStyle?: TextStyle
  readonly errorStyle?: TextStyle
  readonly hintStyle?: TextStyle
  readonly charCountStyle?: TextStyle
  readonly testID?: string
}

export interface TextareaState {
  readonly value: string
  readonly height: number
  readonly isFocused: boolean
  readonly charCount: number
}

export type TextareaAction =
  | { readonly type: 'SET_VALUE'; readonly payload: string }
  | { readonly type: 'SET_HEIGHT'; readonly payload: number }
  | { readonly type: 'SET_FOCUSED'; readonly payload: boolean }
  | { readonly type: 'SET_CHAR_COUNT'; readonly payload: number }
