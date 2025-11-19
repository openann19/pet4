/**
 * Advanced Button Component
 * Production-ready button with accessibility, animations, and design system integration
 */

import * as React from 'react'

const { forwardRef, useCallback, useMemo } = React
import { motion, type HTMLMotionProps } from '@petspark/motion'
import { cn } from '@/lib/utils'
// import { useTheme } from '@/hooks/use-theme' // TODO: Implement when hooks are ready
import { createLogger } from '@/lib/logger'

const logger = createLogger('Button')

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  // Visual variants
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link' | 'default'
  readonly size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'default'
  
  // States
  readonly loading?: boolean
  readonly disabled?: boolean
  
  // Content
  readonly children?: React.ReactNode
  readonly leftIcon?: React.ReactNode
  readonly rightIcon?: React.ReactNode
  readonly loadingIcon?: React.ReactNode
  
  // Accessibility
  readonly ariaLabel?: string
  readonly ariaDescribedBy?: string
  readonly role?: string
  
  // Animation
  readonly disableAnimation?: boolean
  readonly animationDuration?: number
  
  // Layout
  readonly fullWidth?: boolean
  readonly isIconOnly?: boolean
  readonly asChild?: boolean
  
  // Advanced features
  readonly tooltip?: string
  readonly trackingId?: string
  readonly confirmAction?: boolean
  readonly confirmMessage?: string
}

// Button variant styles using design tokens
export const buttonVariants = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:ring-primary/70',
  primary: 'bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:ring-primary/70',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 focus-visible:ring-secondary/70',
  outline: 'border-2 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent/70',
  ghost: 'hover:bg-accent/10 hover:text-accent-foreground focus-visible:ring-accent/70',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/70',
  link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-primary/70'
} as const

const buttonSizes = {
  icon: 'h-11 w-11 p-0', // 44px minimum for accessibility (WCAG 2.1 Level AAA)
  default: 'h-11 px-4 text-sm', // Updated to 44px for better touch targets
  xs: 'h-7 px-2 text-xs',
  sm: 'h-9 px-3 text-sm', // 36px
  md: 'h-11 px-4 text-sm', // 44px (default)
  lg: 'h-12 px-6 text-base', // 48px
  xl: 'h-14 px-8 text-base' // 56px
} as const

const iconSizes = {
  icon: 'h-4 w-4',
  default: 'h-4 w-4',
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-4 w-4',
  xl: 'h-5 w-5'
} as const

// Animation variants
const buttonAnimations = {
  tap: { scale: 0.98 },
  hover: { scale: 1.02 },
  loading: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: 'linear' }
  }
} as const

