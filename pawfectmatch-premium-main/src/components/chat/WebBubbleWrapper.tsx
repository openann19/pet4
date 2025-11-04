'use client'

import { type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TypingDotsWeb } from './TypingDotsWeb'

export interface WebBubbleWrapperProps {
  children: ReactNode
  isIncoming?: boolean
  index?: number
  onClick?: () => void
  onLongPress?: () => void
  hasReaction?: boolean
  reactionEmoji?: string
  showTyping?: boolean
  className?: string
  bubbleClassName?: string
  enable3DTilt?: boolean
  enableSwipeReply?: boolean
  staggerDelay?: number
}

const DEFAULT_STAGGER_DELAY = 0.04
const TILT_SENSITIVITY = 50

export function WebBubbleWrapper({
  children,
  isIncoming = false,
  index = 0,
  onClick,
  onLongPress,
  hasReaction = false,
  reactionEmoji = '❤️',
  showTyping = false,
  className,
  bubbleClassName,
  enable3DTilt = true,
  staggerDelay = DEFAULT_STAGGER_DELAY
}: WebBubbleWrapperProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-TILT_SENSITIVITY, TILT_SENSITIVITY], [10, -10])
  const rotateY = useTransform(x, [-TILT_SENSITIVITY, TILT_SENSITIVITY], [-10, 10])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enable3DTilt) return
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left - rect.width / 2
    const offsetY = e.clientY - rect.top - rect.height / 2
    x.set(offsetX)
    y.set(offsetY)
  }

  const handleMouseLeave = () => {
    if (!enable3DTilt) return
    animate(x, 0, { duration: 0.3 })
    animate(y, 0, { duration: 0.3 })
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onLongPress) {
      onLongPress()
    }
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className={cn('relative', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * staggerDelay,
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
      style={enable3DTilt ? { rotateX, rotateY, transformStyle: 'preserve-3d' as const } : undefined}
    >
      <motion.div
        className={cn(
          'relative max-w-[85%] rounded-2xl px-4 py-2 shadow-lg transition-all duration-200',
          isIncoming
            ? 'bg-neutral-800 text-white self-start rounded-bl-sm'
            : 'bg-blue-600 text-white self-end rounded-br-sm',
          bubbleClassName
        )}
        style={{
          alignSelf: isIncoming ? 'flex-start' : 'flex-end'
        }}
        whileHover={enable3DTilt ? { scale: 1.02 } : undefined}
        whileTap={{ scale: 0.98 }}
      >
        {showTyping ? (
          <TypingDotsWeb
            dotColor={isIncoming ? '#9ca3af' : '#ffffff'}
            dotSize={6}
          />
        ) : (
          children
        )}
      </motion.div>
      {hasReaction && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 15,
            delay: 0.1
          }}
          className="absolute -bottom-4 -right-2 text-base pointer-events-none"
        >
          {reactionEmoji}
        </motion.div>
      )}
    </motion.div>
  )
}

