/**
 * Label Configuration
 * Mobile-first label component configuration and constants
 */

import type { LabelConfig } from './Label.types'
import { colorTokens, spacingTokens, typographyTokens, animationTokens } from '@petspark/shared'

// Default configuration
export const labelConfig: LabelConfig = {
  defaultVariant: 'default',
  defaultSize: 'md',
  defaultSpacing: 'md',
  animation: {
    enabled: true,
    duration: animationTokens.duration.fast,
  },
  accessibility: {
    announceChanges: true,
    includeInAccessibilityTree: true,
  },
  haptics: {
    enabled: true,
    intensity: 'light',
  },
} as const

// Label variant styles
export const labelVariants = {
  default: {
    color: colorTokens.neutral[900],
  },
  destructive: {
    color: colorTokens.red[600],
  },
  muted: {
    color: colorTokens.neutral[500],
  },
  success: {
    color: colorTokens.green[600],
  },
  warning: {
    color: colorTokens.yellow[600],
  },
} as const

// Label size styles
export const labelSizes = {
  xs: {
    fontSize: typographyTokens.fontSize.xs,
    lineHeight: typographyTokens.lineHeight.xs,
    fontWeight: typographyTokens.fontWeight.medium,
  },
  sm: {
    fontSize: typographyTokens.fontSize.sm,
    lineHeight: typographyTokens.lineHeight.sm,
    fontWeight: typographyTokens.fontWeight.medium,
  },
  md: {
    fontSize: typographyTokens.fontSize.base,
    lineHeight: typographyTokens.lineHeight.base,
    fontWeight: typographyTokens.fontWeight.medium,
  },
  lg: {
    fontSize: typographyTokens.fontSize.lg,
    lineHeight: typographyTokens.lineHeight.lg,
    fontWeight: typographyTokens.fontWeight.medium,
  },
  xl: {
    fontSize: typographyTokens.fontSize.xl,
    lineHeight: typographyTokens.lineHeight.xl,
    fontWeight: typographyTokens.fontWeight.medium,
  },
} as const

// Required indicator styles
export const requiredIndicatorStyles = {
  xs: {
    fontSize: typographyTokens.fontSize.xs,
    marginLeft: spacingTokens.xs,
  },
  sm: {
    fontSize: typographyTokens.fontSize.sm,
    marginLeft: spacingTokens.xs,
  },
  md: {
    fontSize: typographyTokens.fontSize.base,
    marginLeft: spacingTokens.sm,
  },
  lg: {
    fontSize: typographyTokens.fontSize.lg,
    marginLeft: spacingTokens.sm,
  },
  xl: {
    fontSize: typographyTokens.fontSize.xl,
    marginLeft: spacingTokens.sm,
  },
} as const

// Optional indicator styles
export const optionalIndicatorStyles = {
  xs: {
    fontSize: typographyTokens.fontSize.xs - 1,
    marginLeft: spacingTokens.xs,
    fontWeight: typographyTokens.fontWeight.normal,
  },
  sm: {
    fontSize: typographyTokens.fontSize.xs,
    marginLeft: spacingTokens.xs,
    fontWeight: typographyTokens.fontWeight.normal,
  },
  md: {
    fontSize: typographyTokens.fontSize.sm,
    marginLeft: spacingTokens.sm,
    fontWeight: typographyTokens.fontWeight.normal,
  },
  lg: {
    fontSize: typographyTokens.fontSize.base,
    marginLeft: spacingTokens.sm,
    fontWeight: typographyTokens.fontWeight.normal,
  },
  xl: {
    fontSize: typographyTokens.fontSize.lg,
    marginLeft: spacingTokens.sm,
    fontWeight: typographyTokens.fontWeight.normal,
  },
} as const

// Description text styles
export const descriptionStyles = {
  xs: {
    fontSize: typographyTokens.fontSize.xs - 1,
    lineHeight: typographyTokens.lineHeight.xs,
    marginTop: spacingTokens.xs,
  },
  sm: {
    fontSize: typographyTokens.fontSize.xs,
    lineHeight: typographyTokens.lineHeight.xs,
    marginTop: spacingTokens.xs,
  },
  md: {
    fontSize: typographyTokens.fontSize.sm,
    lineHeight: typographyTokens.lineHeight.sm,
    marginTop: spacingTokens.sm,
  },
  lg: {
    fontSize: typographyTokens.fontSize.base,
    lineHeight: typographyTokens.lineHeight.base,
    marginTop: spacingTokens.sm,
  },
  xl: {
    fontSize: typographyTokens.fontSize.lg,
    lineHeight: typographyTokens.lineHeight.lg,
    marginTop: spacingTokens.md,
  },
} as const

// Message styles (error, success, warning)
export const messageVariants = {
  error: {
    color: colorTokens.red[600],
  },
  success: {
    color: colorTokens.green[600],
  },
  warning: {
    color: colorTokens.yellow[600],
  },
  info: {
    color: colorTokens.blue[600],
  },
} as const

export const messageSizes = {
  xs: {
    fontSize: typographyTokens.fontSize.xs - 1,
    lineHeight: typographyTokens.lineHeight.xs,
  },
  sm: {
    fontSize: typographyTokens.fontSize.xs,
    lineHeight: typographyTokens.lineHeight.xs,
  },
  md: {
    fontSize: typographyTokens.fontSize.sm,
    lineHeight: typographyTokens.lineHeight.sm,
  },
  lg: {
    fontSize: typographyTokens.fontSize.base,
    lineHeight: typographyTokens.lineHeight.base,
  },
  xl: {
    fontSize: typographyTokens.fontSize.lg,
    lineHeight: typographyTokens.lineHeight.lg,
  },
} as const

// Spacing configurations
export const fieldSpacing = {
  xs: {
    gap: spacingTokens.xs,
    marginBottom: spacingTokens.xs,
  },
  sm: {
    gap: spacingTokens.sm,
    marginBottom: spacingTokens.sm,
  },
  md: {
    gap: spacingTokens.md,
    marginBottom: spacingTokens.md,
  },
  lg: {
    gap: spacingTokens.lg,
    marginBottom: spacingTokens.lg,
  },
} as const

// Disabled state styles
export const disabledStyles = {
  opacity: 0.6,
  color: colorTokens.neutral[400],
} as const

// Animation presets
export const animationPresets = {
  fade: {
    duration: animationTokens.duration.fast,
    easing: animationTokens.easing.easeOut,
  },
  scale: {
    duration: animationTokens.duration.normal,
    easing: animationTokens.easing.bounceOut,
    scaleTo: 1.02,
  },
  bounce: {
    duration: animationTokens.duration.slow,
    easing: animationTokens.easing.bounceOut,
    translateY: -2,
  },
} as const

// Accessibility constants
export const accessibilityConstants = {
  roles: {
    label: 'text' as const,
    interactiveLabel: 'button' as const,
    fieldWrapper: 'none' as const,
  },
  traits: {
    required: { required: true },
    disabled: { disabled: true },
    interactive: { button: true },
  },
  announcements: {
    required: 'Required field',
    optional: 'Optional field',
    error: 'Error: ',
    success: 'Success: ',
    warning: 'Warning: ',
    info: 'Info: ',
  },
} as const

// Test IDs
export const testIds = {
  label: 'label',
  requiredIndicator: 'label-required-indicator',
  optionalIndicator: 'label-optional-indicator',
  description: 'label-description',
  message: 'label-message',
  fieldWrapper: 'field-wrapper',
} as const
