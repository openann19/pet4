'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { Button } from '@/components/ui/button'
import { Bell, BellRinging } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, interpolate, Extrapolation } from 'react-native-reanimated'
import { haptics } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { PremiumNotificationCenter, type PremiumNotification } from './PremiumNotificationCenter'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

const logger = createLogger('PremiumNotificationBell')

export function PremiumNotificationBell(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [notifications] = useStorage<PremiumNotification[]>('premium-notifications', [])
  const [hasNewNotification, setHasNewNotification] = useState<boolean>(false)
  const [lastCheckTime, setLastCheckTime] = useStorage<number>('last-notification-check', Date.now())
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null)

  const allNotifications = useMemo<PremiumNotification[]>(
    () => notifications || [],
    [notifications]
  )

  const unreadCount = useMemo<number>(
    () => allNotifications.filter(n => !n.read && !n.archived).length,
    [allNotifications]
  )

  const urgentCount = useMemo<number>(
    () => allNotifications.filter(
      n => !n.read && !n.archived && (n.priority === 'urgent' || n.priority === 'critical')
    ).length,
    [allNotifications]
  )

  const hasUrgent = useMemo<boolean>(
    () => urgentCount > 0,
    [urgentCount]
  )

  useEffect(() => {
    try {
      const newNotifs = allNotifications.filter(n => n.timestamp > (lastCheckTime || 0))
      if (newNotifs.length > 0 && !isOpen) {
        setHasNewNotification(true)
        haptics.medium()
        logger.info('New notifications received', { 
          count: newNotifs.length,
          urgentCount: newNotifs.filter(n => n.priority === 'urgent' || n.priority === 'critical').length
        })

        if (notificationTimerRef.current) {
          clearTimeout(notificationTimerRef.current)
        }
        notificationTimerRef.current = setTimeout(() => {
          setHasNewNotification(false)
        }, 3000)

        return () => {
          if (notificationTimerRef.current) {
            clearTimeout(notificationTimerRef.current)
            notificationTimerRef.current = null
          }
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to check for new notifications', err)
    }
    return undefined
  }, [allNotifications.length, lastCheckTime, isOpen, allNotifications])

  const handleClick = useCallback((): void => {
    try {
      haptics.medium()
      setIsOpen(true)
      setLastCheckTime(Date.now())
      setHasNewNotification(false)
      logger.info('Notification bell clicked', { unreadCount, urgentCount })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to handle notification bell click', err)
    }
  }, [setLastCheckTime, unreadCount, urgentCount])

  const handleClose = useCallback((): void => {
    setIsOpen(false)
  }, [])

  const ariaLabel = useMemo<string>(() => {
    const parts: string[] = ['Notifications']
    if (unreadCount > 0) {
      parts.push(`${unreadCount} unread`)
    }
    if (urgentCount > 0) {
      parts.push(`${urgentCount} urgent`)
    }
    return parts.join(' - ')
  }, [unreadCount, urgentCount])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="relative rounded-full w-11 h-11 hover:bg-primary/10 active:bg-primary/20 transition-colors shrink-0 touch-manipulation"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <BellIcon
          hasNewNotification={hasNewNotification}
          unreadCount={unreadCount}
          hasUrgent={hasUrgent}
        />

        {unreadCount > 0 && (
          <BadgeAnimation
            unreadCount={unreadCount}
            hasUrgent={hasUrgent}
          />
        )}

        {unreadCount > 0 && (
          <RippleEffect hasUrgent={hasUrgent} />
        )}

        {hasUrgent && (
          <UrgentGlow />
        )}
      </Button>

      <PremiumNotificationCenter isOpen={isOpen} onClose={handleClose} />
    </>
  )
}

interface BellIconProps {
  hasNewNotification: boolean
  unreadCount: number
  hasUrgent: boolean
}

