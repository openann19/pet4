/**
 * Form Component
 * Export point for mobile Form component and related utilities
 */

export { Form, useForm, useFormField } from './Form.native'

export {
  FormField,
  FormSection,
  FormSubmitButton,
  FormResetButton,
  FormInput,
} from './FormComponents.native'

export type {
  FormProps,
  FormContextValue,
  FormFieldProps,
  FormFieldRegistration,
  FormState,
  FormFieldState,
  FormFieldError,
  FormFieldConfig,
  FormSectionProps,
  FormSubmitButtonProps,
  FormSubmissionData,
  FormSubmissionResult,
  FormSubmitHandler,
  ValidationConfig,
  ValidationRule,
  FormValues,
  UseFormReturn,
} from './Form.types'

export {
  formConfig,
  formLayouts,
  validationRules,
  validationUtils,
  formSectionStyles,
  formErrorStyles,
  formSuccessStyles,
  fieldStateStyles,
  formAnimationPresets,
  accessibilityConstants,
  testIds,
} from './Form.config'

// Default export
export { Form as default } from './Form.native'
