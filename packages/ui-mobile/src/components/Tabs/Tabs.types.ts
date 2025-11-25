import type { ViewStyle, TextStyle } from 'react-native'
import type { ComponentVariant, ComponentSize } from '../../types/component.types'

export interface TabItem {
  readonly id: string
  readonly label: string
  readonly icon?: string
  readonly badge?: number | string
  readonly disabled?: boolean
  readonly accessibilityLabel?: string
}

export interface TabsConfig {
  readonly variant: ComponentVariant
  readonly size: ComponentSize
  readonly position: 'top' | 'bottom'
  readonly scrollable: boolean
  readonly showIndicator: boolean
  readonly showLabels: boolean
  readonly showIcons: boolean
  readonly hapticFeedback: boolean
  readonly animateIndicator: boolean
  readonly swipeEnabled: boolean
}

export interface TabsProps {
  readonly items: readonly TabItem[]
  readonly value?: string
  readonly onValueChange?: (value: string) => void
  readonly variant?: ComponentVariant
  readonly size?: ComponentSize
  readonly position?: 'top' | 'bottom'
  readonly scrollable?: boolean
  readonly showIndicator?: boolean
  readonly showLabels?: boolean
  readonly showIcons?: boolean
  readonly disabled?: boolean
  readonly hapticFeedback?: boolean
  readonly animateIndicator?: boolean
  readonly swipeEnabled?: boolean
  readonly style?: ViewStyle
  readonly tabStyle?: ViewStyle
  readonly labelStyle?: TextStyle
  readonly indicatorStyle?: ViewStyle
  readonly testID?: string
  readonly accessibilityLabel?: string
}

export interface TabsState {
  readonly selectedTab: string | null
  readonly indicatorPosition: number
  readonly tabWidths: Record<string, number>
}

export type TabsAction =
  | { readonly type: 'SELECT_TAB'; readonly payload: string }
  | { readonly type: 'SET_INDICATOR_POSITION'; readonly payload: number }
  | { readonly type: 'SET_TAB_WIDTH'; readonly payload: { id: string; width: number } }
