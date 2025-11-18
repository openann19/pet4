'use client';

import { MotionView } from "@petspark/motion";
import { useCallback } from 'react';
import { useRippleEffect } from '@/effects/reanimated/use-ripple-effect';
import { cn } from '@/lib/utils';
import type { ReactNode, HTMLAttributes } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface RippleEffectProps extends HTMLAttributes<HTMLDivElement> {
  color?: string;
  opacity?: number;
  duration?: number;
  disabled?: boolean;
  children?: ReactNode;
}

export function RippleEffect({
  color = 'rgba(255, 255, 255, 0.5)',
  opacity = 0.5,
  duration = 600,
  disabled = false,
  children,
  className,
  onClick,
  ...props
}: RippleEffectProps) {
    const _uiConfig = useUIConfig();
    const ripple = useRippleEffect({ color, opacity, duration });

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!disabled) {
        ripple.addRipple(e);
        onClick?.(e);
      }
    },
    [disabled, ripple, onClick]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        // Create a synthetic mouse event for ripple effect
        const syntheticEvent = {
          ...e,
          currentTarget: e.currentTarget,
          clientX: e.currentTarget.getBoundingClientRect().left + e.currentTarget.offsetWidth / 2,
          clientY: e.currentTarget.getBoundingClientRect().top + e.currentTarget.offsetHeight / 2,
        } as unknown as React.MouseEvent<HTMLDivElement>;
        handleClick(syntheticEvent);
      }
    },
    [disabled, handleClick]
  );

  const hasClickHandler = onClick !== undefined;
  const role = hasClickHandler ? 'button' : undefined;
  const tabIndex = hasClickHandler && !disabled ? 0 : undefined;

  return (
    <div
      onClick={(e) => void handleClick(e)}
      onKeyDown={handleKeyDown}
      role={role}
      tabIndex={tabIndex}
      className={cn(
        'relative overflow-hidden',
        hasClickHandler && !disabled && 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className
      )}
      {...props}
    >
      {children}
      {ripple.ripples.map((rippleState) => (
        <MotionView
          key={rippleState.id}
          style={{
            ...ripple.animatedStyle,
            position: 'absolute',
            left: rippleState.x,
            top: rippleState.y,
            width: 20,
            height: 20,
            backgroundColor: ripple.color,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
          }}
        />
      ))}
    </div>
  );
}
