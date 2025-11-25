/**
 * Form Configuration
 * Mobile-first form component configuration and utilities
 */

import { colorTokens, spacingTokens, animationTokens } from '@petspark/shared'
import type { ValidationConfig } from './Form.types'

// Default form configuration
export const formConfig = {
  defaultMode: 'onSubmit' as const,
  defaultReValidateMode: true,
  defaultAutoFocus: false,
  defaultValidateOnChange: false,
  defaultValidateOnBlur: true,
  animation: {
    enabled: true,
    duration: animationTokens.duration.fast,
  },
  accessibility: {
    announceErrors: true,
    announceSuccess: true,
    focusOnError: true,
  },
  haptics: {
    enabled: true,
    onError: 'notificationError' as const,
    onSuccess: 'notificationSuccess' as const,
    onSubmit: 'impactLight' as const,
  },
} as const

// Form layout configurations
export const formLayouts = {
  default: {
    gap: spacingTokens.md,
    padding: spacingTokens.lg,
  },
  compact: {
    gap: spacingTokens.sm,
    padding: spacingTokens.md,
  },
  spacious: {
    gap: spacingTokens.lg,
    padding: spacingTokens.xl,
  },
} as const

// Form section styles
export const formSectionStyles = {
  container: {
    gap: spacingTokens.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colorTokens.neutral[900],
    marginBottom: spacingTokens.sm,
  },
  description: {
    fontSize: 14,
    color: colorTokens.neutral[600],
    marginBottom: spacingTokens.md,
  },
  collapsible: {
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: spacingTokens.md,
    },
    content: {
      overflow: 'hidden' as const,
    },
  },
} as const

// Form error styles
export const formErrorStyles = {
  container: {
    padding: spacingTokens.md,
    backgroundColor: colorTokens.red[50],
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colorTokens.red[500],
    marginBottom: spacingTokens.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colorTokens.red[800],
    marginBottom: spacingTokens.xs,
  },
  message: {
    fontSize: 14,
    color: colorTokens.red[700],
  },
  list: {
    gap: spacingTokens.xs,
    marginTop: spacingTokens.sm,
  },
  listItem: {
    fontSize: 14,
    color: colorTokens.red[700],
  },
} as const

// Form success styles
export const formSuccessStyles = {
  container: {
    padding: spacingTokens.md,
    backgroundColor: colorTokens.green[50],
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colorTokens.green[500],
    marginBottom: spacingTokens.md,
  },
  message: {
    fontSize: 14,
    color: colorTokens.green[700],
    fontWeight: '500' as const,
  },
} as const

