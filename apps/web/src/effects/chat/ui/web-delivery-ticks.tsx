'use client'

import React, { useEffect } from 'react'
import {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  MotionView,
} from '@petspark/motion';
import { cn } from '@/lib/utils'
import { useReducedMotion } from '../core/reduced-motion'

type DeliveryState = 'sending' | 'sent' | 'delivered' | 'read'

export interface WebDeliveryTicksProps {
  state: DeliveryState
  className?: string
}

const STATE_PROGRESS: Record<DeliveryState, number> = {
  sending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
}

export function WebDeliveryTicks({ state, className }: WebDeliveryTicksProps): React.ReactElement {
  const progress = useSharedValue(STATE_PROGRESS[state] ?? 0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const target = STATE_PROGRESS[state] ?? 0
    progress.value = withTiming(target, {
      duration: reducedMotion ? 80 : 220,
    })
  }, [progress, reducedMotion, state])

  const containerStyle = useAnimatedStyle(() => {
    const color = interpolateColor(progress.value, [0, 1, 2, 3], ['#9CA3AF', '#9CA3AF', '#10B981', '#3B82F6'])
    return {
      color,
    }
  })

  const firstTickStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5], [0.4, 1])
    return {
      opacity,
    }
  })

  const secondTickStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0.5, 1], [0, 1])
    const translateX = interpolate(progress.value, [1, 2, 3], [4, 6, 8])
    return {
      opacity,
      transform: [{ translateX }],
    }
  })

  return (
    <MotionView
      style={containerStyle}
      className={cn('inline-flex items-center gap-1 text-xs font-medium', className)}
    >
      <MotionView style={firstTickStyle} className="inline-flex">
        <span>✓</span>
      </MotionView>
      <MotionView style={secondTickStyle} className="inline-flex">
        <span>✓</span>
      </MotionView>
    </MotionView>
  );
}

export default WebDeliveryTicks