function BellIcon({ hasNewNotification, unreadCount, hasUrgent }: BellIconProps): JSX.Element {
  const rotation = useSharedValue(0)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (hasNewNotification && unreadCount > 0) {
      rotation.value = withSequence(
        withTiming(-20, { duration: 100 }),
        withTiming(20, { duration: 100 }),
        withTiming(-20, { duration: 100 }),
        withTiming(20, { duration: 100 }),
        withTiming(-15, { duration: 80 }),
        withTiming(15, { duration: 80 }),
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(0, { duration: 100 })
      )
      scale.value = withSequence(
        withTiming(1.15, { duration: 100 }),
        withTiming(1, { duration: 100 }),
        withTiming(1.15, { duration: 100 }),
        withTiming(1, { duration: 100 }),
        withTiming(1.1, { duration: 80 }),
        withTiming(1, { duration: 80 }),
        withTiming(1.05, { duration: 60 }),
        withTiming(1, { duration: 60 })
      )
    } else {
      rotation.value = withTiming(0, { duration: 200 })
      scale.value = withTiming(1, { duration: 200 })
    }
  }, [hasNewNotification, unreadCount, rotation, scale])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value }
      ],
      opacity: opacity.value
    }
  }) as AnimatedStyle

  const iconClassName = useMemo<string>(() => {
    if (hasUrgent) return 'text-destructive'
    if (unreadCount > 0) return 'text-primary'
    return 'text-foreground/80'
  }, [hasUrgent, unreadCount])

  if (hasNewNotification && unreadCount > 0) {
    return (
      <AnimatedView style={animatedStyle}>
        <BellRinging 
          size={20} 
          weight="fill" 
          className={iconClassName}
          aria-hidden="true"
        />
      </AnimatedView>
    )
  }

  return (
    <AnimatedView style={animatedStyle}>
      <Bell 
        size={20} 
        weight={unreadCount > 0 ? 'fill' : 'regular'} 
        className={iconClassName}
        aria-hidden="true"
      />
    </AnimatedView>
  )
}

interface BadgeAnimationProps {
  unreadCount: number
  hasUrgent: boolean
}

function BadgeAnimation({ unreadCount, hasUrgent }: BadgeAnimationProps): JSX.Element {
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)
  const pulseScale = useSharedValue(1)

  useEffect(() => {
    scale.value = withTiming(1, { duration: 300 })
    opacity.value = withTiming(1, { duration: 300 })
  }, [scale, opacity])

  useEffect(() => {
    if (hasUrgent) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      )
    } else {
      pulseScale.value = withTiming(1, { duration: 200 })
    }
  }, [hasUrgent, pulseScale])

  const badgeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value
    }
  }) as AnimatedStyle

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }]
    }
  }) as AnimatedStyle

  return (
    <AnimatedView
      style={badgeStyle}
      className="absolute -top-1 -right-1"
    >
      <AnimatedView style={pulseStyle}>
        <Badge 
          variant={hasUrgent ? 'destructive' : 'default'}
          className="h-5 min-w-[20px] px-1 rounded-full text-xs font-bold flex items-center justify-center shadow-lg"
          aria-label={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      </AnimatedView>
    </AnimatedView>
  )
}

interface RippleEffectProps {
  hasUrgent: boolean
}

function RippleEffect({ hasUrgent }: RippleEffectProps): JSX.Element {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0.6)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: hasUrgent ? 1500 : 2000 }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    )
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: hasUrgent ? 1500 : 2000 }),
        withTiming(0.6, { duration: 0 })
      ),
      -1,
      false
    )
  }, [hasUrgent, scale, opacity])

  const rippleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value
    }
  }) as AnimatedStyle

  return (
    <AnimatedView
      style={rippleStyle}
      className={cn(
        'absolute inset-0 rounded-full border-2 pointer-events-none',
        hasUrgent ? 'border-destructive' : 'border-primary'
      )}
      aria-hidden="true"
    >
      <span className="sr-only">Ripple effect</span>
    </AnimatedView>
  )
}

function UrgentGlow(): JSX.Element {
  const shadowRadius = useSharedValue(0)
  const shadowOpacity = useSharedValue(0)

  useEffect(() => {
    shadowRadius.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 750 }),
        withTiming(0, { duration: 750 })
      ),
      -1,
      true
    )
    shadowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 750 }),
        withTiming(0, { duration: 750 })
      ),
      -1,
      true
    )
  }, [shadowRadius, shadowOpacity])

  const glowStyle = useAnimatedStyle(() => {
    const radius = interpolate(
      shadowRadius.value,
      [0, 8],
      [0, 8],
      Extrapolation.CLAMP
    )
    const opacity = interpolate(
      shadowOpacity.value,
      [0, 0.3],
      [0, 0.3],
      Extrapolation.CLAMP
    )
    return {
      boxShadow: `0 0 ${radius}px rgba(239, 68, 68, ${opacity})`
    }
  }) as AnimatedStyle

  return (
    <AnimatedView
      style={glowStyle}
      className="absolute inset-0 rounded-full pointer-events-none"
      aria-hidden="true"
    >
      <span className="sr-only">Urgent glow effect</span>
    </AnimatedView>
  )
}
