/**
 * Advanced Checkbox Component
 * Production-ready checkbox with accessibility, animations, and design system integration
 */

import * as React from 'react'

const { forwardRef, useCallback, useMemo } = React
import { motion } from '@petspark/motion'
import { cn } from '@/lib/utils'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Checkbox')

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  // Visual variants
  readonly variant?: 'default' | 'destructive' | 'success'
  readonly size?: 'sm' | 'md' | 'lg'

  // States
  readonly checked?: boolean
  readonly indeterminate?: boolean
  readonly error?: boolean
  readonly disabled?: boolean

  // Content
  readonly label?: string
  readonly description?: string
  readonly errorMessage?: string

  // Advanced features
  readonly trackingId?: string
  readonly disableAnimation?: boolean
  readonly customIcon?: React.ReactNode
  readonly customIndeterminateIcon?: React.ReactNode

  // Callbacks
  readonly onCheckedChange?: (checked: boolean) => void
}

export interface CheckboxRef extends HTMLInputElement {
  readonly focus: () => void
  readonly blur: () => void
}

// Checkbox variant styles
const checkboxVariants = {
  default: {
    base: 'border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
    focus: 'focus-visible:ring-primary'
  },
  destructive: {
    base: 'border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground',
    focus: 'focus-visible:ring-destructive'
  },
  success: {
    base: 'border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:text-white',
    focus: 'focus-visible:ring-green-500'
  }
} as const

const checkboxSizes = {
  sm: {
    checkbox: 'h-3 w-3',
    icon: 'h-2.5 w-2.5',
    text: 'text-xs'
  },
  md: {
    checkbox: 'h-4 w-4',
    icon: 'h-3 w-3',
    text: 'text-sm'
  },
  lg: {
    checkbox: 'h-5 w-5',
    icon: 'h-4 w-4',
    text: 'text-base'
  }
} as const

// Animation variants
const checkboxAnimations = {
  checked: {
    scale: [0.8, 1.1, 1],
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  unchecked: {
    scale: 1,
    transition: { duration: 0.1 }
  }
}

// Default check icon
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

// Default indeterminate icon
const IndeterminateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
)

