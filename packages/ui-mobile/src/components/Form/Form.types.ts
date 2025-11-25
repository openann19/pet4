/**
 * Form Types
 * Mobile-first form component type definitions
 */

import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

// Base form validation types
export interface FormFieldError {
  readonly message: string
  readonly code?: string
}

export interface FormFieldState<T = any> {
  readonly value: T
  readonly error?: FormFieldError
  readonly touched: boolean
  readonly dirty: boolean
  readonly valid: boolean
}

export interface FormState {
  readonly fields: Record<string, FormFieldState>
  readonly isValid: boolean
  readonly isDirty: boolean
  readonly isSubmitting: boolean
  readonly submitCount: number
  readonly errors: Record<string, FormFieldError>
}

// Validation functions
export type ValidationRule<T = any> = (value: T) => string | undefined

export interface ValidationConfig<T = any> {
  readonly required?: boolean | string
  readonly minLength?: number | { readonly value: number; readonly message: string }
  readonly maxLength?: number | { readonly value: number; readonly message: string }
  readonly pattern?: RegExp | { readonly value: RegExp; readonly message: string }
  readonly custom?: ValidationRule<T> | ReadonlyArray<ValidationRule<T>>
  readonly validate?: (value: T, formData: Record<string, any>) => string | undefined
}

// Form field registration
export interface FormFieldConfig<T = any> {
  readonly name: string
  readonly defaultValue?: T
  readonly validation?: ValidationConfig<T>
  readonly validateOnChange?: boolean
  readonly validateOnBlur?: boolean
}

// Form submission
export interface FormSubmissionData {
  readonly [key: string]: any
}

export interface FormSubmissionResult {
  readonly success: boolean
  readonly data?: any
  readonly errors?: Record<string, FormFieldError>
}

export type FormSubmitHandler = (
  data: FormSubmissionData
) => Promise<FormSubmissionResult> | FormSubmissionResult

// Form component props
export interface FormProps {
  /**
   * Form submission handler
   */
  readonly onSubmit: FormSubmitHandler

  /**
   * Initial form values
   */
  readonly defaultValues?: Record<string, any>

  /**
   * Validation mode
   * @default 'onSubmit'
   */
  readonly mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all'

  /**
   * Whether to re-validate on submit after an error
   * @default true
   */
  readonly reValidateMode?: boolean

  /**
   * Form children
   */
  readonly children: ReactNode

  /**
   * Form container styles
   */
  readonly style?: ViewStyle

  /**
   * CSS class name (for styling systems)
   */
  readonly className?: string

  /**
   * Test ID for testing
   */
  readonly testID?: string

  /**
   * Whether form is disabled
   * @default false
   */
  readonly disabled?: boolean

  /**
   * Auto-focus first field on mount
   * @default false
   */
  readonly autoFocus?: boolean

  /**
   * Form reset callback
   */
  readonly onReset?: () => void

  /**
   * Form state change callback
   */
  readonly onStateChange?: (state: FormState) => void

  /**
   * Validation error callback
   */
  readonly onValidationError?: (errors: Record<string, FormFieldError>) => void
}

// Form context types
export interface FormContextValue {
  /**
   * Current form state
   */
  readonly formState: FormState

  /**
   * Register a form field
   */
  readonly register: (config: FormFieldConfig) => FormFieldRegistration

  /**
   * Unregister a form field
   */
  readonly unregister: (name: string) => void

  /**
   * Set field value
   */
  readonly setValue: (name: string, value: any) => void

  /**
   * Get field value
   */
  readonly getValue: (name: string) => any

  /**
   * Get field state
   */
  readonly getFieldState: (name: string) => FormFieldState | undefined

  /**
   * Set field error
   */
  readonly setFieldError: (name: string, error: FormFieldError) => void

  /**
   * Clear field error
   */
  readonly clearFieldError: (name: string) => void

