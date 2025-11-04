import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export type CardVariant = 'glass' | 'gradient' | 'neon' | 'holographic' | 'premium' | 'minimal' | 'floating'
export type CardSize = 'sm' | 'md' | 'lg' | 'xl'

interface AdvancedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant
  size?: CardSize
  children: ReactNode
  enableHover?: boolean
  enableGlow?: boolean
  glowColor?: string
  className?: string
}

const sizeClasses: Record<CardSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
}

const variantClasses: Record<CardVariant, string> = {
  glass: 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl',
  gradient: 'bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 backdrop-blur-sm border border-white/10',
  neon: 'bg-background border-2 border-accent shadow-[0_0_20px_rgba(245,158,11,0.3)]',
  holographic: 'bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 backdrop-blur-md border border-white/30 relative overflow-hidden',
  premium: 'bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl border border-white/40 shadow-2xl',
  minimal: 'bg-card border border-border',
  floating: 'bg-card border border-border shadow-xl',
}

export default function AdvancedCard({
  variant = 'glass',
  size = 'md',
  children,
  enableHover = true,
  enableGlow = false,
  glowColor = 'rgba(245, 158, 11, 0.5)',
  className,
  ...props
}: AdvancedCardProps) {
  const hoverAnimation = enableHover ? {
    scale: 1.02,
    y: -4,
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 }
  } : {}

  const tapAnimation = {
    scale: 0.98,
    transition: { duration: 0.1 }
  }

  return (
    <motion.div
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      className={cn(
        'rounded-2xl transition-all duration-300',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      style={enableGlow ? {
        boxShadow: `0 0 40px ${glowColor}, 0 20px 25px -5px rgba(0, 0, 0, 0.1)`,
      } : undefined}
      {...props}
    >
      {variant === 'holographic' && (
        <motion.div
          className="absolute inset-0 opacity-30 pointer-events-none"
          animate={{
            background: [
              'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
              'linear-gradient(225deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      )}
      
      {children}
    </motion.div>
  )
}
