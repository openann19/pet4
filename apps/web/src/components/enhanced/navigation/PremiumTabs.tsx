'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { springConfigs } from '@/effects/reanimated/transitions'
import { haptics } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export interface PremiumTab {
  value: string
  label: string
  icon?: React.ReactNode
  badge?: number | string
  disabled?: boolean
}

export interface PremiumTabsProps {
  tabs: PremiumTab[]
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  variant?: 'default' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  scrollable?: boolean
  className?: string
  children?: React.ReactNode
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
  const containerRef = useRef<HTMLDivElement>(null)
  const indicatorPosition = useSharedValue(0)
  const indicatorWidth = useSharedValue(0)
  const activeTab = value || defaultValue || tabs[0]?.value

  const updateIndicator = useCallback(() => {
    if (!containerRef.current || tabs.length === 0) return

    const container = containerRef.current
    const buttons = container.querySelectorAll('button[data-tab-trigger]')
    const activeIndex = tabs.findIndex((tab) => tab.value === activeTab)

    if (activeIndex >= 0 && buttons[activeIndex]) {
      const activeButton = buttons[activeIndex] as HTMLElement
      const containerRect = container.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      indicatorPosition.value = withSpring(buttonRect.left - containerRect.left, springConfigs.smooth)
      indicatorWidth.value = withSpring(buttonRect.width, springConfigs.smooth)
    }
  }, [tabs, activeTab, indicatorPosition, indicatorWidth])

  useEffect(() => {
    updateIndicator()
    const resizeObserver = new ResizeObserver(updateIndicator)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    return () => resizeObserver.disconnect()
  }, [updateIndicator])

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: indicatorWidth.value,
  })) as AnimatedStyle

  const handleValueChange = useCallback(
    (newValue: string) => {
      onValueChange?.(newValue)
      haptics.selection()
      setTimeout(updateIndicator, 0)
    },
    [onValueChange, updateIndicator]
  )

  const variants = {
    default: 'bg-muted',
    pills: 'bg-transparent gap-2',
    underline: 'bg-transparent border-b border-border',
  }

  const sizes = {
    sm: 'h-8 text-sm px-3',
    md: 'h-10 text-base px-4',
    lg: 'h-12 text-lg px-5',
  }

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
            <AnimatedView
              style={indicatorStyle}
              className="absolute bottom-0 h-0.5 bg-primary transition-all"
            >
              <div />
            </AnimatedView>
          )}
          {tabs.map((tab) => {
            const isActive = tab.value === activeTab
            return (
              <TabsPrimitive.Trigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                data-tab-trigger
                className={cn(
                  'relative z-10 flex items-center gap-2 font-medium transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  'disabled:pointer-events-none disabled:opacity-50',
                  sizes[size],
                  variant === 'default' &&
                    cn(
                      'rounded-md',
                      isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    ),
                  variant === 'pills' &&
                    cn(
                      'rounded-full px-4',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    ),
                  variant === 'underline' &&
                    cn(
                      'border-b-2 border-transparent',
                      isActive
                        ? 'border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                    )
                )}
              >
                {tab.icon && <span>{tab.icon}</span>}
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full',
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </TabsPrimitive.Trigger>
            )
          })}
        </TabsPrimitive.List>
      </div>
      {children}
    </TabsPrimitive.Root>
  )
}
