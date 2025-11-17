'use client';

import React, { useState, useCallback, type ReactNode } from 'react';
import { motion, useMotionValue, animate, type Variants } from '@petspark/motion';
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
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function SplitButton({
  mainAction,
  secondaryActions,
  variant = 'default',
  size = 'default',
  disabled = false,
  className,
}: SplitButtonProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const [isOpen, setIsOpen] = useState(false);
  const dividerOpacity = useMotionValue(1);
  const menuScale = useMotionValue(0.95);

  const hoverLift = useHoverLift({
    scale: 1.02,
    translateY: -2,
    damping: 25,
    stiffness: 400,
  });

  const dividerVariants: Variants = {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0.3,
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
  };

  const menuVariants: Variants = {
    closed: {
      scale: 0.95,
    },
    open: {
      scale: 1,
      transition: {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      },
    },
  };

  const handleMainClick = useCallback(() => {
    if (disabled) return;
    haptics.impact('light');
    mainAction.onClick();
  }, [disabled, mainAction]);

  const handleMenuOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        animate(dividerOpacity, 0.3, {
          duration: 0.2,
          ease: 'easeInOut',
        });
        animate(menuScale, 1, {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
        });
        haptics.selection();
      } else {
        animate(dividerOpacity, 1, {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
        });
        animate(menuScale, 0.95, {
          duration: 0.15,
          ease: 'easeInOut',
        });
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
      <motion.div
        variants={hoverLift.variants}
        initial="rest"
        animate="rest"
        whileHover="hover"
        style={{ scale: hoverLift.scale, y: hoverLift.translateY }}
      >
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
      </motion.div>

      <motion.div
        variants={dividerVariants}
        animate={isOpen ? 'hidden' : 'visible'}
        style={{ opacity: dividerOpacity }}
      >
        <div className="w-px bg-border/50" />
      </motion.div>

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
          <motion.div
            variants={menuVariants}
            animate={isOpen ? 'open' : 'closed'}
            style={{ scale: menuScale }}
          >
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
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
