/**
 * Premium Button - KRASIVO Edition (Web)
 * 
 * Showcases the complete motion system: press bounce, hover lift, magnetic
 * Feels more expensive than any competitor app
 */


import { MotionView, usePressBounce, useHoverLift, useMagnetic } from '@petspark/motion';

interface PremiumButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  magnetic?: boolean;
  disabled?: boolean;
  className?: string;
  onPress: () => void;
}

export function PremiumButton({ 
  label, 
  variant = 'primary', 
  size = 'md',
  magnetic = false,
  disabled = false,
  className = '',
  onPress,
}: PremiumButtonProps) {
  // Motion hooks - combine for premium feel
  const pressBounce = usePressBounce(0.94);
  const hoverLift = useHoverLift(size === 'lg' ? 8 : size === 'md' ? 6 : 4);
  const magneticEffect = useMagnetic(magnetic ? 80 : 0);

  // Combine all animated styles
  const combinedAnimatedStyles = [
    pressBounce.animatedStyle,
    hoverLift.animatedStyle,
    magnetic ? magneticEffect.animatedStyle : undefined,
  ].filter(Boolean);

  // Base classes for styling
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 border-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'bg-transparent border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  const allClasses = `${String(baseClasses ?? '')} ${String(sizeClasses[size] ?? '')} ${String(variantClasses[variant] ?? '')} ${String(disabledClasses ?? '')} ${String(className ?? '')}`;

  return (
    <button
      className={allClasses}
      onMouseDown={() => {
        if (!disabled) {
          pressBounce.onPressIn();
        }
      }}
      onMouseUp={() => {
        if (!disabled) {
          pressBounce.onPressOut();
          onPress();
        }
      }}
      onMouseEnter={hoverLift.onMouseEnter}
      onMouseLeave={hoverLift.onMouseLeave}
      onMouseMove={magnetic ? magneticEffect.onPointerMove : undefined}
      disabled={disabled}
      type="button"
    >
      <MotionView 
        animatedStyle={combinedAnimatedStyles}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {label}
      </MotionView>
    </button>
  );
}

PremiumButton.displayName = 'PremiumButton';