import type { ViewStyle, TextStyle } from 'react-native'
import type { ComponentVariant, ComponentSize } from '../../types/component.types'

export interface CheckboxConfig {
  readonly variant: ComponentVariant
  readonly size: ComponentSize
  readonly shape: 'square' | 'rounded'
  readonly hapticFeedback: boolean
  readonly animated: boolean
  readonly showLabel: boolean
}

export interface CheckboxProps {
  readonly checked?: boolean
  readonly indeterminate?: boolean
  readonly onCheckedChange?: (checked: boolean) => void
  readonly label?: string
  readonly description?: string
  readonly error?: string
  readonly variant?: ComponentVariant
  readonly size?: ComponentSize
  readonly shape?: 'square' | 'rounded'
  readonly disabled?: boolean
  readonly required?: boolean
  readonly hapticFeedback?: boolean
  readonly animated?: boolean
  readonly showLabel?: boolean
  readonly labelPosition?: 'left' | 'right'
  readonly icon?: string
  readonly checkedIcon?: string
  readonly indeterminateIcon?: string
  readonly value?: string | number
  readonly name?: string
  readonly containerStyle?: ViewStyle
  readonly checkboxStyle?: ViewStyle
  readonly labelStyle?: TextStyle
  readonly descriptionStyle?: TextStyle
  readonly errorStyle?: TextStyle
  readonly testID?: string
  readonly accessibilityLabel?: string
}

export interface CheckboxState {
  readonly checked: boolean
  readonly indeterminate: boolean
  readonly pressed: boolean
  readonly focused: boolean
}

export type CheckboxAction =
  | { readonly type: 'SET_CHECKED'; readonly payload: boolean }
  | { readonly type: 'SET_INDETERMINATE'; readonly payload: boolean }
  | { readonly type: 'SET_PRESSED'; readonly payload: boolean }
  | { readonly type: 'SET_FOCUSED'; readonly payload: boolean }
  | { readonly type: 'TOGGLE' }

export interface CheckboxGroupProps {
  readonly children: React.ReactNode
  readonly value?: readonly (string | number)[]
  readonly defaultValue?: readonly (string | number)[]
  readonly onValueChange?: (value: readonly (string | number)[]) => void
  readonly disabled?: boolean
  readonly required?: boolean
  readonly error?: string
  readonly name?: string
  readonly containerStyle?: ViewStyle
  readonly testID?: string
}

export interface CheckboxGroupContextValue {
  readonly value: readonly (string | number)[]
  readonly onValueChange: (itemValue: string | number, checked: boolean) => void
  readonly disabled?: boolean
  readonly name?: string
}
