'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { springConfigs } from '@/effects/reanimated/transitions'
import { haptics } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export interface SegmentedControlOption {
  label: string
  value: string
  icon?: React.ReactNode
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  multiSelect?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  'aria-label': string
}

export function SegmentedControl({
  options,
  value,
  onChange,
  multiSelect = false,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const indicatorPosition = useSharedValue(0)
  const indicatorWidth = useSharedValue(0)
  const selectedValues = Array.isArray(value) ? value : value ? [value] : []

  const updateIndicator = useCallback(() => {
    if (!containerRef.current || options.length === 0) return

    const container = containerRef.current
    const buttons = container.querySelectorAll('button[data-segment]')
    const selectedIndex = options.findIndex((opt) => selectedValues.includes(opt.value))

    if (selectedIndex >= 0 && buttons[selectedIndex]) {
      const selectedButton = buttons[selectedIndex] as HTMLElement
      const containerRect = container.getBoundingClientRect()
      const buttonRect = selectedButton.getBoundingClientRect()

      indicatorPosition.value = withSpring(buttonRect.left - containerRect.left, springConfigs.smooth)
      indicatorWidth.value = withSpring(buttonRect.width, springConfigs.smooth)
    }
  }, [options, selectedValues, indicatorPosition, indicatorWidth])

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

  const handleOptionClick = useCallback(
    (optionValue: string) => {
      if (multiSelect) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue]
        onChange?.(newValues)
      } else {
        onChange?.(optionValue)
      }
      haptics.selection()
      setTimeout(updateIndicator, 0)
    },
    [multiSelect, selectedValues, onChange, updateIndicator]
  )

  const sizes = {
    sm: 'px-2 py-1 text-sm min-h-[36px]',
    md: 'px-3 py-1.5 text-base min-h-[44px]',
    lg: 'px-4 py-2 text-lg min-h-[52px]',
  }

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'relative inline-flex rounded-xl bg-muted p-1',
        'border border-border',
        className
      )}
    >
      <AnimatedView
        style={indicatorStyle}
        className="absolute top-1 bottom-1 bg-background rounded-lg shadow-sm transition-all"
      />
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value)
        return (
          <button
            key={option.value}
            data-segment
            onClick={() => handleOptionClick(option.value)}
            role="tab"
            aria-selected={isSelected}
            className={cn(
              'relative z-10 flex items-center justify-center gap-2',
              'rounded-lg font-medium transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              sizes[size],
              isSelected
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.icon && <span>{option.icon}</span>}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

