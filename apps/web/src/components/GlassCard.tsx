import { cn } from '@/lib/utils';
import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  intensity?: 'light' | 'medium' | 'strong'
  enableHover?: boolean
  className?: string
}

const intensityClasses = {
  light: 'bg-white/5 backdrop-blur-sm border-white/10',
  medium: 'bg-white/10 backdrop-blur-md border-white/20',
  strong: 'bg-white/20 backdrop-blur-xl border-white/30',
}

export default function GlassCard({
  children,
  intensity = 'medium',
  enableHover = true,
  className,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      {...(enableHover ? {
        whileHover: {
          scale: 1.02,
          y: -6,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          transition: { type: 'spring', stiffness: 400, damping: 20 }
        }
      } : {})}
      className={cn(
        'rounded-3xl border shadow-xl transition-all duration-300',
        intensityClasses[intensity],
        className
      )}
      {...props}
    >
      <div className="relative overflow-hidden rounded-3xl">
        {children}
      </div>
    </MotionView>
  )
}
