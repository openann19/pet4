'use client';;
import React, { useCallback, useRef, useEffect } from 'react';
import { useSharedValue, usewithSpring, animate, MotionView } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { useUIConfig } from "@/hooks/use-ui-config";
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { getTypographyClasses } from '@/lib/typography';

export interface PremiumTab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

export interface PremiumTabsProps {
  tabs: PremiumTab[];
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  scrollable?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function PremiumTabs({
  tabs,
  value,
  onValueChange,
  defaultValue,
  variant = 'default',
  size = 'md',
  scrollable = false,
  className,
  children,
}: PremiumTabsProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const activeTab = value ?? defaultValue ?? tabs[0]?.value;

  const updateIndicator = useCallback(() => {
    if (!containerRef.current || tabs.length === 0) return;

    const container = containerRef.current;
    const buttons = container.querySelectorAll('button[data-tab-trigger]');
    const activeIndex = tabs.findIndex((tab) => tab.value === activeTab);

    if (activeIndex >= 0 && buttons[activeIndex]) {
      const activeButton = buttons[activeIndex] as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      const newPosition = buttonRect.left - containerRect.left;
      const newWidth = buttonRect.width;

      if (prefersReducedMotion) {
        indicatorPosition.value = newPosition;
        indicatorWidth.value = newWidth;
      } else {
        const positionTransition = withSpring(newPosition, springConfigs.smooth);
        animate(indicatorPosition, positionTransition.target, positionTransition.transition);
        const widthTransition = withSpring(newWidth, springConfigs.smooth);
        animate(indicatorWidth, widthTransition.target, widthTransition.transition);
      }
    }
  }, [tabs, activeTab, indicatorPosition, indicatorWidth, prefersReducedMotion]);

  useEffect(() => {
    updateIndicator();
    const resizeObserver = new ResizeObserver(updateIndicator);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [updateIndicator]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.get() }],
    width: indicatorWidth.get(),
  }));

  const handleValueChange = useCallback(
    (newValue: string) => {
      onValueChange?.(newValue);
      haptics.selection();
      setTimeout(updateIndicator, 0);
    },
    [onValueChange, updateIndicator]
  );

  const variants = {
    default: 'bg-muted',
    pills: 'bg-transparent gap-2',
    underline: 'bg-transparent border-b border-border',
  };

  const sizes = {
    sm: cn('h-8 px-3', getTypographyClasses('caption')),
    md: cn('h-10 px-4', getTypographyClasses('body')),
    lg: cn('h-12 px-5', getTypographyClasses('subtitle')),
  };

  return (
    <TabsPrimitive.Root
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      onValueChange={handleValueChange}
      className={cn('w-full', className)}
    >
      <div className="relative">
        <TabsPrimitive.List
          ref={containerRef}
          className={cn(
            'inline-flex items-center',
            scrollable && 'overflow-x-auto',
            variants[variant],
            variant === 'default' && 'rounded-lg p-1',
            variant === 'underline' && 'p-0'
          )}
        >
          {variant === 'underline' && (
            <MotionView
              style={indicatorStyle}
              className="absolute bottom-0 h-0.5 bg-primary transition-all"
            >
              <div />
            </MotionView>
          )}
          {tabs.map((tab) => {
            const isActive = tab.value === activeTab;
            return (
              <TabsPrimitive.Trigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                data-tab-trigger
                className={cn(
                  'relative z-10 flex items-center gap-2 font-medium',
                  prefersReducedMotion ? '' : 'transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
                  'disabled:pointer-events-none disabled:opacity-50',
                  sizes[size],
                  variant === 'default' &&
                    cn(
                      'rounded-md',
                      isActive
                        ? 'bg-(--background) text-(--text-primary) shadow-sm'
                        : 'text-(--text-muted) hover:text-(--text-primary)'
                    ),
                  variant === 'pills' &&
                    cn(
                      'rounded-full px-4',
                      isActive
                        ? 'bg-(--primary) text-(--primary-foreground)'
                        : 'bg-(--surface) text-(--text-muted) hover:bg-(--surface)/80'
                    ),
                  variant === 'underline' &&
                    cn(
                      'border-b-2 border-transparent',
                      isActive
                        ? 'border-(--primary) text-(--primary)'
                        : 'text-(--text-muted) hover:text-(--text-primary) hover:border-(--text-muted)/50'
                    )
                )}
              >
                {tab.icon && <span>{tab.icon}</span>}
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full',
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>
      </div>
      {children}
    </TabsPrimitive.Root>
  );
}
