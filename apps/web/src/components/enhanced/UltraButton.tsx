/**
 * Ultra Enhanced Button
 * Button with magnetic hover, elastic scale, and ripple effects
 */

import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import {
  useMagneticHover,
  useElasticScale,
  useRippleEffect,
  useGlowBorder,
} from '@/effects/reanimated';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export function UltraButton({
  children,
  enableMagnetic = true,
  enableElastic = true,
  enableRipple = true,
  enableGlow = false,
  glowColor = 'rgba(99, 102, 241, 0.5)',
  variant = 'default',
  size = 'default',
  className,
  onClick,
  ...props
}: UltraButtonProps) {
  const magnetic = useMagneticHover({
    strength: 0.3,
    maxDistance: 40,
    enabled: enableMagnetic,
  });

  const elastic = useElasticScale({
    scaleDown: 0.96,
    scaleUp: 1.04,
  });

  const ripple = useRippleEffect({
    color: glowColor,
    opacity: 0.4,
  });

  const glow = useGlowBorder({
    enabled: enableGlow,
    color: glowColor,
    intensity: 12,
    speed: 2000,
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (enableRipple) {
      ripple.addRipple(e);
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      ref={magnetic.handleRef}
      onMouseEnter={magnetic.handleMouseEnter}
      onMouseLeave={magnetic.handleMouseLeave}
      onMouseMove={magnetic.handleMouseMove}
      className="inline-block relative"
    >
      <AnimatedView style={magnetic.animatedStyle}>
        <div
          onMouseDown={elastic.handlePressIn}
          onMouseUp={elastic.handlePressOut}
          onMouseLeave={elastic.handlePressOut}
        >
          <AnimatedView style={elastic.animatedStyle}>
            <Button
              variant={variant}
              size={size}
              className={cn('relative overflow-hidden', className)}
              onClick={handleClick}
              {...props}
            >
              {enableGlow && (
                <AnimatedView style={glow.animatedStyle}>
                  <div className="absolute inset-0 pointer-events-none" />
                </AnimatedView>
              )}
              <span className="relative z-10">{children}</span>
              {ripple.ripples.map((r) => (
                <AnimatedView
                  key={r.id}
                  style={ripple.animatedStyle}
                  className="absolute rounded-full pointer-events-none"
                />
              ))}
            </Button>
          </AnimatedView>
        </div>
      </AnimatedView>
    </div>
  );
}
