import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { AnimatedView, useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import { useSharedValue, useAnimatedStyle, withTiming, withRepeat } from 'react-native-reanimated';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import type { ButtonHTMLAttributes } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";

interface PremiumButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children: React.ReactNode;
}

export function PremiumButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  className,
  children,
  onClick,
  ...props
}: PremiumButtonProps) {
    const _uiConfig = useUIConfig();
    const hoverLift = useHoverLift({ scale: 1.05 });
  const bounceOnTap = useBounceOnTap({ scale: 0.95, hapticFeedback: false });
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (loading) {
      rotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
    } else {
      rotation.value = 0;
    }
  }, [loading, rotation]);

  const loadingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  })) as AnimatedStyle;

  const buttonStyle = useAnimatedStyle(() => {
    const hoverScale = hoverLift.scale.value;
    const tapScale = bounceOnTap.scale.value;
    const hoverY = hoverLift.translateY.value;

    return {
      transform: [{ scale: hoverScale * tapScale }, { translateY: hoverY }],
    };
  }) as AnimatedStyle;

  const buttonStyleValue = useAnimatedStyleValue(buttonStyle);
  const loadingStyleValue = useAnimatedStyleValue(loadingStyle);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    haptics.impact('light');
    bounceOnTap.handlePress();
    onClick?.(e);
  };

  const variants = {
    primary:
      'bg-(--btn-primary-bg) text-(--btn-primary-fg) hover:bg-(--btn-primary-hover-bg) hover:text-(--btn-primary-hover-fg) active:bg-(--btn-primary-press-bg) active:text-(--btn-primary-press-fg) disabled:bg-(--btn-primary-disabled-bg) disabled:text-(--btn-primary-disabled-fg) focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-focus-ring)]',
    secondary:
      'bg-(--btn-secondary-bg) text-(--btn-secondary-fg) hover:bg-(--btn-secondary-hover-bg) hover:text-(--btn-secondary-hover-fg) active:bg-(--btn-secondary-press-bg) active:text-(--btn-secondary-press-fg) disabled:bg-(--btn-secondary-disabled-bg) disabled:text-(--btn-secondary-disabled-fg) focus-visible:ring-2 focus-visible:ring-[var(--btn-secondary-focus-ring)]',
    accent:
      'bg-(--btn-primary-bg) text-(--btn-primary-fg) hover:bg-(--btn-primary-hover-bg) hover:text-(--btn-primary-hover-fg) active:bg-(--btn-primary-press-bg) active:text-(--btn-primary-press-fg) disabled:bg-(--btn-primary-disabled-bg) disabled:text-(--btn-primary-disabled-fg) focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-focus-ring)]',
    ghost:
      'bg-(--btn-ghost-bg) text-(--btn-ghost-fg) hover:bg-(--btn-ghost-hover-bg) hover:text-(--btn-ghost-hover-fg) active:bg-(--btn-ghost-press-bg) active:text-(--btn-ghost-press-fg) disabled:bg-(--btn-ghost-disabled-bg) disabled:text-(--btn-ghost-disabled-fg) focus-visible:ring-2 focus-visible:ring-[var(--btn-ghost-focus-ring)]',
    gradient:
      'bg-gradient-to-r from-[var(--btn-primary-bg)] via-[var(--btn-secondary-bg)] to-[var(--btn-primary-bg)] text-(--btn-primary-fg) hover:from-[var(--btn-primary-hover-bg)] hover:via-[var(--btn-secondary-hover-bg)] hover:to-[var(--btn-primary-hover-bg)] active:from-[var(--btn-primary-press-bg)] active:via-[var(--btn-secondary-press-bg)] active:to-[var(--btn-primary-press-bg)] disabled:from-[var(--btn-primary-disabled-bg)] disabled:via-[var(--btn-secondary-disabled-bg)] disabled:to-[var(--btn-primary-disabled-bg)] disabled:text-(--btn-primary-disabled-fg) focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-focus-ring)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[44px] min-w-[44px]',
    md: 'px-4 py-2 text-base min-h-[44px] min-w-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[44px] min-w-[44px]',
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={hoverLift.handleEnter}
      onMouseLeave={hoverLift.handleLeave}
      style={buttonStyleValue}
      className={cn(
        'relative overflow-hidden rounded-xl font-semibold',
        'shadow-lg transition-all duration-300',
        'disabled:cursor-not-allowed',
        'flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div
          style={loadingStyleValue}
          className="h-5 w-5 rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
}
