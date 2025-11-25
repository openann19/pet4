/**
 * Advanced Input Component
 * Production-ready input with validation, accessibility, and design system integration
 */

import * as React from 'react'

const { forwardRef, useCallback, useMemo, useState, useImperativeHandle, useRef } = React
import { motion } from '@petspark/motion'
import { AnimatePresence } from '@/effects/reanimated/animate-presence'
import { cn } from '@/lib/utils'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Input')

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  // Visual variants
  readonly variant?: 'default' | 'filled' | 'underlined' | 'unstyled'
  readonly size?: 'sm' | 'md' | 'lg'

  // States
  readonly loading?: boolean
  readonly error?: boolean
  readonly success?: boolean

  // Validation
  readonly errorMessage?: string
  readonly successMessage?: string
  readonly helperText?: string

  // Icons and addons
  readonly leftIcon?: React.ReactNode
  readonly rightIcon?: React.ReactNode
  readonly leftAddon?: React.ReactNode
  readonly rightAddon?: React.ReactNode

  // Labels and descriptions
  readonly label?: string
  readonly description?: string
  readonly isRequired?: boolean

  // Advanced features
  readonly clearable?: boolean
  readonly showCounter?: boolean
  readonly maxLength?: number
  readonly debounceMs?: number
  readonly trackingId?: string

  // Callbacks
  readonly onClear?: () => void
  readonly onDebounceChange?: (value: string) => void

  // Animation
  readonly disableAnimation?: boolean
}

export interface InputRef extends HTMLInputElement {
  readonly focus: () => void
  readonly blur: () => void
  readonly clear: () => void
}

// Input variant styles
const inputVariants = {
  default: 'border border-input bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-ring',
  filled: 'bg-muted border border-transparent focus-visible:bg-background focus-visible:border-input focus-visible:ring-1 focus-visible:ring-ring',
  underlined: 'border-0 border-b border-input bg-transparent focus-visible:border-primary focus-visible:ring-0 rounded-none',
  unstyled: 'border-0 bg-transparent focus-visible:ring-0'
} as const

const inputSizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-4 text-base'
} as const

const iconSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-4 w-4'
} as const

// Animation variants
const messageAnimations = {
  initial: { opacity: 0, y: -5, height: 0 },
  animate: { opacity: 1, y: 0, height: 'auto' },
  exit: { opacity: 0, y: -5, height: 0 }
} as const

// Clear icon component
const ClearIcon: React.FC<{ size: keyof typeof iconSizes; onClick: () => void }> = ({ size, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-sm",
      iconSizes[size]
    )}
    aria-label="Clear input"
  >
    <svg
      className="h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
)

// Loading spinner component
const LoadingSpinner: React.FC<{ size: keyof typeof iconSizes }> = ({ size }) => (
  <div className={cn("absolute right-2 top-1/2 -translate-y-1/2 animate-spin", iconSizes[size])}>
    <svg
      className="h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
)

