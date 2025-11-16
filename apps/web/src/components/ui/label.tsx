/**
 * Advanced Label Component
 * Production-ready label with accessibility and design system integration
 */

import * as React from 'react'

const { forwardRef } = React
import { cn } from '@/lib/utils'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  // Visual variants
  readonly variant?: 'default' | 'destructive' | 'muted' | 'success'
  readonly size?: 'sm' | 'md' | 'lg'
  
  // States
  readonly required?: boolean
  readonly disabled?: boolean
  readonly optional?: boolean
  
  // Content
  readonly children: React.ReactNode
  readonly description?: string
  readonly tooltip?: string
  
  // Advanced features
  readonly asChild?: boolean
  readonly unstyled?: boolean
}

// Label variant styles
const labelVariants = {
  default: 'text-foreground',
  destructive: 'text-destructive',
  muted: 'text-muted-foreground',
  success: 'text-green-600'
} as const

const labelSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
} as const

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({
    variant = 'default',
    size = 'md',
    required = false,
    disabled = false,
    optional = false,
    children,
    description,
    tooltip,
    asChild = false,
    unstyled = false,
    className,
    ...props
  }, ref) => {
    // Base label classes
    const labelClasses = cn(
      !unstyled && [
        // Base styles
        'font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        'transition-colors',
        
        // Variant styles
        labelVariants[variant],
        
        // Size styles
        labelSizes[size],
        
        // State styles
        disabled && 'cursor-not-allowed opacity-70'
      ],
      className
    )
    
    const labelContent = (
      <>
        <span>{children}</span>
        {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
        {!required && optional && <span className="text-muted-foreground ml-1 font-normal">(optional)</span>}
      </>
    )
    
    if (asChild) {
      // Return just the content if asChild is true
      return <>{labelContent}</>
    }
    
    return (
      <div className="space-y-1">
        <label
          ref={ref}
          className={labelClasses}
          title={tooltip}
          {...props}
        >
          {labelContent}
        </label>
        
        {description && (
          <p className={cn(
            "font-normal leading-snug",
            labelSizes[size === 'lg' ? 'md' : 'sm'],
            variant === 'destructive' ? 'text-destructive/70' : 'text-muted-foreground'
          )}>
            {description}
          </p>
        )}
      </div>
    )
  }
)

Label.displayName = 'Label'

// Field wrapper component that combines label with form controls
export interface FieldProps {
  readonly label?: string
  readonly description?: string
  readonly required?: boolean
  readonly optional?: boolean
  readonly error?: string
  readonly success?: string
  readonly disabled?: boolean
  readonly children: React.ReactNode
  readonly className?: string
  readonly labelProps?: Omit<LabelProps, 'children'>
}

export const Field: React.FC<FieldProps> = ({
  label,
  description,
  required = false,
  optional = false,
  error,
  success,
  disabled = false,
  children,
  className,
  labelProps = {}
}) => {
  const variant = error ? 'destructive' : success ? 'success' : 'default'
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label
          variant={variant}
          required={required}
          optional={optional}
          disabled={disabled}
          description={description}
          {...labelProps}
        >
          {label}
        </Label>
      )}
      
      {children}
      
      {/* Error/Success message */}
      {(error ?? success) && (
        <p className={cn(
          "text-sm",
          error && "text-destructive",
          success && "text-green-600"
        )}>
          {error ?? success}
        </p>
      )}
    </div>
  )
}

Field.displayName = 'Field'