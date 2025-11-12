'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { PremiumButton } from '../PremiumButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface SplitButtonAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SplitButtonProps {
  mainAction: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    loading?: boolean;
  };
  secondaryActions: SplitButtonAction[];
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function SplitButton({
  mainAction,
  secondaryActions,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
}: SplitButtonProps): React.JSX.Element {
    const _uiConfig = useUIConfig();
    const [isOpen, setIsOpen] = useState(false);
  const dividerOpacity = useSharedValue(1);
  const menuScale = useSharedValue(0.95);

  const hoverLift = useHoverLift({
    scale: 1.02,
    translateY: -2,
    damping: 25,
    stiffness: 400,
  });

  const dividerStyle = useAnimatedStyle(() => ({
    opacity: dividerOpacity.value,
  })) as AnimatedStyle;

  const menuStyle = useAnimatedStyle(() => ({
    transform: [{ scale: menuScale.value }],
  })) as AnimatedStyle;

  const handleMainClick = useCallback(() => {
    if (disabled) return;
    haptics.impact('light');
    mainAction.onClick();
  }, [disabled, mainAction]);

  const handleMenuOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        dividerOpacity.value = withTiming(0.3, { duration: 200 });
        menuScale.value = withSpring(1, springConfigs.smooth);
        haptics.selection();
      } else {
        dividerOpacity.value = withSpring(1, springConfigs.smooth);
        menuScale.value = withTiming(0.95, { duration: 150 });
      }
    },
    [dividerOpacity, menuScale]
  );

  const handleSecondaryAction = useCallback((action: SplitButtonAction) => {
    haptics.impact('light');
    action.onClick();
    setIsOpen(false);
  }, []);

  return (
    <div
      className={cn('inline-flex items-stretch rounded-xl overflow-hidden', className)}
      onMouseEnter={hoverLift.handleEnter}
      onMouseLeave={hoverLift.handleLeave}
    >
      <AnimatedView style={hoverLift.animatedStyle}>
        <PremiumButton
          variant={variant}
          size={size}
          onClick={handleMainClick}
          disabled={disabled || mainAction.loading === true}
          loading={mainAction.loading === true}
          className="rounded-r-none border-r-0"
        >
          {mainAction.icon && <span className="mr-2">{mainAction.icon}</span>}
          {mainAction.label}
        </PremiumButton>
      </AnimatedView>

      <AnimatedView style={dividerStyle}>
        <div className="w-px bg-border/50" />
      </AnimatedView>

      <DropdownMenu open={isOpen} onOpenChange={handleMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            disabled={disabled}
            className={cn(
              'flex items-center justify-center px-2',
              'hover:opacity-90',
              'active:opacity-80',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-300',
              'rounded-l-none',
              size === 'sm' && 'min-h-11',
              size === 'md' && 'min-h-11',
              size === 'lg' && 'min-h-11'
            )}
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-fg)',
            }}
            aria-label="More options"
          >
            <ChevronDown
              className={cn('transition-transform duration-300', isOpen && 'rotate-180')}
              size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-50">
          <AnimatedView style={menuStyle}>
            {secondaryActions.map((action, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => { handleSecondaryAction(action); }}
                disabled={action.disabled === true}
                className="flex items-center gap-2 cursor-pointer"
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            ))}
          </AnimatedView>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
