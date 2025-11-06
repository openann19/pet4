import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface EnhancedCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'elevated' | 'gradient'
  hover?: boolean
  glow?: boolean
}

export default function EnhancedCard({ 
  children, 
  className, 
  variant = 'default',
  hover = true,
  glow = false 
}: EnhancedCardProps) {
  const variantStyles = {
    default: 'bg-card',
    glass: 'glass-effect',
    elevated: 'card-elevated bg-card',
    gradient: 'gradient-card'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      {...(hover ? {
        whileHover: { 
          y: -4,
          transition: { duration: 0.2 } 
        }
      } : {})}
    >
      <Card 
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          variantStyles[variant],
          glow && 'glow-primary',
          className
        )}
      >
        {variant === 'gradient' && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        )}
        <div className="relative z-10">
          {children}
        </div>
      </Card>
    </MotionView>
  )
}
