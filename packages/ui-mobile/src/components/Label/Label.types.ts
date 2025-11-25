/**
 * Label Types
 * Mobile-first label component type definitions
 */

import type { ReactNode } from 'react'
import type { TextStyle, ViewStyle } from 'react-native'
import type { AccessibilityRole, AccessibilityState } from 'react-native'

export interface LabelProps {
  /**
   * Label text content
   */
  readonly children: ReactNode

  /**
   * Visual variant of the label
   * @default 'default'
   */
  readonly variant?: 'default' | 'destructive' | 'muted' | 'success' | 'warning'

  /**
   * Size of the label text
   * @default 'md'
   */
  readonly size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  /**
   * Whether the field is required (shows asterisk)
   * @default false
   */
  readonly required?: boolean

  /**
   * Whether the field is optional (shows "(optional)" text)
   * @default false
   */
  readonly optional?: boolean

  /**
   * Whether the label is disabled
   * @default false
   */
  readonly disabled?: boolean

  /**
   * Additional description text below the label
   */
  readonly description?: string

  /**
   * HTML-like id for association with form controls
   * Used for accessibility relationship
   */
  readonly htmlFor?: string

  /**
   * ID of the element this label describes
   * Used for accessibilityLabelledBy
   */
  readonly nativeID?: string

  /**
   * Custom accessibility label
   */
  readonly accessibilityLabel?: string

  /**
   * Accessibility role override
   * @default 'text'
   */
  readonly accessibilityRole?: AccessibilityRole

  /**
   * Accessibility state
   */
  readonly accessibilityState?: AccessibilityState

  /**
   * Whether to enable haptic feedback on interaction
   * @default false
   */
  readonly enableHaptics?: boolean

  /**
   * Custom text style override
   */
  readonly style?: TextStyle

  /**
   * Container style override
   */
  readonly containerStyle?: ViewStyle

  /**
   * Additional CSS class for styling (if using NativeWind/styled-components)
   */
  readonly className?: string

  /**
   * Test ID for automated testing
   */
  readonly testID?: string

  /**
   * Callback when label is pressed (if interactive)
   */
  readonly onPress?: () => void

  /**
   * Whether the label should be interactive
   * @default false
   */
  readonly interactive?: boolean

  /**
   * Animation configuration
   */
  readonly animation?: {
    readonly enabled?: boolean
    readonly type?: 'fade' | 'scale' | 'bounce'
    readonly duration?: number
  }
}

export interface FieldWrapperProps {
  /**
   * Label text
   */
  readonly label?: string

  /**
   * Description text below label
   */
  readonly description?: string

  /**
   * Whether the field is required
   * @default false
   */
  readonly required?: boolean

  /**
   * Whether the field is optional
   * @default false
   */
  readonly optional?: boolean

  /**
   * Error message to display
   */
  readonly error?: string

  /**
   * Success message to display
   */
  readonly success?: string

  /**
   * Warning message to display
   */
  readonly warning?: string

  /**
   * Whether the field is disabled
   * @default false
   */
  readonly disabled?: boolean

  /**
   * Form control element(s)
   */
  readonly children: ReactNode

  /**
   * Container style
   */
  readonly containerStyle?: ViewStyle

  /**
   * Additional props to pass to the Label component
   */
  readonly labelProps?: Omit<LabelProps, 'children'>

  /**
   * Test ID for the wrapper
   */
  readonly testID?: string

  /**
   * Spacing between elements
   * @default 'md'
   */
  readonly spacing?: 'xs' | 'sm' | 'md' | 'lg'
}

export interface LabelConfig {
  /**
   * Default variant
   */
  readonly defaultVariant: LabelProps['variant']

  /**
   * Default size
   */
  readonly defaultSize: LabelProps['size']

  /**
   * Default spacing
   */
  readonly defaultSpacing: FieldWrapperProps['spacing']

  /**
   * Animation settings
   */
  readonly animation: {
    readonly enabled: boolean
    readonly duration: number
  }

  /**
   * Accessibility settings
   */
  readonly accessibility: {
    readonly announceChanges: boolean
    readonly includeInAccessibilityTree: boolean
  }

  /**
   * Haptic feedback settings
   */
  readonly haptics: {
    readonly enabled: boolean
    readonly intensity: 'light' | 'medium' | 'heavy'
  }
}

// Required/Optional indicator types
export interface RequiredIndicatorProps {
  readonly variant?: LabelProps['variant']
  readonly size?: LabelProps['size']
  readonly style?: TextStyle
}

export interface OptionalIndicatorProps {
  readonly variant?: LabelProps['variant']
  readonly size?: LabelProps['size']
  readonly style?: TextStyle
}

// Message component types
export interface MessageProps {
  readonly type: 'error' | 'success' | 'warning' | 'info'
  readonly children: ReactNode
  readonly size?: LabelProps['size']
  readonly style?: TextStyle
  readonly testID?: string
}
