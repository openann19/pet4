'use client';

import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { usePressMotion } from '@petspark/motion';
import { useGlowAnimation, useLoadingSpinner, useResolvedGlowColor } from './enhanced-button-hooks';
import { useEnhancedButtonHandlers } from './enhanced-button-handlers';
import { useEnhancedButtonProps } from './enhanced-button-props';
import { EnhancedButtonWrapper } from './enhanced-button-wrapper';

export interface EnhancedButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
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
  size = 'default',
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
    scaleOnPress: 0.96,
    scaleOnHover: 1.05,
    enableHover: enableHoverLift,
  });

  const resolvedGlowColor = useResolvedGlowColor(glowColor, variant);
  const { glowOverlayStyle, glowOpacity } = useGlowAnimation(enableGlow, resolvedGlowColor);
  const { loadingSpinnerStyle } = useLoadingSpinner(loading);
  const { handleClick, handleMouseEnter, handleMouseLeave } = useEnhancedButtonHandlers({
    disabled, loading, hapticFeedback, enableGlow, glowOpacity, onClick, variant, size,
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
