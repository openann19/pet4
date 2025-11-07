'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { springConfigs } from '@/effects/reanimated/transitions'
import { haptics } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { X, CheckCircle, Warning, Info, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export type PremiumToastType = 'success' | 'error' | 'warning' | 'info'

export interface PremiumToastAction {
  label: string
  onClick: () => void
}

export interface PremiumToastProps {
  id: string
  type: PremiumToastType
  title: string
  description?: string
  action?: PremiumToastAction
  duration?: number
  onDismiss: (id: string) => void
  position?: 'top' | 'bottom'
  showProgress?: boolean
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: Warning,
  info: Info,
}

const colors = {
  success: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300',
  error: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
}

const iconColors = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
}

export function PremiumToast({
  id,
  type,
  title,
  description,
  action,
  duration = 5000,
  onDismiss,
  position = 'top',
  showProgress = true,
}: PremiumToastProps): React.JSX.Element {
  const Icon = icons[type]
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(position === 'top' ? -20 : 20)
  const translateX = useSharedValue(0)
  const scale = useSharedValue(0.95)
  const progressWidth = useSharedValue(100)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    opacity.value = withSpring(1, springConfigs.smooth)
    translateY.value = withSpring(0, springConfigs.smooth)
    scale.value = withSpring(1, springConfigs.smooth)
  }, [opacity, translateY, scale])

  useEffect(() => {
    if (!showProgress || isPaused || duration === 0) return

    progressWidth.value = withTiming(0, { duration })

    const timer = setTimeout(() => {
      handleDismiss()
    }, duration)

    return () => { clearTimeout(timer); }
  }, [duration, isPaused, showProgress, progressWidth])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  })) as AnimatedStyle

  const progressStyle = useAnimatedStyle(() => ({
    width: `${String(progressWidth.value ?? '')}%`,
  })) as AnimatedStyle

  const handleDismiss = useCallback(() => {
    opacity.value = withTiming(0, { duration: 200 })
    translateX.value = withTiming(300, { duration: 200 })
    scale.value = withTiming(0.9, { duration: 200 })
    setTimeout(() => { onDismiss(id); }, 200)
  }, [id, onDismiss, opacity, translateX, scale])

  return (
    <AnimatedView
      style={animatedStyle}
      onMouseEnter={() => { setIsPaused(true); }}
      onMouseLeave={() => { setIsPaused(false); }}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-xl min-w-[320px] max-w-md',
        'transition-all duration-200',
        colors[type]
      )}
    >
      {showProgress && (
        <AnimatedView
          style={progressStyle}
          className="absolute top-0 left-0 h-1 bg-current opacity-30 rounded-t-xl"
        >
          <div />
        </AnimatedView>
      )}

      <Icon className={cn('shrink-0 mt-0.5', iconColors[type])} size={20} />

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm mb-1">{title}</div>
        {description && (
          <div className="text-xs opacity-90 leading-relaxed">{description}</div>
        )}
        {action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              action.onClick()
              handleDismiss()
            }}
            className="mt-2 h-7 text-xs font-medium hover:bg-background/50"
          >
            {action.label}
          </Button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </AnimatedView>
  )
}

