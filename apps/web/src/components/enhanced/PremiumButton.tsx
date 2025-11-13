import React, { useEffect } from 'react';
import { motion, useMotionValue, animate, type Variants } from 'framer-motion';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import type { ButtonHTMLAttributes } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getAriaButtonAttributes } from '@/lib/accessibility';

interface PremiumButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children: React.ReactNode;
}

export function PremiumButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  className,
  children,
  onClick,
  ...props
}: PremiumButtonProps) {
  const _uiConfig = useUIConfig();
  const hoverLift = useHoverLift({ scale: 1.05 });
  const bounceOnTap = useBounceOnTap({ scale: 0.95, hapticFeedback: false });
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
    bounceOnTap.handlePress();
    onClick?.(e);
  };

  const variants = {
    primary:
      'bg-(--btn-primary-bg) text-(--btn-primary-fg) hover:bg-(--btn-primary-hover-bg) hover:text-(--btn-primary-hover-fg) active:bg-(--btn-primary-press-bg) active:text-(--btn-primary-press-fg) disabled:bg-(--btn-primary-disabled-bg) disabled:text-(--btn-primary-disabled-fg) focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-focus-ring)]',
    secondary:
      'bg-(--btn-secondary-bg) text-(--btn-secondary-fg) hover:bg-(--btn-secondary-hover-bg) hover:text-(--btn-secondary-hover-fg) active:bg-(--btn-secondary-press-bg) active:text-(--btn-secondary-press-fg) disabled:bg-(--btn-secondary-disabled-bg) disabled:text-(--btn-secondary-disabled-fg) focus-visible:ring-2 focus-visible:ring-[var(--btn-secondary-focus-ring)]',
    accent:
      'bg-(--btn-primary-bg) text-(--btn-primary-fg) hover:bg-(--btn-primary-hover-bg) hover:text-(--btn-primary-hover-fg) active:bg-(--btn-primary-press-bg) active:text-(--btn-primary-press-fg) disabled:bg-(--btn-primary-disabled-bg) disabled:text-(--btn-primary-disabled-fg) focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-focus-ring)]',
    ghost:
      'bg-(--btn-ghost-bg) text-(--btn-ghost-fg) hover:bg-(--btn-ghost-hover-bg) hover:text-(--btn-ghost-hover-fg) active:bg-(--btn-ghost-press-bg) active:text-(--btn-ghost-press-fg) disabled:bg-(--btn-ghost-disabled-bg) disabled:text-(--btn-ghost-disabled-fg) focus-visible:ring-2 focus-visible:ring-[var(--btn-ghost-focus-ring)]',
    gradient:
      'bg-gradient-to-r from-[var(--btn-primary-bg)] via-[var(--btn-secondary-bg)] to-[var(--btn-primary-bg)] text-(--btn-primary-fg) hover:from-[var(--btn-primary-hover-bg)] hover:via-[var(--btn-secondary-hover-bg)] hover:to-[var(--btn-primary-hover-bg)] active:from-[var(--btn-primary-press-bg)] active:via-[var(--btn-secondary-press-bg)] active:to-[var(--btn-primary-press-bg)] disabled:from-[var(--btn-primary-disabled-bg)] disabled:via-[var(--btn-secondary-disabled-bg)] disabled:to-[var(--btn-primary-disabled-bg)] disabled:text-(--btn-primary-disabled-fg) focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-focus-ring)]',
  };

  const sizes = {
    sm: cn(
      getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'sm' }),
      getTypographyClasses('button'),
      'min-h-11 min-w-11'
    ),
    md: cn(
      getSpacingClassesFromConfig({ paddingX: 'lg', paddingY: 'sm' }),
      getTypographyClasses('button'),
      'min-h-11 min-w-11'
    ),
    lg: cn(
      getSpacingClassesFromConfig({ paddingX: 'xl', paddingY: 'md' }),
      getTypographyClasses('button'),
      'min-h-11 min-w-11'
    ),
  };

  const buttonAriaAttrs = getAriaButtonAttributes({
    label: props['aria-label'] ?? (typeof children === 'string' ? children : undefined),
    disabled: loading ?? props.disabled,
  });

  const buttonVariants: Variants = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.05, y: -2 },
    tap: { scale: 0.95 },
  };

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

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={hoverLift.handleEnter}
      onMouseLeave={hoverLift.handleLeave}
      variants={buttonVariants}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="tap"
      className={cn(
        'relative overflow-hidden rounded-xl',
        'shadow-lg transition-all duration-300',
        'disabled:cursor-not-allowed',
        'flex items-center justify-center',
        getSpacingClassesFromConfig({ gap: 'sm' }),
        variants[variant],
        sizes[size],
        className
      )}
      disabled={loading}
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
    </motion.button>
  );
}
