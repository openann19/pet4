'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TypingDotsWebProps {
  dotSize?: number
  dotColor?: string
  gap?: number
  animationDuration?: number
  className?: string
}

const DEFAULT_DOT_SIZE = 6
const DEFAULT_DOT_COLOR = '#9ca3af'
const DEFAULT_GAP = 4
const DEFAULT_ANIMATION_DURATION = 1.2

export function TypingDotsWeb({
  dotSize = DEFAULT_DOT_SIZE,
  dotColor = DEFAULT_DOT_COLOR,
  gap = DEFAULT_GAP,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  className
}: TypingDotsWebProps): React.JSX.Element {
  return (
    <div className={cn('flex items-center', className)} style={{ gap }}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: dotColor
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            repeat: Infinity,
            duration: animationDuration,
            delay: index * 0.2,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}