// Built-in validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationConfig['required'] => message,

  email: (message = 'Please enter a valid email address'): ValidationConfig['pattern'] => ({
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message,
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationConfig['pattern'] => ({
    value: /^[\+]?[(]?[\d\s\-\(\)]{10,}$/,
    message,
  }),

  minLength: (length: number, message?: string): ValidationConfig['minLength'] => ({
    value: length,
    message: message || `Must be at least ${length} characters`,
  }),

  maxLength: (length: number, message?: string): ValidationConfig['maxLength'] => ({
    value: length,
    message: message || `Must not exceed ${length} characters`,
  }),

  password: (
    message = 'Password must be at least 8 characters with uppercase, lowercase, and number'
  ): ValidationConfig['pattern'] => ({
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    message,
  }),

  url: (message = 'Please enter a valid URL'): ValidationConfig['pattern'] => ({
    value:
      /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)$/,
    message,
  }),

  numeric: (message = 'Please enter a valid number'): ValidationConfig['pattern'] => ({
    value: /^\d+(\.\d+)?$/,
    message,
  }),

  alphanumeric: (
    message = 'Only letters and numbers are allowed'
  ): ValidationConfig['pattern'] => ({
    value: /^[a-zA-Z0-9]+$/,
    message,
  }),
} as const

// Form field state classes
export const fieldStateStyles = {
  valid: {
    borderColor: colorTokens.green[500],
  },
  invalid: {
    borderColor: colorTokens.red[500],
  },
  touched: {
    // Placeholder for touched styles
  },
  dirty: {
    // Placeholder for dirty styles
  },
  focused: {
    borderColor: colorTokens.blue[500],
    shadowColor: colorTokens.blue[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
} as const

// Animation presets
export const formAnimationPresets = {
  fadeIn: {
    from: { opacity: 0, translateY: 10 },
    to: { opacity: 1, translateY: 0 },
    duration: animationTokens.duration.fast,
  },
  slideIn: {
    from: { opacity: 0, translateX: -20 },
    to: { opacity: 1, translateX: 0 },
    duration: animationTokens.duration.normal,
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
    duration: animationTokens.duration.fast,
  },
  shake: {
    sequence: [
      { translateX: 0 },
      { translateX: -10 },
      { translateX: 10 },
      { translateX: -10 },
      { translateX: 0 },
    ],
    duration: animationTokens.duration.fast,
  },
} as const

// Accessibility constants
export const accessibilityConstants = {
  roles: {
    form: 'form' as const,
    field: 'none' as const,
    section: 'region' as const,
    errorSummary: 'alert' as const,
    submitButton: 'button' as const,
  },
  liveRegions: {
    error: 'assertive' as const,
    success: 'polite' as const,
    status: 'polite' as const,
  },
  announcements: {
    formSubmitted: 'Form submitted successfully',
    formErrors: 'Form contains errors',
    fieldRequired: 'Required field',
    fieldInvalid: 'Invalid field',
    fieldValid: 'Valid field',
  },
} as const

// Test IDs
export const testIds = {
  form: 'form',
  formField: 'form-field',
  formSection: 'form-section',
  formError: 'form-error',
  formSuccess: 'form-success',
  submitButton: 'form-submit-button',
  resetButton: 'form-reset-button',
} as const

// Utility functions
export const validationUtils = {
  /**
   * Validate a value against a validation config
   */
  validateValue: <T>(
    value: T,
    config: ValidationConfig<T>,
    formData?: Record<string, any>
  ): string | undefined => {
    // Required validation
    if (config.required) {
      if (value === undefined || value === null || value === '') {
        return typeof config.required === 'string' ? config.required : 'This field is required'
      }
    }

    // Skip other validations if value is empty (and not required)
    if (value === undefined || value === null || value === '') {
      return undefined
    }

    // String validations
    if (typeof value === 'string') {
      // Min length
      if (config.minLength) {
        const minLength =
          typeof config.minLength === 'number' ? config.minLength : config.minLength.value
        const message =
          typeof config.minLength === 'number'
            ? `Must be at least ${minLength} characters`
            : config.minLength.message

        if (value.length < minLength) {
          return message
        }
      }

      // Max length
      if (config.maxLength) {
        const maxLength =
          typeof config.maxLength === 'number' ? config.maxLength : config.maxLength.value
        const message =
          typeof config.maxLength === 'number'
            ? `Must not exceed ${maxLength} characters`
            : config.maxLength.message

        if (value.length > maxLength) {
          return message
        }
      }

      // Pattern validation
      if (config.pattern) {
        const pattern = config.pattern instanceof RegExp ? config.pattern : config.pattern.value
        const message = config.pattern instanceof RegExp ? 'Invalid format' : config.pattern.message

        if (!pattern.test(value)) {
          return message
        }
      }
    }

    // Custom validation rules
    if (config.custom) {
      const rules = Array.isArray(config.custom) ? config.custom : [config.custom]

      for (const rule of rules) {
        const error = rule(value)
        if (error) {
          return error
        }
      }
    }

    // Cross-field validation
    if (config.validate && formData) {
      return config.validate(value, formData)
    }

    return undefined
  },

  /**
   * Check if a value is empty
   */
  isEmpty: (value: any): boolean => {
    return (
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0)
    )
  },

  /**
   * Sanitize form data
   */
  sanitizeFormData: (data: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(data)) {
      if (!validationUtils.isEmpty(value)) {
        // Trim strings
        if (typeof value === 'string') {
          sanitized[key] = value.trim()
        } else {
          sanitized[key] = value
        }
      }
    }

    return sanitized
  },
} as const
