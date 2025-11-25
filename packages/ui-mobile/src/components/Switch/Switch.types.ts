import type { ViewStyle, TextStyle } from 'react-native'
import type { ComponentVariant, ComponentSize } from '../../types/component.types'

export interface SwitchProps {
  /**
   * Whether the switch is checked
   * @default false
   */
  readonly checked?: boolean

  /**
   * Called when the switch state changes
   */
  readonly onCheckedChange?: (checked: boolean) => void

  /**
   * Whether the switch is disabled
   * @default false
   */
  readonly disabled?: boolean

  /**
   * Visual variant of the switch
   * @default 'default'
   */
  readonly variant?: ComponentVariant

  /**
   * Size of the switch
   * @default 'medium'
   */
  readonly size?: ComponentSize

  /**
   * Label text displayed next to the switch
   */
  readonly label?: string

  /**
   * Description text displayed below the label
   */
  readonly description?: string

  /**
   * Custom style for the container
   */
  readonly style?: ViewStyle

  /**
   * Custom style for the track
   */
  readonly trackStyle?: ViewStyle

  /**
   * Custom style for the thumb
   */
  readonly thumbStyle?: ViewStyle

  /**
   * Custom style for the label
   */
  readonly labelStyle?: TextStyle

  /**
   * Custom style for the description
   */
  readonly descriptionStyle?: TextStyle

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

export interface SwitchConfig {
  readonly track: {
    readonly width: number
    readonly height: number
    readonly borderRadius: number
  }
  readonly thumb: {
    readonly size: number
    readonly borderRadius: number
    readonly translateDistance: number
  }
  readonly animation: {
    readonly duration: number
    readonly springConfig: {
      readonly stiffness: number
      readonly damping: number
    }
  }
}

export interface SwitchSizeConfig {
  readonly small: SwitchConfig
  readonly medium: SwitchConfig
  readonly large: SwitchConfig
}
