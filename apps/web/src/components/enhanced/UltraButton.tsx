import { MotionView } from "@petspark/motion";
/**
 * Ultra Enhanced Button
 * Button with magnetic hover, elastic scale, and ripple effects
 */

import React, { type ReactNode, type ButtonHTMLAttributes, useCallback } from 'react';
import { motion, useMotionValue, animate, type Variants } from '@petspark/motion';
import { useMagneticEffect } from '@/effects/reanimated/use-magnetic-effect';
import { useShimmer } from '@/effects/reanimated/use-shimmer';
import { springConfigs } from '@/effects/reanimated/transitions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { useUIConfig } from "@/hooks/use-ui-config";
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

const logger = createLogger('UltraButton');

export interface UltraButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  enableMagnetic?: boolean;
  enableElastic?: boolean;
  enableRipple?: boolean;
  enableGlow?: boolean;
  glowColor?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

function usePressBounce(scaleOnPress = 0.96, enabled = true) {
  const scale = useMotionValue(1)

  const onPressIn = useCallback(() => {
    if (!enabled) return;
    animate(scale, scaleOnPress, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    })
  }, [scale, scaleOnPress, enabled])

  const onPressOut = useCallback(() => {
    if (!enabled) return;
    animate(scale, 1, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    })
  }, [scale, enabled])

  const variants: Variants = enabled ? {
    rest: {
      scale: 1,
    },
    pressed: {
      scale: scaleOnPress,
      transition: {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      },
    },
  } : {
    rest: { scale: 1 },
    pressed: { scale: 1, transition: { duration: 0 } },
  }

  return { onPressIn, onPressOut, scale, variants }
}

export function UltraButton({
  children,
  enableMagnetic = true,
  enableElastic = true,
  enableRipple: _enableRipple = true,
  enableGlow = false,
  glowColor = 'rgba(99, 102, 241, 0.5)',
  variant = 'default',
  size = 'default',
  className,
  onClick,
  ...props
}: UltraButtonProps) {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();
  const magnetic = useMagneticEffect({
    strength: 0.4,
    enabled: enableMagnetic && !prefersReducedMotion,
  });

  const elastic = usePressBounce(0.96, enableElastic && !prefersReducedMotion);

  const shimmer = useShimmer({
    duration: 240,
    enabled: enableGlow && !prefersReducedMotion
  });

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (props.disabled) return;

      try {
        onClick?.(e);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('UltraButton onClick error', err);
      }
    },
    [onClick, props.disabled]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (enableMagnetic && magnetic.handleMove) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      magnetic.handleMove(x, y);
    }
  }, [enableMagnetic, magnetic]);

  return (
    <div
      onPointerMove={enableMagnetic ? handlePointerMove : undefined}
      onPointerLeave={enableMagnetic ? magnetic.handleLeave : undefined}
      className="inline-block relative"
    >
      <motion.div
        variants={magnetic.variants}
        initial="rest"
        animate="rest"
        style={{
          x: magnetic.translateX,
          y: magnetic.translateY,
        }}
      >
        <motion.div
          variants={elastic.variants}
          initial="rest"
          animate="rest"
          onMouseDown={elastic.onPressIn}
          onMouseUp={elastic.onPressOut}
          onMouseLeave={elastic.onPressOut}
          style={{ scale: elastic.scale }}
        >
          <Button
            variant={variant}
            size={size}
            className={cn('relative overflow-hidden', className)}
            onClick={() => void handleClick()}
            {...props}
          >
            {enableGlow && (
              <motion.div
                variants={shimmer.variants}
                animate="shimmer"
                style={shimmer.variants ? undefined : { x: shimmer.translateX }}
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
              >
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: glowColor }}
                />
              </motion.div>
            )}
            <span className="relative z-10">{children}</span>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
