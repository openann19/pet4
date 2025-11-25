/**
 * Component Types - Shared types for UI components
 */

export type ComponentVariant = 'default' | 'filled' | 'outlined' | 'ghost'
export type ComponentSize = 'small' | 'medium' | 'large'

export interface BaseComponentProps {
  /**
   * Visual variant of the component
   * @default 'default'
   */
  readonly variant?: ComponentVariant

  /**
   * Size of the component
   * @default 'medium'
   */
  readonly size?: ComponentSize

  /**
   * Whether the component is disabled
   * @default false
   */
  readonly disabled?: boolean

  /**
   * Test identifier for automated testing
   */
  readonly testID?: string
}
