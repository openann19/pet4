import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSharedValue, withTiming, useanimate   type AnimatedStyle,
} from '@petspark/motion';
import { motion, type AnimatedStyle } from '@petspark/motion';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";
import { getSpacingClassesFromConfig } from '@/lib/typography';

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
  style: _style,
  ...props
}: PremiumCardProps) {
    const _uiConfig = useUIConfig();
    const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const hoverLift = useHoverLift({ scale: 1.02, translateY: -8 });

  useEffect(() => {
    const opacityTransition = withTiming(1, { duration: 220 });
    animate(opacity, opacityTransition.target, opacityTransition.transition);
    const translateYTransition = withTiming(0, { duration: 220 });
    animate(translateY, translateYTransition.target, translateYTransition.transition);
  }, [opacity, translateY]);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: translateY.get() }],
  }));

  const _combinedStyle =
    hover && hoverLift.animatedStyle ? { ...entryStyle, ...hoverLift.animatedStyle } : entryStyle;

  const variants = {
    default: 'bg-card border border-border',
    glass: 'glass-card',
    elevated: 'bg-card border border-border premium-shadow-lg',
    gradient: 'premium-gradient text-primary-foreground border-none',
  };

  return (
    <motion.div
      style={{
        opacity: opacity.get(),
        scale: hover ? hoverLift.scale : undefined,
        y: hover ? hoverLift.translateY : translateY.get(),
      } as any}
      onMouseEnter={hover ? hoverLift.handleEnter : undefined}
      onMouseLeave={hover ? hoverLift.handleLeave : undefined}
      className={cn(
        'rounded-xl transition-all duration-300',
        getSpacingClassesFromConfig({ padding: 'xl' }),
        variants[variant],
        hover && 'cursor-pointer hover-lift-premium',
        glow && 'animate-glow-ring',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
