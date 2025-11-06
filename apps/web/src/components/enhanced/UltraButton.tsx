/**
 * Ultra Enhanced Button
 * Button with magnetic hover, elastic scale, and ripple effects
 */

import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { MotionView } from '@petspark/motion';
import { useMagnetic, usePressBounce, useShimmer } from '@petspark/motion';
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
  const magnetic = useMagnetic(40);

  const elastic = usePressBounce(0.96);

  const shimmer = useShimmer(240);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      onPointerMove={enableMagnetic ? magnetic.onPointerMove : undefined}
      onPointerLeave={enableMagnetic ? magnetic.onPointerLeave : undefined}
      className="inline-block relative"
    >
      <MotionView animatedStyle={magnetic.animatedStyle}>
        <MotionView animatedStyle={elastic.animatedStyle}>
          <Button
            variant={variant}
            size={size}
            className={cn('relative overflow-hidden', className)}
            onClick={handleClick}
            {...props}
          >
            {enableGlow && (
              <MotionView animatedStyle={shimmer.animatedStyle}>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ backgroundColor: glowColor }}
                />
              </MotionView>
            )}
            <span className="relative z-10">{children}</span>
          </Button>
        </MotionView>
      </MotionView>
    </div>
  );
}
