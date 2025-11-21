/**
 * Premium Button - KRASIVO Edition (Web)
 *
 * Showcases the complete motion system: press bounce, hover lift, magnetic
 * Feels more expensive than any competitor app
 *
 * Composes the core Button component and adds motion effects.
 */

import { MotionView, usePressBounce } from '@petspark/motion';
import { cn } from '@/lib/utils';
import { Button, type buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';

interface PremiumButtonProps {
  label: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  className?: string;
  onPress: () => void;
}

export function PremiumButton({
  label,
  variant = 'default',
  size = 'default',
  disabled = false,
  className = '',
  onPress,
}: PremiumButtonProps) {
  // Motion hooks - combine for premium feel
  const pressBounce = usePressBounce(0.94);

  // Use the animated style
  const combinedAnimatedStyle = pressBounce.animatedStyle;

  // Map size prop to Button size prop
  const buttonSize: 'sm' | 'md' | 'lg' | 'icon' = size === 'default' ? 'md' : size;

  // Map variant to Button variant
  const buttonVariant: VariantProps<typeof buttonVariants>['variant'] = variant;

  return (
    <div className="inline-block">
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
        <MotionView
          style={combinedAnimatedStyle}
          className="flex items-center justify-center"
        >
          {label}
        </MotionView>
      </Button>
    </div>
  );
}

PremiumButton.displayName = 'PremiumButton';
