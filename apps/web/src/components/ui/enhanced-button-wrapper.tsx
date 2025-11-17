'use client';

import type { ReactNode } from 'react';
import { MotionView } from '@petspark/motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';
import { EnhancedButtonContent } from './enhanced-button-content';
import type { AnimatedStyle as ViewAnimatedStyle } from '@/effects/reanimated/animated-view';

interface EnhancedButtonWrapperProps {
  pressMotionProps: Record<string, unknown>;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  buttonVariant: keyof typeof buttonVariants;
  size: 'default' | 'sm' | 'lg' | 'icon';
  handleClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isDisabled: boolean;
  enableGlow: boolean;
  className?: string;
  loading: boolean;
  children: ReactNode;
  glowOverlayStyle: ViewAnimatedStyle;
  loadingSpinnerStyle: ViewAnimatedStyle;
  icon?: ReactNode;
  iconPosition: 'left' | 'right';
  props: Record<string, unknown>;
}

export function EnhancedButtonWrapper({
  pressMotionProps,
  handleMouseEnter,
  handleMouseLeave,
  buttonVariant,
  size,
  handleClick,
  isDisabled,
  enableGlow,
  className,
  loading,
  children,
  glowOverlayStyle,
  loadingSpinnerStyle,
  icon,
  iconPosition,
  props,
}: EnhancedButtonWrapperProps): React.JSX.Element {
  return (
    <MotionView
      {...pressMotionProps}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Button
        variant={buttonVariant}
        size={size}
        onClick={handleClick}
        disabled={isDisabled}
        className={cn('relative overflow-hidden', enableGlow && 'shadow-lg', className)}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        <EnhancedButtonContent
          loading={loading}
          enableGlow={enableGlow}
          glowOverlayStyle={glowOverlayStyle}
          loadingSpinnerStyle={loadingSpinnerStyle}
          icon={icon}
          iconPosition={iconPosition}
        >
          {children}
        </EnhancedButtonContent>
      </Button>
    </MotionView>
  );
}

