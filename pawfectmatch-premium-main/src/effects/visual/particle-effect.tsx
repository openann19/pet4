import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  duration: number
  delay: number
  rotation: number
  blur: number
}

interface ParticleEffectProps {
  count?: number
  colors?: string[]
  triggerKey?: number
  sizeRange?: [number, number]
  durationRange?: [number, number]
  withGlow?: boolean
  className?: string
}

export function ParticleEffect({
  count = 25,
  colors = ['#F97316', '#F59E0B', '#EF4444', '#EC4899', '#A855F7'],
  triggerKey = 0,
  sizeRange = [4, 16],
  durationRange = [1, 2.5],
  withGlow = true,
  className = ''
}: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (triggerKey === 0) return

    const [minSize, maxSize] = sizeRange
    const [minDuration, maxDuration] = durationRange

    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
      const color = colors[Math.floor(Math.random() * colors.length)] ?? '#F97316'
      return {
        id: i + triggerKey * 1000,
        x: Math.random() * 300 - 150,
        y: Math.random() * -300 - 100,
        size: Math.random() * (maxSize - minSize) + minSize,
        color,
        duration: Math.random() * (maxDuration - minDuration) + minDuration,
        delay: Math.random() * 0.3,
        rotation: Math.random() * 360,
        blur: Math.random() * 2 + 0.5
      }
    })

    setParticles(newParticles)

    const timeout = setTimeout(() => {
      setParticles([])
    }, 3000)

    return () => clearTimeout(timeout)
  }, [triggerKey, count, colors, sizeRange, durationRange])

  return (
    <div className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: withGlow
              ? `0 0 ${particle.size * 1.5}px ${particle.color}`
              : undefined,
            filter: `blur(${particle.blur}px)`
          }}
          initial={{
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0.5,
            rotate: 0
          }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: [0, 1, 0.8, 0],
            scale: [0.5, 1, 1, 0],
            rotate: particle.rotation
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: [0.25, 1, 0.5, 1]
          }}
        />
      ))}
    </div>
  )
}