export const Checkbox = forwardRef<CheckboxRef, CheckboxProps>(
  ({
    variant = 'default',
    size = 'md',
    checked = false,
    indeterminate = false,
    error = false,
    disabled = false,
    label,
    description,
    errorMessage,
    trackingId,
    disableAnimation = false,
    customIcon,
    customIndeterminateIcon,
    onCheckedChange,
    className,
    id,
    onChange,
    ...props
  }, ref) => {
    // Generate unique ID if not provided
    const checkboxId = id ?? `checkbox-${Math.random().toString(36).substr(2, 9)}`
    const descriptionId = `${checkboxId}-description`
    const errorId = `${checkboxId}-error`

    // Determine current state
    const isChecked = indeterminate ? false : checked
    const dataState = indeterminate ? 'indeterminate' : isChecked ? 'checked' : 'unchecked'

    // Handle change
    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = event.target.checked

      // Call original onChange
      onChange?.(event)

      // Call onCheckedChange
      onCheckedChange?.(newChecked)

      // Analytics tracking
      if (trackingId) {
        logger.info('Checkbox toggled', {
          trackingId,
          checked: newChecked,
          indeterminate,
          variant,
          size
        })
      }
    }, [onChange, onCheckedChange, trackingId, indeterminate, variant, size])

    // Checkbox classes
    const checkboxClasses = useMemo(() => cn(
      // Base styles
      'peer shrink-0 rounded-sm border border-input shadow transition-colors',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-50',

      // Size styles
      checkboxSizes[size].checkbox,

      // Variant styles
      error ? checkboxVariants.destructive.base : checkboxVariants[variant].base,
      error ? checkboxVariants.destructive.focus : checkboxVariants[variant].focus,

      // State styles
      'data-[state=checked]:border-transparent',
      'data-[state=indeterminate]:border-transparent',

      className
    ), [variant, size, error, className])

    // Label classes
    const labelClasses = cn(
      'font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer',
      checkboxSizes[size].text,
      error && 'text-destructive'
    )

    // Icon to display
    const displayIcon = indeterminate
      ? (customIndeterminateIcon ?? <IndeterminateIcon className={checkboxSizes[size].icon} />)
      : (customIcon ?? <CheckIcon className={checkboxSizes[size].icon} />)

    // Accessibility props
    const accessibilityProps = {
      'aria-describedby': cn(
        description && descriptionId,
        error && errorMessage && errorId
      ).trim() ?? undefined,
      'aria-invalid': error,
      'aria-checked': indeterminate ? ('mixed' as const) : isChecked
    }

    return (
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          {/* Checkbox container */}
          <div className="relative flex items-center">
            {/* Hidden input */}
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              className="sr-only"
              checked={isChecked}
              onChange={handleChange}
              disabled={disabled}
              data-tracking-id={trackingId}
              {...accessibilityProps}
              {...props}
            />

            {/* Visual checkbox */}
            <label
              htmlFor={checkboxId}
              className={checkboxClasses}
              data-state={dataState}
            >
              {/* Checkbox icon with animation */}
              {(isChecked || indeterminate) && (
                <motion.div
                  className="flex items-center justify-center text-current"
                  initial={disableAnimation ? undefined : { scale: 0 }}
                  animate={disableAnimation ? undefined : checkboxAnimations.checked}
                  exit={disableAnimation ? undefined : checkboxAnimations.unchecked}
                >
                  {displayIcon}
                </motion.div>
              )}
            </label>
          </div>

          {/* Label and description */}
          {(label || description) && (
            <div className="flex-1 space-y-1">
              {label && (
                <label
                  htmlFor={checkboxId}
                  className={labelClasses}
                >
                  {label}
                </label>
              )}

              {description && (
                <p
                  id={descriptionId}
                  className={cn(
                    "leading-relaxed",
                    checkboxSizes[size].text === 'text-xs' ? 'text-xs' : 'text-xs',
                    error ? 'text-destructive/70' : 'text-muted-foreground'
                  )}
                >
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && errorMessage && (
          <p id={errorId} className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

// Checkbox group component for managing multiple checkboxes
export interface CheckboxGroupProps {
  readonly value?: string[]
  readonly defaultValue?: string[]
  readonly onValueChange?: (value: string[]) => void
  readonly disabled?: boolean
  readonly orientation?: 'horizontal' | 'vertical'
  readonly children: React.ReactNode
  readonly className?: string
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  value,
  defaultValue = [],
  onValueChange,
  disabled = false,
  orientation = 'vertical',
  children,
  className
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const currentValue = value ?? internalValue

  const handleValueChange = useCallback((itemValue: string, checked: boolean) => {
    const newValue = checked
      ? [...currentValue, itemValue]
      : currentValue.filter(v => v !== itemValue)

    if (value === undefined) {
      setInternalValue(newValue)
    }

    onValueChange?.(newValue)
  }, [currentValue, value, onValueChange])

  return (
    <div
      className={cn(
        'space-y-2',
        orientation === 'horizontal' && 'flex flex-wrap gap-4 space-y-0',
        className
      )}
      role="group"
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === Checkbox) {
          const itemValue = child.props.value ?? String(index)
          const isChecked = currentValue.includes(itemValue)

          return React.cloneElement(child as React.ReactElement<CheckboxProps>, {
            checked: isChecked,
            disabled: disabled ?? child.props.disabled,
            onCheckedChange: (checked: boolean) => {
              child.props.onCheckedChange?.(checked)
              handleValueChange(itemValue, checked)
            }
          })
        }

        return child
      })}
    </div>
  )
}

CheckboxGroup.displayName = 'CheckboxGroup'
