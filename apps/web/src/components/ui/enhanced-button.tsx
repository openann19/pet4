'use client';

import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { usePressMotion } from '@petspark/motion';
import { motionTheme } from '@/config/motionTheme';
import { useGlowAnimation, useLoadingSpinner, useResolvedGlowColor } from './enhanced-button-hooks';
import { useEnhancedButtonHandlers } from './enhanced-button-handlers';
import { useEnhancedButtonProps } from './enhanced-button-props';
import { EnhancedButtonWrapper } from './enhanced-button-wrapper';

import type { VariantProps } from 'class-variance-authority';
import type { buttonVariants } from '@/components/ui/button';

export interface EnhancedButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: VariantProps<typeof buttonVariants>['size'];
  enableHoverLift?: boolean;
  enableGlow?: boolean;
  glowColor?: string;
  loading?: boolean;
  hapticFeedback?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export function EnhancedButton({
  children,
  variant = 'default',
  size = 'md',
  enableHoverLift = true,
  enableGlow = false,
  glowColor,
  loading = false,
  hapticFeedback = true,
  icon,
  iconPosition = 'left',
  className,
  onClick,
  disabled,
  ...props
}: EnhancedButtonProps): React.JSX.Element {
  const pressMotion = usePressMotion({
    scaleOnPress: motionTheme.scale.press,
    scaleOnHover: motionTheme.scale.hover,
    enableHover: enableHoverLift,
  });

  const resolvedGlowColor = useResolvedGlowColor(glowColor, variant);
  const { glowOverlayStyle, glowOpacity } = useGlowAnimation(enableGlow, resolvedGlowColor);
  const { loadingSpinnerStyle } = useLoadingSpinner(loading);
  const { handleClick, handleMouseEnter, handleMouseLeave } = useEnhancedButtonHandlers({
    disabled, loading, hapticFeedback, enableGlow, glowOpacity, onClick, variant, size: size ?? 'md',
  });
  const { buttonVariant, isDisabled } = useEnhancedButtonProps(variant, disabled, loading);

  return (
    <EnhancedButtonWrapper
      pressMotionProps={pressMotion.motionProps as Record<string, unknown>}
      handleMouseEnter={handleMouseEnter}
      handleMouseLeave={handleMouseLeave}
      buttonVariant={buttonVariant}
      size={size}
      handleClick={handleClick}
      isDisabled={isDisabled}
      enableGlow={enableGlow}
      className={className}
      loading={loading}
      glowOverlayStyle={glowOverlayStyle}
      loadingSpinnerStyle={loadingSpinnerStyle}
      icon={icon}
      iconPosition={iconPosition}
      props={props}
    >
      {children}
    </EnhancedButtonWrapper>
  );
}
