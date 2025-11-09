import { useEffect } from 'react';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { MotionView } from '@petspark/motion';
import { useHoverLift } from '@petspark/motion';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";

interface PremiumCardProps {
  variant?: 'default' | 'glass' | 'elevated' | 'gradient';
  hover?: boolean;
  glow?: boolean;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

export function PremiumCard({
  variant = 'default',
  hover = true,
  glow = false,
  className,
  children,
  style,
  ...props
}: PremiumCardProps) {
    const uiConfig = useUIConfig();
    const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const hoverLift = useHoverLift(8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 220 });
    translateY.value = withTiming(0, { duration: 220 });
  }, [opacity, translateY]);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const combinedStyle =
    hover && hoverLift.animatedStyle ? [entryStyle, hoverLift.animatedStyle] : entryStyle;

  const variants = {
    default: 'bg-card border border-border',
    glass: 'glass-card',
    elevated: 'bg-card border border-border premium-shadow-lg',
    gradient: 'premium-gradient text-primary-foreground border-none',
  };

  return (
    <MotionView
      animatedStyle={combinedStyle}
      onMouseEnter={hover ? hoverLift.onMouseEnter : undefined}
      onMouseLeave={hover ? hoverLift.onMouseLeave : undefined}
      className={cn(
        'rounded-xl p-6 transition-all duration-300',
        variants[variant],
        hover && 'cursor-pointer hover-lift-premium',
        glow && 'animate-glow-ring',
        className
      )}
      {...props}
    >
      {children}
    </MotionView>
  );
}
