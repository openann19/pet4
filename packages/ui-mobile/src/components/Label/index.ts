/**
 * Label Component
 * Export point for mobile Label component and related utilities
 */

export { Label, FieldWrapper, RequiredIndicator, OptionalIndicator, Message } from './Label.native'
export type {
  LabelProps,
  FieldWrapperProps,
  RequiredIndicatorProps,
  OptionalIndicatorProps,
  MessageProps,
  LabelConfig,
} from './Label.types'
export {
  labelConfig,
  labelVariants,
  labelSizes,
  requiredIndicatorStyles,
  optionalIndicatorStyles,
  descriptionStyles,
  messageVariants,
  messageSizes,
  fieldSpacing,
  disabledStyles,
  animationPresets,
  accessibilityConstants,
  testIds,
} from './Label.config'

// Default export
export { Label as default } from './Label.native'
