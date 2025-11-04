'use client'

import { useTypingIndicator } from './effects/useTypingIndicator'
import { AnimatedView, type AnimatedStyle } from '@/effects/reanimated/animated-view'
import { cn } from '@/lib/utils'

export interface TypingDotsProps {
  dotSize?: number
  dotColor?: string
  className?: string
  enabled?: boolean
}

export function TypingDots({
  dotSize = 6,
  dotColor = '#aaa',
  className,
  enabled = true
}: TypingDotsProps): React.JSX.Element {
  const { dotStyles, containerStyle } = useTypingIndicator({
    enabled,
    dotSize
  })

  return (
    <AnimatedView
      style={containerStyle as AnimatedStyle}
      className={cn('flex items-center gap-1', className)}
    >
      {dotStyles.map((style, index) => (
        <AnimatedView
          key={index}
          style={style as AnimatedStyle}
          className="rounded-full"
        >
          <div style={{ backgroundColor: dotColor }} />
        </AnimatedView>
      ))}
    </AnimatedView>
  )
}

