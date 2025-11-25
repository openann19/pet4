import type { ReactNode } from 'react'
import type { ViewStyle, TextStyle } from 'react-native'
import type { ComponentVariant, ComponentSize } from '../../types/component.types'

export interface SelectOption {
  /**
   * Display text for the option
   */
  readonly label: string
  /**
   * Unique value identifier
   */
  readonly value: string
  /**
   * Optional icon to display beside the label
   */
  readonly icon?: ReactNode
  /**
   * Whether this option is disabled
   */
  readonly disabled?: boolean
  /**
   * Optional description text
   */
  readonly description?: string
  /**
   * Optional group identifier for sectioned lists
   */
  readonly group?: string
}

export interface SelectGroup {
  /**
   * Group title
   */
  readonly title: string
  /**
   * Group identifier
   */
  readonly id: string
  /**
   * Options in this group
   */
  readonly options: readonly SelectOption[]
}

export type SelectValue = string | readonly string[]

export interface SelectProps {
  /**
   * Available options to select from
   */
  readonly options: readonly SelectOption[]

  /**
   * Currently selected value(s)
   * - Single select: string
   * - Multi select: string[]
   */
  readonly value?: SelectValue

  /**
   * Called when selection changes
   */
  readonly onSelectionChange?: (value: SelectValue) => void

  /**
   * Whether multiple options can be selected
   * @default false
   */
  readonly multiSelect?: boolean

  /**
   * Placeholder text when no selection is made
   * @default 'Select an option...'
   */
  readonly placeholder?: string

  /**
   * Label text displayed above the select
   */
  readonly label?: string

  /**
   * Whether the label should show a required indicator
   * @default false
   */
  readonly required?: boolean

  /**
   * Whether the select is disabled
   * @default false
   */
  readonly disabled?: boolean

  /**
   * Error message to display
   */
  readonly error?: string

  /**
   * Helper text displayed below the select
   */
  readonly helperText?: string

  /**
   * Visual variant of the select
   * @default 'default'
   */
  readonly variant?: ComponentVariant

  /**
   * Size of the select
   * @default 'medium'
   */
  readonly size?: ComponentSize

  /**
   * Whether to show a search input in the modal
   * @default false
   */
  readonly searchable?: boolean

  /**
   * Custom search placeholder text
   * @default 'Search options...'
   */
  readonly searchPlaceholder?: string

  /**
   * Maximum number of selected items to show before collapsing to count
   * Only applies to multiSelect
   * @default 2
   */
  readonly maxDisplayItems?: number

  /**
   * Whether to show checkmarks for selected items
   * @default true
   */
  readonly showCheckmarks?: boolean

  /**
   * Custom empty state message when no options are found
   * @default 'No options found'
   */
  readonly emptyMessage?: string

  /**
   * Whether to close modal after single selection
   * @default true
   */
  readonly closeOnSelect?: boolean

  /**
   * Custom style for the container
   */
  readonly style?: ViewStyle

  /**
   * Custom style for the trigger button
   */
  readonly triggerStyle?: ViewStyle

  /**
   * Custom style for the trigger text
   */
  readonly triggerTextStyle?: TextStyle

  /**
   * Test identifier for automated testing
   */
  readonly testID?: string

  /**
   * Accessibility label for screen readers
   */
  readonly accessibilityLabel?: string

  /**
   * Accessibility hint for additional context
   */
  readonly accessibilityHint?: string
}

export interface SelectTriggerProps {
  readonly placeholder: string
  readonly selectedValues: readonly string[]
  readonly options: readonly SelectOption[]
  readonly multiSelect: boolean
  readonly maxDisplayItems: number
  readonly disabled: boolean
  readonly error: boolean
  readonly variant: ComponentVariant
  readonly size: ComponentSize
  readonly style?: ViewStyle
  readonly textStyle?: TextStyle
  readonly onPress: () => void
  readonly testID?: string
  readonly accessibilityLabel?: string
  readonly accessibilityHint?: string
}

export interface SelectModalProps {
  readonly visible: boolean
  readonly options: readonly SelectOption[]
  readonly selectedValues: readonly string[]
  readonly searchable: boolean
  readonly searchPlaceholder: string
  readonly emptyMessage: string
  readonly multiSelect: boolean
  readonly showCheckmarks: boolean
  readonly closeOnSelect: boolean
  readonly onSelect: (value: string) => void
  readonly onClose: () => void
  readonly testID?: string
}

export interface SelectOptionItemProps {
  readonly option: SelectOption
  readonly isSelected: boolean
  readonly multiSelect: boolean
  readonly showCheckmarks: boolean
  readonly onPress: () => void
  readonly testID?: string
}
