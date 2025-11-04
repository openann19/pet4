import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface EnhancedCardProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function EnhancedCard({ children, className = '', delay = 0 }: EnhancedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.4, 0, 0.2, 1] 
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface FloatingActionButtonProps {
  onClick: () => void
  icon: ReactNode
  label?: string
  className?: string
}

export function FloatingActionButton({ onClick, icon, label, className = '' }: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-24 right-6 z-50 h-14 flex items-center gap-3 bg-gradient-to-r from-primary to-accent text-white px-6 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)' }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 20,
        delay: 0.2
      }}
    >
      <span className="text-xl">{icon}</span>
      {label && <span className="font-semibold text-sm">{label}</span>}
    </motion.button>
  )
}

interface PulseIndicatorProps {
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PulseIndicator({ color = 'bg-primary', size = 'md' }: PulseIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <div className="relative inline-flex">
      <motion.div
        className={`${sizeClasses[size]} ${color} rounded-full`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      <motion.div
        className={`absolute inset-0 ${color} rounded-full opacity-30`}
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut'
        }}
      />
    </div>
  )
}

interface GradientTextProps {
  children: ReactNode
  className?: string
  from?: string
  via?: string
  to?: string
}

export function GradientText({ 
  children, 
  className = '', 
  from = 'from-primary', 
  via = 'via-accent', 
  to = 'to-secondary' 
}: GradientTextProps) {
  return (
    <span className={`bg-gradient-to-r ${from} ${via} ${to} bg-clip-text text-transparent font-bold ${className}`}>
      {children}
    </span>
  )
}

interface ShimmerProps {
  children: ReactNode
  className?: string
}

export function Shimmer({ children, className = '' }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatDelay: 1
        }}
        style={{ pointerEvents: 'none' }}
      />
    </div>
  )
}

interface CounterBadgeProps {
  count: number
  max?: number
  variant?: 'primary' | 'secondary' | 'accent'
}

export function CounterBadge({ count, max = 99, variant = 'primary' }: CounterBadgeProps) {
  const displayCount = count > max ? `${max}+` : count
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground'
  }

  if (count === 0) return null

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={`absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${variantClasses[variant]}`}
    >
      {displayCount}
    </motion.div>
  )
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export function LoadingDots({ size = 'md', color = 'bg-primary' }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizeClasses[size]} ${color} rounded-full`}
          animate={{
            y: [0, -8, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}

interface GlowingBorderProps {
  children: ReactNode
  className?: string
  glowColor?: string
}

export function GlowingBorder({ children, className = '', glowColor = 'primary' }: GlowingBorderProps) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`absolute -inset-[1px] bg-gradient-to-r from-${glowColor} via-accent to-${glowColor} rounded-inherit opacity-0`}
        whileHover={{ opacity: 0.5 }}
        transition={{ duration: 0.3 }}
        style={{ filter: 'blur(4px)' }}
      />
      <div className="relative bg-card rounded-inherit">
        {children}
      </div>
    </div>
  )
}
