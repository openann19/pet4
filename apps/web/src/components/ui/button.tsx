'use client';

import type { ComponentProps, MouseEvent } from 'react';
import { useCallback } from 'react';
import { useAnimatedStyle } from 'react-native-reanimated';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimatedView, useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { ensureFocusAppearance } from '@/core/a11y/focus-appearance';
import { useTargetSizeRef } from '@/hooks/use-target-size';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] font-semibold disabled:pointer-events-none disabled:cursor-default [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus:outline-none transition-colors duration-200 min-h-[44px] min-w-[44px] focus-ring",
  {
    variants: {
      variant: {
        default:
          'h-[50px] px-6 bg-(--btn-primary-bg) text-(--btn-primary-fg) hover:bg-(--btn-primary-hover-bg) active:bg-(--btn-primary-press-bg) active:scale-[0.96] disabled:bg-(--btn-primary-disabled-bg) disabled:text-(--btn-primary-disabled-fg) disabled:opacity-50 disabled:scale-100 text-[15px]',
        destructive:
          'h-[50px] px-6 bg-(--btn-destructive-bg) text-(--btn-destructive-fg) hover:bg-(--btn-destructive-hover-bg) active:bg-(--btn-destructive-press-bg) active:scale-[0.96] disabled:bg-(--btn-destructive-disabled-bg) disabled:text-(--btn-destructive-disabled-fg) disabled:opacity-50 disabled:scale-100 text-[15px]',
        outline:
          'h-[48px] px-5 border border-(--btn-outline-border) bg-(--btn-outline-bg) text-(--btn-outline-fg) hover:bg-(--btn-outline-hover-bg) hover:text-(--btn-outline-hover-fg) hover:border-(--btn-outline-hover-border) active:bg-(--btn-outline-press-bg) active:text-(--btn-outline-press-fg) active:border-(--btn-outline-press-border) active:scale-[0.96] disabled:bg-(--btn-outline-disabled-bg) disabled:text-(--btn-outline-disabled-fg) disabled:border-(--btn-outline-disabled-border) disabled:opacity-50 disabled:scale-100 text-[14px]',
        secondary:
          'h-[48px] px-5 bg-(--btn-secondary-bg) text-(--btn-secondary-fg) hover:bg-(--btn-secondary-hover-bg) active:bg-(--btn-secondary-press-bg) active:scale-[0.96] disabled:bg-(--btn-secondary-disabled-bg) disabled:text-(--btn-secondary-disabled-fg) disabled:opacity-50 disabled:scale-100 text-[14px]',
        ghost:
          'h-[48px] px-5 bg-(--btn-ghost-bg) text-(--btn-ghost-fg) hover:bg-(--btn-ghost-hover-bg) hover:text-(--btn-ghost-hover-fg) active:bg-(--btn-ghost-press-bg) active:text-(--btn-ghost-press-fg) active:scale-[0.96] disabled:bg-(--btn-ghost-disabled-bg) disabled:text-(--btn-ghost-disabled-fg) disabled:opacity-50 disabled:scale-100 text-[14px]',
        link: 'h-auto px-0 text-(--btn-link-fg) underline-offset-4 hover:underline hover:text-(--btn-link-hover-fg) disabled:text-(--btn-link-disabled-fg) disabled:no-underline bg-transparent font-medium text-[14px]',
        oauth:
          'h-[48px] px-5 border border-(--btn-oauth-border) bg-(--btn-oauth-bg) text-(--btn-oauth-fg) hover:bg-(--btn-oauth-hover-bg) hover:text-(--btn-oauth-hover-fg) hover:border-(--btn-oauth-hover-border) active:bg-(--btn-oauth-press-bg) active:text-(--btn-oauth-press-fg) active:border-(--btn-oauth-press-border) active:scale-[0.96] disabled:bg-(--btn-oauth-disabled-bg) disabled:text-(--btn-oauth-disabled-fg) disabled:border-(--btn-oauth-disabled-border) disabled:opacity-50 disabled:scale-100 text-[14px]',
      },
      size: {
        default: 'h-[50px] px-6 has-[>svg]:px-4 [&_svg]:size-5 text-[15px]',
        sm: 'h-[48px] rounded-[var(--radius-md)] gap-1.5 px-4 has-[>svg]:px-3 [&_svg]:size-4 min-h-[44px] text-[14px]',
        lg: 'h-[56px] rounded-[var(--radius-md)] px-6 has-[>svg]:px-5 text-[15px] [&_svg]:size-6',
        icon: 'size-12 min-w-[44px] min-h-[44px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  enableAnimations?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  enableAnimations = true,
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  const reducedMotion = usePrefersReducedMotion();
  const shouldAnimate = enableAnimations && !reducedMotion && !disabled;

  const hoverLift = useHoverLift({
    scale: shouldAnimate ? 1.05 : 1,
    translateY: shouldAnimate ? -4 : 0,
  });

  const bounceOnTap = useBounceOnTap({
    scale: shouldAnimate ? 0.96 : 1,
    hapticFeedback: false,
  });

  // Target size validation - ensures 44x44px minimum touch target
  const targetSizeRef = useTargetSizeRef({ enabled: !disabled && !asChild, autoFix: true });

  // Ensure focus appearance meets WCAG 2.2 AAA requirements
  const buttonRefCallback = useCallback((element: HTMLButtonElement | null) => {
    if (element) {
      targetSizeRef.current = element;
      if (!disabled && !asChild) {
        ensureFocusAppearance(element);
      }
    }
  }, [disabled, asChild, targetSizeRef]);

  // Combine both animated styles
  const combinedAnimatedStyle = useAnimatedStyle(() => {
    if (!shouldAnimate) {
      return {};
    }

    const hoverScale = hoverLift.scale.value;
    const tapScale = bounceOnTap.scale.value;
    const hoverY = hoverLift.translateY.value;

    return {
      transform: [{ scale: hoverScale * tapScale }, { translateY: hoverY }],
    };
  }) as AnimatedStyle;

  const animatedStyleValue = useAnimatedStyleValue(combinedAnimatedStyle);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }

      if (shouldAnimate) {
        haptics.impact('light');
        bounceOnTap.handlePress();
      }

      onClick?.(e);
    },
    [disabled, shouldAnimate, bounceOnTap, onClick]
  );

  const handleMouseEnter = useCallback(() => {
    if (shouldAnimate) {
      hoverLift.handleEnter();
    }
  }, [shouldAnimate, hoverLift]);

  const handleMouseLeave = useCallback(() => {
    if (shouldAnimate) {
      hoverLift.handleLeave();
    }
  }, [shouldAnimate, hoverLift]);

  const Comp = asChild ? Slot : 'button';

  if (asChild || !shouldAnimate) {
    return (
      <Comp
        ref={buttonRefCallback}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }), 'focus-ring')}
        onClick={onClick}
        disabled={disabled}
        {...props}
      />
    );
  }

  return (
    <AnimatedView
      style={animatedStyleValue}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Comp
        ref={buttonRefCallback}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }), 'focus-ring')}
        onClick={handleClick}
        disabled={disabled}
        {...props}
      />
    </AnimatedView>
  );
}

export { Button, buttonVariants };