export const Input = forwardRef<InputRef, InputProps>(
  ({
    variant = 'default',
    size = 'md',
    loading = false,
    error = false,
    success = false,
    errorMessage,
    successMessage,
    helperText,
    leftIcon,
    rightIcon,
    leftAddon,
    rightAddon,
    label,
    description,
    isRequired = false,
    clearable = false,
    showCounter = false,
    maxLength,
    debounceMs = 300,
    trackingId,
    onClear,
    onDebounceChange,
    disableAnimation = false,
    className,
    id,
    value,
    defaultValue,
    onChange,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<NodeJS.Timeout>()
    const [isFocused, setIsFocused] = useState(false)
    const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? '')

    // Generate unique ID if not provided
    const inputId = id ?? `input-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${inputId}-error`
    const descriptionId = `${inputId}-description`
    const helperId = `${inputId}-helper`

    // Expose input methods through ref
    useImperativeHandle(ref, () => ({
      ...inputRef.current!,
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => handleClear()
    }), [])

    // Handle input change with debouncing
    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value
      setInternalValue(newValue)

      // Call immediate onChange
      onChange?.(event)

      // Handle debounced change
      if (onDebounceChange) {
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          onDebounceChange(newValue)
        }, debounceMs)
      }

      // Analytics tracking
      if (trackingId) {
        logger.info('Input changed', { trackingId, length: newValue.length })
      }
    }, [onChange, onDebounceChange, debounceMs, trackingId])

    // Handle focus/blur
    const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(event)

      if (trackingId) {
        logger.info('Input focused', { trackingId })
      }
    }, [onFocus, trackingId])

    const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(event)

      if (trackingId) {
        logger.info('Input blurred', { trackingId })
      }
    }, [onBlur, trackingId])

    // Handle clear
    const handleClear = useCallback(() => {
      setInternalValue('')
      onClear?.()

      // Focus input after clear
      inputRef.current?.focus()

      // Create synthetic change event
      if (onChange && inputRef.current) {
        const syntheticEvent = {
          target: { ...inputRef.current, value: '' }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }

      if (trackingId) {
        logger.info('Input cleared', { trackingId })
      }
    }, [onClear, onChange, trackingId])

    // Determine current value for display
    const currentValue = value !== undefined ? value : internalValue
    const hasValue = String(currentValue).length > 0
    const characterCount = String(currentValue).length

    // Compute input classes
    const inputClasses = useMemo(() => cn(
      // Base styles
      'flex w-full rounded-md font-normal placeholder:text-muted-foreground',
      'focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors',

      // Variant styles
      inputVariants[variant],

      // Size styles
      inputSizes[size],

      // State styles
      error && 'border-destructive focus-visible:ring-destructive',
      success && 'border-green-500 focus-visible:ring-green-500',
      isFocused && variant === 'underlined' && 'border-b-2',

      // Icon/addon padding adjustments
      leftIcon && 'pl-9',
      rightIcon && 'pr-9',
      (clearable && hasValue) && 'pr-9',
      loading && 'pr-9',
      leftAddon && 'rounded-l-none',
      rightAddon && 'rounded-r-none',

      className
    ), [variant, size, error, success, isFocused, leftIcon, rightIcon, clearable, hasValue, loading, leftAddon, rightAddon, className])

    // Container classes
    const containerClasses = cn(
      'relative w-full',
      leftAddon && 'flex',
      rightAddon && 'flex'
    )

    // Message to display (error takes precedence)
    const displayMessage = error && errorMessage ? errorMessage :
      success && successMessage ? successMessage :
        helperText

    const messageType = error && errorMessage ? 'error' :
      success && successMessage ? 'success' :
        'helper'

    // Accessibility props
    const accessibilityProps = {
      'aria-invalid': error,
      'aria-describedby': cn(
        description && descriptionId,
        displayMessage && (messageType === 'error' ? errorId : helperId)
      ).trim() ?? undefined,
      'aria-required': isRequired
    }

    // Input element
    const inputElement = (
      <input
        ref={inputRef}
        id={inputId}
        className={inputClasses}
        value={currentValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        maxLength={maxLength}
        data-tracking-id={trackingId}
        {...accessibilityProps}
        {...props}
      />
    )

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive"
            )}
          >
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        {/* Description */}
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {/* Input container */}
        <div className={containerClasses}>
          {/* Left addon */}
          {leftAddon && (
            <div className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
              {leftAddon}
            </div>
          )}

          {/* Input wrapper */}
          <div className="relative flex-1">
            {/* Left icon */}
            {leftIcon && (
              <div className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground",
                iconSizes[size]
              )}>
                {leftIcon}
              </div>
            )}

            {/* Input element */}
            {inputElement}

            {/* Right side icons/controls */}
            {loading && <LoadingSpinner size={size} />}
            {!loading && clearable && hasValue && <ClearIcon size={size} onClick={handleClear} />}
            {!loading && !clearable && rightIcon && (
              <div className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground",
                iconSizes[size]
              )}>
                {rightIcon}
              </div>
            )}
          </div>

          {/* Right addon */}
          {rightAddon && (
            <div className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-muted-foreground text-sm">
              {rightAddon}
            </div>
          )}
        </div>

        {/* Messages and counter */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {displayMessage && (
                <motion.p
                  key={messageType}
                  id={messageType === 'error' ? errorId : helperId}
                  className={cn(
                    "text-sm",
                    messageType === 'error' && "text-destructive",
                    messageType === 'success' && "text-green-600",
                    messageType === 'helper' && "text-muted-foreground"
                  )}
                  initial={disableAnimation ? undefined : messageAnimations.initial}
                  animate={disableAnimation ? undefined : messageAnimations.animate}
                  exit={disableAnimation ? undefined : messageAnimations.exit}
                  transition={{ duration: 0.2 }}
                >
                  {displayMessage}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Character counter */}
          {showCounter && maxLength && (
            <div className={cn(
              "text-xs tabular-nums",
              characterCount > maxLength * 0.9 && "text-amber-600",
              characterCount >= maxLength && "text-destructive",
              "text-muted-foreground"
            )}>
              {characterCount}/{maxLength}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea variant
export const Textarea = forwardRef<HTMLTextAreaElement,
  Omit<InputProps, 'leftIcon' | 'rightIcon' | 'leftAddon' | 'rightAddon'> &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>
>(({
  variant = 'default',
  size: _size = 'md',
  className,
  rows = 3,
  ...props
}, ref) => {
  const textareaClasses = cn(
    // Base styles
    'flex min-h-[60px] w-full rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground',
    'focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    'resize-none transition-colors',

    // Variant styles
    inputVariants[variant],

    className
  )

  return (
    <textarea
      ref={ref}
      className={textareaClasses}
      rows={rows}
      {...props}
    />
  )
})

Textarea.displayName = 'Textarea'
