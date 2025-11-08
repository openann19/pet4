import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MotionView } from '@petspark/motion';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import React from 'react';
import type { ReactNode } from 'react';

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
  const opacity = useSharedValue(0);
  const y = useSharedValue(20);
  const hoverY = useSharedValue(0);

  // Entry animation
  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    y.value = withTiming(0, { duration: 500 });
  }, []);

  // Hover animation
  const handleMouseEnter = React.useCallback(() => {
    if (hover) {
      hoverY.value = withTiming(-4, { duration: 200 });
    }
  }, [hover]);

  const handleMouseLeave = React.useCallback(() => {
    if (hover) {
      hoverY.value = withTiming(0, { duration: 200 });
    }
  }, [hover]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value + hoverY.value }],
  }));

  const variantStyles = {
    default: 'bg-card',
    glass: 'glass-effect',
    elevated: 'card-elevated bg-card',
    gradient: 'gradient-card',
  };

  return (
    <MotionView
      animatedStyle={animatedStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          variantStyles[variant],
          glow && 'glow-primary',
          className
        )}
      >
        {variant === 'gradient' && (
          <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        )}
        <div className="relative z-10">{children}</div>
      </Card>
    </MotionView>
  );
}
