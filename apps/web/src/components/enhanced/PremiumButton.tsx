import React, { useEffect } from 'react';
import { motion, useMotionValue, animate, type Variants, MotionView, usePressMotion } from '@petspark/motion';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import type { ButtonHTMLAttributes } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";
import { Button } from '@/components/ui/button';
import { getAriaButtonAttributes } from '@/lib/accessibility';

interface PremiumButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'default' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children: React.ReactNode;
}

/**
 * PremiumButton - Enhanced button with animations
 *
 * Composes the core Button component and adds:
 * - Hover lift animation
 * - Bounce on tap
 * - Loading spinner
 * - Icon support
 * - Gradient variant (optional)
 *
 * Maintains all core Button accessibility and styling standards.
 */
export function PremiumButton({
  variant = 'default',
  size = 'default',
  icon,
  iconPosition = 'left',
  loading = false,
  className,
  children,
  onClick,
  ...props
}: PremiumButtonProps) {
  const _uiConfig = useUIConfig();
  const pressMotion = usePressMotion({
    scaleOnPress: 0.95,
    scaleOnHover: 1.05,
  });
  const rotation = useMotionValue(0);

  useEffect(() => {
    if (loading) {
      animate(rotation, 360, {
        duration: 1,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      });
    } else {
      rotation.set(0);
    }
  }, [loading, rotation]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    haptics.impact('light');
    onClick?.(e);
  };

  // Map size prop to Button size prop
  const buttonSize: 'sm' | 'md' | 'lg' | 'icon' = size === 'default' ? 'md' : size;

  // Map variant - gradient uses default with gradient overlay
  const buttonVariant = variant === 'gradient' ? 'primary' : (variant === 'default' ? 'primary' : variant);

  const buttonAriaAttrs = getAriaButtonAttributes({
    label: props['aria-label'] ?? (typeof children === 'string' ? children : undefined),
    disabled: loading ?? props.disabled,
  });

  const loadingVariants: Variants = {
    spinning: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  // Wrap Button with motion effects
  return (
    <MotionView
      {...pressMotion.motionProps}
      className="inline-block"
    >
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleClick}
        disabled={loading ?? props.disabled}
        className={cn(
          'relative overflow-hidden',
          variant === 'gradient' && 'bg-linear-to-r from-primary via-secondary to-primary hover:from-primary/90 hover:via-secondary/90 hover:to-primary/90',
          className
        )}
        {...buttonAriaAttrs}
        {...props}
      >
        {loading ? (
          <motion.div
            variants={loadingVariants}
            animate="spinning"
            style={{ rotate: rotation }}
            className="h-5 w-5 rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && <span aria-hidden="true">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span aria-hidden="true">{icon}</span>}
          </>
        )}
      </Button>
    </MotionView>
  );
}