// Default loading spinner
const LoadingSpinner: React.FC<{ size: keyof typeof iconSizes }> = ({ size }) => (
  <motion.div
    className={cn("animate-spin", iconSizes[size])}
    variants={buttonAnimations}
    animate="loading"
  >
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
  </motion.div>
)

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
    children,
    leftIcon,
    rightIcon,
    loadingIcon,
    ariaLabel,
    ariaDescribedBy,
    role,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    disableAnimation = false,
    animationDuration = 0.2,
    fullWidth = false,
    isIconOnly = false,
    tooltip,
    trackingId,
    confirmAction = false,
    confirmMessage = 'Are you sure?',
    className,
    onClick,
    ...props
  }: ButtonProps, ref: React.Ref<HTMLButtonElement>) => {
    // const theme = useTheme() // TODO: Use when theme hook is available
    
    // Handle click with optional confirmation and tracking
    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        event.preventDefault()
        return
      }
      
      // Analytics tracking
      if (trackingId) {
        logger.info('Button clicked', { trackingId, variant, size })
        // In real app, send to analytics service
      }
      
      // Confirmation dialog
      if (confirmAction) {
        const confirmed = window.confirm(confirmMessage)
        if (!confirmed) {
          event.preventDefault()
          return
        }
      }
      
      onClick?.(event)
    }, [loading, disabled, trackingId, variant, size, confirmAction, confirmMessage, onClick])
    
    // Compute button classes
    const buttonClasses = useMemo(() => cn(
      // Base styles
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'active:scale-[0.98] active:transition-transform active:duration-75',
      
      // Disabled state - use color instead of opacity for better contrast
      'disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none',
      
      // Variant styles (only applied when not disabled)
      !(loading || disabled) && buttonVariants[variant],
      
      // Size styles
      buttonSizes[size],
      
      // Layout modifiers
      fullWidth && 'w-full',
      isIconOnly && 'aspect-square p-0',
      
      // State modifiers
      (loading || disabled) && 'cursor-not-allowed',
      
      // Custom classes
      className
    ), [variant, size, fullWidth, isIconOnly, loading, disabled, className])
    
    // Icon rendering
    const renderIcon = useCallback((icon: React.ReactNode, position: 'left' | 'right') => {
      if (!icon) return null
      
      return (
        <span className={cn(
          iconSizes[size],
          'shrink-0',
          position === 'left' && children && 'mr-1',
          position === 'right' && children && 'ml-1'
        )}>
          {icon}
        </span>
      )
    }, [size, children])
    
    // Loading state content
    const loadingContent = loadingIcon ?? <LoadingSpinner size={size} />
    
    // Button content
    const buttonContent = (
      <>
        {loading ? (
          <>
            {renderIcon(loadingContent, 'left')}
            {!isIconOnly && (
              <span className="opacity-0" aria-hidden="true">
                {children}
              </span>
            )}
          </>
        ) : (
          <>
            {renderIcon(leftIcon, 'left')}
            {!isIconOnly && <span>{children}</span>}
            {renderIcon(rightIcon, 'right')}
          </>
        )}
      </>
    )
    
    // Motion props for animation
    const motionProps: Partial<HTMLMotionProps<'button'>> = disableAnimation ? {} : {
      whileTap: buttonAnimations.tap,
      whileHover: loading || disabled ? undefined : buttonAnimations.hover,
      transition: { duration: animationDuration }
    }
    
    // Accessibility props
    const accessibilityProps = {
      'aria-label': ariaLabel || (isIconOnly && typeof children === 'string' ? children : undefined),
      'aria-describedby': ariaDescribedBy,
      'aria-disabled': loading || disabled,
      'aria-busy': loading,
      role
    }
    
    // Use motion.button only when animations are enabled to avoid prop conflicts
    if (disableAnimation) {
      return (
        <button
          ref={ref}
          className={buttonClasses}
          disabled={loading || disabled}
          onClick={(e) => void handleClick(e)}
          title={tooltip}
          data-tracking-id={trackingId}
          {...accessibilityProps}
          {...props}
        >
          {buttonContent}
        </button>
      )
    }
    
    const MotionButton = motion.button
    
    return (
      <MotionButton
        ref={ref}
        className={buttonClasses}
        disabled={loading || disabled}
        onClick={(e) => void handleClick(e)}
        title={tooltip}
        data-tracking-id={trackingId}
        {...accessibilityProps}
        {...motionProps}
      >
        {buttonContent}
      </MotionButton>
    )
  }
)

Button.displayName = 'Button'

// Compound components for common patterns
export const ButtonGroup: React.FC<{
  readonly children: React.ReactNode
  readonly orientation?: 'horizontal' | 'vertical'
  readonly className?: string
}> = ({ children, orientation = 'horizontal', className }) => (
  <div
    className={cn(
      'inline-flex',
      orientation === 'horizontal' ? 'flex-row' : 'flex-col',
      '[&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md',
      orientation === 'vertical' && '[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-l-none [&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-r-none',
      '[&>button:not(:first-child)]:border-l-0',
      orientation === 'vertical' && '[&>button:not(:first-child)]:border-l [&>button:not(:first-child)]:border-t-0',
      className
    )}
    role="group"
  >
    {children}
  </div>
)

ButtonGroup.displayName = 'ButtonGroup'

// Loading button preset
export const LoadingButton: React.FC<ButtonProps & { isLoading?: boolean }> = ({ 
  isLoading, 
  children, 
  disabled,
  ...props 
}) => (
  <Button
    {...props}
    loading={isLoading}
    disabled={disabled ?? isLoading}
  >
    {children}
  </Button>
)

LoadingButton.displayName = 'LoadingButton'

// Icon button preset
export const IconButton: React.FC<ButtonProps & { icon: React.ReactNode }> = ({ 
  icon, 
  children,
  ...props 
}) => (
  <Button
    {...props}
    isIconOnly={!children}
    leftIcon={icon}
  >
    {children}
  </Button>
)

IconButton.displayName = 'IconButton'