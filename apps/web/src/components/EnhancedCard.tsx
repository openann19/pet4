// apps/web/src/components/EnhancedCard.tsx
import React from 'react';
import type { ReactNode } from 'react';
import { MotionView } from '@petspark/motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { isTruthy } from '@petspark/shared';

interface EnhancedCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'elevated' | 'gradient';
  hover?: boolean;
  glow?: boolean;
}

export default function EnhancedCard({
  children,
  className,
  variant = 'default',
  hover = true,
  glow = false,
}: EnhancedCardProps) {
  const variantStyles: Record<NonNullable<EnhancedCardProps['variant']>, string> = {
    default: 'bg-card',
    glass: 'glass-effect',
    elevated: 'card-elevated bg-card',
    gradient: 'gradient-card',
  };

  const motionProps = React.useMemo(() => {
    const base = {
      initial: { opacity: 0, y: 16, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    };

    if (!isTruthy(hover)) {
      // No hover interaction – just entry animation
      return base;
    }

    return {
      ...base,
      whileHover: {
        y: -4,
        scale: 1.02,
        boxShadow: '0 26px 60px rgba(15,23,42,0.45)',
      },
      whileTap: { scale: 0.97 },
    };
  }, [hover]);

  return (
    <MotionView {...motionProps}>
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          variantStyles[variant],
          glow && 'glow-primary',
          className
        )}
      >
        {variant === 'gradient' && (
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent" />
        )}
        <div className="relative z-10">{children}</div>
      </Card>
    </MotionView>
  );
}
