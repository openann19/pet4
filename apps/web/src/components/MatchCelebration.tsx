import { useEffect } from 'react'
import { motion, Presence } from '@petspark/motion'
import { Heart, Sparkle } from '@phosphor-icons/react'

interface MatchCelebrationProps {
  show: boolean
  petName1: string
  petName2: string
  onComplete: () => void
}

export default function MatchCelebration({ show, petName1, petName2, onComplete }: MatchCelebrationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete()
      }, 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [show, onComplete])

  const particles = Array.from({ length: 20 }, (_, i) => i)

  return (
    <Presence>
      {show && (
        <MotionView
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <MotionView
            className="absolute inset-0 glass-strong backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {particles.map((i) => {
            const angle = (i / particles.length) * Math.PI * 2
            const distance = 180 + Math.random() * 120
            const x = Math.cos(angle) * distance
            const y = Math.sin(angle) * distance
            
            return (
              <MotionView
                key={i}
                className="absolute"
                initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x,
                  y,
                  scale: [0, 1.5, 0],
                  opacity: [1, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.02,
                  ease: 'easeOut',
                }}
              >
                {i % 2 === 0 ? (
                  <Heart size={24} weight="fill" className="text-primary drop-shadow-2xl" />
                ) : (
                  <Sparkle size={20} weight="fill" className="text-accent drop-shadow-2xl" />
                )}
              </MotionView>
            )
          })}

          <MotionView
            className="relative z-10 rounded-3xl glass-strong premium-shadow border-2 border-white/40 p-10 max-w-md mx-4 backdrop-blur-2xl overflow-hidden"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <MotionView
              className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            />
            
            <MotionView
              animate={{ scale: [1, 1.3, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
              className="text-center mb-6 relative z-10"
            >
              <div className="inline-block p-4 rounded-full glass-strong border-2 border-white/50 shadow-2xl">
                <Heart size={72} weight="fill" className="text-white drop-shadow-2xl" />
              </div>
            </MotionView>

            <MotionView
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white text-center mb-3 drop-shadow-2xl relative z-10"
            >
              It's a Match! 🎉
            </MotionView>

            <MotionView
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/95 text-center text-xl font-medium drop-shadow-lg relative z-10"
            >
              {petName1} and {petName2} are now connected!
            </MotionView>

            <MotionView
              className="mt-8 flex items-center justify-center gap-5 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <MotionView
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkle size={32} weight="fill" className="text-white drop-shadow-2xl" />
              </MotionView>
              <div className="text-white font-bold text-lg drop-shadow-lg">Perfect Companions!</div>
              <MotionView
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkle size={32} weight="fill" className="text-white drop-shadow-2xl" />
              </MotionView>
            </MotionView>
          </MotionView>
        </MotionView>
      )}
    </Presence>
  )
}
