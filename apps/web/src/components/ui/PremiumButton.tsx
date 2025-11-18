/**
 * Premium Button - KRASIVO Edition (Web)
 *
 * Showcases the complete motion system: press bounce, hover lift, magnetic
 * Feels more expensive than any competitor app
 * 
 * Composes the core Button component and adds motion effects.
 */

import { motion } from 'framer-motion';
import { MotionView, usePressBounce, useMagnetic } from '@petspark/motion';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';                                                                       
import { cn } from '@/lib/utils';
import type { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';

interface PremiumButtonProps {
  label: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  magnetic?: boolean;
  disabled?: boolean;
  className?: string;
  onPress: () => void;
}

export function PremiumButton({
  label,
  variant = 'default',
  size = 'default',
  magnetic = false,
  disabled = false,
  className = '',
  onPress,
}: PremiumButtonProps) {
  // Motion hooks - combine for premium feel
  const pressBounce = usePressBounce(0.94);
  const hoverLift = useHoverLift({ translateY: size === 'lg' ? -8 : size === 'sm' ? -4 : -6 });
  const magneticEffect = useMagnetic(magnetic ? 80 : 0);

  // Combine all animated styles
  const combinedAnimatedStyles = [
    pressBounce.animatedStyle,
    hoverLift.animatedStyle,
    magnetic ? magneticEffect.animatedStyle : undefined,
  ].filter(Boolean);

  // Map size prop to Button size prop
  const buttonSize: 'sm' | 'default' | 'lg' | 'icon' = size;

  // Map variant to Button variant
  const buttonVariant: keyof typeof buttonVariants = variant;

  return (
    <div
      onMouseEnter={hoverLift.onMouseEnter}
      onMouseLeave={hoverLift.onMouseLeave}
      onPointerMove={magnetic ? magneticEffect.onPointerMove : undefined}
      className="inline-block"
    >
      <Button
        variant={buttonVariant}
        size={buttonSize}
        disabled={disabled}
        onClick={onPress}
        onMouseDown={() => {
          if (!disabled) {
            pressBounce.onPressIn();
          }
        }}
        onMouseUp={() => {
          if (!disabled) {
            pressBounce.onPressOut();
          }
        }}
        className={cn(
          'relative overflow-hidden',
          variant === 'default' && 'shadow-[0_12px_30px_rgba(255,113,91,0.25)]',
          variant === 'secondary' && 'shadow-[0_10px_25px_rgba(255,184,77,0.25)]',
          className
        )}
      >
        <motion.div
          style={{
            scale: pressBounce.scale as any,
            y: hoverLift.translateY as any,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {label}
        </motion.div>
      </Button>
    </div>
  );
}

PremiumButton.displayName = 'PremiumButton';
