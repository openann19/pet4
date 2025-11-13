'use client';

import React, { useCallback, useRef, useEffect, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { motion, useMotionValue, animate, type Variants } from 'framer-motion';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { useRippleEffect } from '@/effects/reanimated/use-ripple-effect';
import { useMagneticHover } from '@/effects/reanimated/use-magnetic-hover';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { Dimens } from '@/core/tokens/dimens';
import { useUIConfig } from "@/hooks/use-ui-config";
import { ensureFocusAppearance } from '@/core/a11y/focus-appearance';
import { useTargetSize } from '@/hooks/use-target-size';
import { getAriaButtonAttributes } from '@/lib/accessibility';

const logger = createLogger('IconButton');

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'ghost' | 'outline' | 'glass';
  enableRipple?: boolean;
  enableMagnetic?: boolean;
  enableGlow?: boolean;
  'aria-label': string;
}

const SIZE_CONFIG = {
  sm: {
    size: 32,
    iconSize: 16,
    padding: 8,
  },
  md: {
    size: 44,
    iconSize: 20,
    padding: 12,
  },
  lg: {
    size: 56,
    iconSize: 24,
    padding: 16,
  },
} as const;

export function IconButton({
  icon,
  size = 'md',
  variant = 'primary',
  enableRipple = true,
  enableMagnetic = true,
  enableGlow = false,
  className,
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  ...props
}: IconButtonProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  // Target size validation - ensures 44x44px minimum touch target (already enforced by SIZE_CONFIG)
  const { ensure: ensureTargetSize } = useTargetSize({ enabled: !disabled, autoFix: true });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const glowOpacity = useMotionValue(0);
  const activeScale = useMotionValue(1);

  const hoverLift = useHoverLift({
    scale: 1.1,
    translateY: -2,
    damping: 25,
    stiffness: 400,
  });

  const magnetic = useMagneticHover({
    strength: 0.2,
    maxDistance: 8,
    enabled: enableMagnetic && !disabled,
  });

  const ripple = useRippleEffect({
    duration: 600,
    color: variant === 'primary' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.1)',
    opacity: 0.5,
  });

  const glowVariants: Variants = {
    off: {
      opacity: 0,
      boxShadow: `0 0 ${Dimens.glowSpread * 2}px rgba(59, 130, 246, 0)`,
    },
    on: {
      opacity: 1,
      boxShadow: `0 0 ${Dimens.glowSpread * 2}px rgba(59, 130, 246, 0.6)`,
      transition: {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      },
    },
  };

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    hoverLift.handleEnter();
    magnetic.handleMouseEnter();
    if (enableGlow) {
      animate(glowOpacity, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }
  }, [disabled, hoverLift, magnetic, enableGlow, glowOpacity]);

  const handleMouseLeave = useCallback(() => {
    hoverLift.handleLeave();
    magnetic.handleMouseLeave();
    if (enableGlow) {
      animate(glowOpacity, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }
  }, [hoverLift, magnetic, enableGlow, glowOpacity]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;

      try {
        if (enableRipple) {
          ripple.addRipple(e);
        }

        haptics.impact('light');

        animate(activeScale, 0.9, {
          duration: 0.1,
          ease: 'easeOut',
        }).then(() => {
          animate(activeScale, 1, {
            duration: 0.2,
            ease: 'easeIn',
          });
        });

        onClick?.(e);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('IconButton onClick error', err);
      }
    },
    [disabled, enableRipple, ripple, onClick, activeScale]
  );


  // Ensure focus appearance and target size meet WCAG 2.2 AAA requirements
  useEffect(() => {
    if (buttonRef.current && !disabled) {
      ensureFocusAppearance(buttonRef.current);
      ensureTargetSize(buttonRef.current);
    }
  }, [disabled, ensureTargetSize]);

  const config = SIZE_CONFIG[size];
  const variantStyles = {
    primary:
      'bg-(--btn-primary-bg) text-(--btn-primary-fg) hover:bg-(--btn-primary-hover-bg) active:bg-(--btn-primary-press-bg)',
    ghost:
      'bg-transparent text-(--btn-ghost-fg) hover:bg-(--btn-ghost-hover-bg) active:bg-(--btn-ghost-press-bg)',
    outline:
      'bg-transparent border-2 border-(--btn-primary-bg) text-(--btn-primary-bg) hover:bg-(--btn-primary-bg) hover:text-(--btn-primary-fg)',
    glass: 'glass-card text-(--btn-primary-fg) hover:bg-(--btn-primary-hover-bg)',
  };

  const iconButtonAria = getAriaButtonAttributes({
    label: ariaLabel,
    disabled,
  });

  return (
    <div
      ref={magnetic.handleRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={magnetic.handleMouseMove}
      className="inline-block relative"
    >
      <motion.div
        style={magnetic.variants ? undefined : { x: magnetic.translateX, y: magnetic.translateY }}
        variants={magnetic.variants}
        initial="rest"
        animate="rest"
        whileHover="hover"
      >
        <motion.div
          variants={hoverLift.variants}
          initial="rest"
          animate="rest"
          whileHover="hover"
          style={{ scale: hoverLift.scale, y: hoverLift.translateY }}
        >
          <motion.div
            style={{ scale: activeScale }}
          >
            <button
              ref={buttonRef}
              onClick={handleClick}
              disabled={disabled}
              className={cn(
                'relative overflow-hidden rounded-xl',
                'transition-all duration-300',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'flex items-center justify-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-ring',
                variantStyles[variant],
                className
              )}
              style={
                {
                  width: config.size,
                  height: config.size,
                  minWidth: config.size,
                  minHeight: config.size,
                  ...props.style!,
                  '--tw-ring-color': 'var(--btn-primary-focus-ring)',
                } as React.CSSProperties
              }
              {...iconButtonAria}
              {...props}
            >
              {enableGlow && (
                <motion.div
                  variants={glowVariants}
                  animate={glowOpacity.get() > 0 ? 'on' : 'off'}
                  style={{ opacity: glowOpacity }}
                  className="absolute inset-0 pointer-events-none rounded-xl"
                />
              )}
              <span
                className="relative z-10 flex items-center justify-center"
                style={{
                  width: config.iconSize,
                  height: config.iconSize,
                }}
                aria-hidden="true"
              >
                {icon}
              </span>
              {enableRipple &&
                ripple.ripples.map((r) => (
                  <motion.div
                    key={r.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: r.x,
                      top: r.y,
                      width: config.size,
                      height: config.size,
                      backgroundColor: ripple.color,
                      ...ripple.animatedStyle,
                    }}
                  />
                ))}
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