  /**
   * Clear all errors
   */
  readonly clearErrors: () => void

  /**
   * Validate single field
   */
  readonly validateField: (name: string) => Promise<boolean>

  /**
   * Validate all fields
   */
  readonly validateForm: () => Promise<boolean>

  /**
   * Submit the form
   */
  readonly submitForm: () => Promise<void>

  /**
   * Reset the form
   */
  readonly resetForm: (values?: Record<string, any>) => void

  /**
   * Whether form is disabled
   */
  readonly disabled: boolean
}

// Field registration result
export interface FormFieldRegistration {
  readonly name: string
  readonly value: any
  readonly error?: FormFieldError
  readonly touched: boolean
  readonly onChange: (value: any) => void
  readonly onBlur: () => void
  readonly onFocus: () => void
}

// Form field component props
export interface FormFieldProps {
  /**
   * Field name (must be unique within form)
   */
  readonly name: string

  /**
   * Field children (render prop or element)
   */
  readonly children: ReactNode | ((field: FormFieldRegistration) => ReactNode)

  /**
   * Field validation config
   */
  readonly validation?: ValidationConfig

  /**
   * Default field value
   */
  readonly defaultValue?: any

  /**
   * Whether to validate on change
   * @default false
   */
  readonly validateOnChange?: boolean

  /**
   * Whether to validate on blur
   * @default true
   */
  readonly validateOnBlur?: boolean
}

// Form section component props
export interface FormSectionProps {
  /**
   * Section title
   */
  readonly title?: string

  /**
   * Section description
   */
  readonly description?: string

  /**
   * Section children
   */
  readonly children: ReactNode

  /**
   * Section container styles
   */
  readonly style?: ViewStyle

  /**
   * Whether section is collapsible
   * @default false
   */
  readonly collapsible?: boolean

  /**
   * Whether section starts collapsed (if collapsible)
   * @default false
   */
  readonly defaultCollapsed?: boolean

  /**
   * Test ID
   */
  readonly testID?: string
}

// Form submit button props
export interface FormSubmitButtonProps {
  /**
   * Button text
   */
  readonly children: ReactNode

  /**
   * Button styles
   */
  readonly style?: ViewStyle

  /**
   * Whether button is disabled when form is invalid
   * @default true
   */
  readonly disableOnInvalid?: boolean

  /**
   * Whether button is disabled when form is submitting
   * @default true
   */
  readonly disableOnSubmitting?: boolean

  /**
   * Custom disabled state
   */
  readonly disabled?: boolean

  /**
   * Loading state override
   */
  readonly loading?: boolean

  /**
   * Test ID
   */
  readonly testID?: string

  /**
   * Additional button props
   */
  readonly [key: string]: any
}

// Utility types
export type FormValues<T extends Record<string, any> = Record<string, any>> = T

export interface UseFormReturn<T extends FormValues = FormValues> {
  /**
   * Form state
   */
  readonly formState: FormState

  /**
   * Get form values
   */
  readonly getValues: () => T

  /**
   * Set form values
   */
  readonly setValues: (values: Partial<T>) => void

  /**
   * Reset form
   */
  readonly reset: (values?: Partial<T>) => void

  /**
   * Submit form
   */
  readonly handleSubmit: (onSubmit: FormSubmitHandler) => (event?: any) => Promise<void>

  /**
   * Field registration helpers
   */
  readonly register: FormContextValue['register']
  readonly unregister: FormContextValue['unregister']
  readonly setValue: FormContextValue['setValue']
  readonly getValue: FormContextValue['getValue']
  readonly getFieldState: FormContextValue['getFieldState']
  readonly setFieldError: FormContextValue['setFieldError']
  readonly clearFieldError: FormContextValue['clearFieldError']
  readonly clearErrors: FormContextValue['clearErrors']
  readonly validateField: FormContextValue['validateField']
  readonly validateForm: FormContextValue['validateForm']
}
