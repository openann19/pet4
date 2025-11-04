import { useState, useRef, useEffect } from 'react'
import type { PanInfo } from 'framer-motion';
import { motion, AnimatePresence } from 'framer-motion'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'

interface EnhancedCarouselProps {
  items: React.ReactNode[]
  className?: string
  autoPlay?: boolean
  autoPlayInterval?: number
  showControls?: boolean
  showIndicators?: boolean
  loop?: boolean
  onSlideChange?: (index: number) => void
}

export function EnhancedCarousel({
  items,
  className,
  autoPlay = false,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  loop = true,
  onSlideChange,
}: EnhancedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const autoPlayRef = useRef<number | undefined>(undefined)

  const itemCount = items.length

  const goToSlide = (index: number, dir: 'left' | 'right' = 'right') => {
    if (index === currentIndex) return
    
    haptics.impact('light')
    setDirection(dir)
    setCurrentIndex(index)
    onSlideChange?.(index)
  }

  const goToNext = () => {
    const nextIndex = currentIndex === itemCount - 1 ? (loop ? 0 : currentIndex) : currentIndex + 1
    if (nextIndex !== currentIndex) {
      goToSlide(nextIndex, 'right')
    }
  }

  const goToPrev = () => {
    const prevIndex = currentIndex === 0 ? (loop ? itemCount - 1 : currentIndex) : currentIndex - 1
    if (prevIndex !== currentIndex) {
      goToSlide(prevIndex, 'left')
    }
  }

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50
    
    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0) {
        goToPrev()
      } else {
        goToNext()
      }
    }
  }

  useEffect(() => {
    if (autoPlay) {
      autoPlayRef.current = window.setInterval(() => {
        goToNext()
      }, autoPlayInterval)

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current)
        }
      }
    }
    return undefined
  }, [autoPlay, autoPlayInterval, currentIndex])

  const resetAutoPlay = () => {
    if (autoPlay && autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      autoPlayRef.current = window.setInterval(() => {
        goToNext()
      }, autoPlayInterval)
    }
  }

  const variants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? -1000 : 1000,
      opacity: 0,
    }),
  }

  if (itemCount === 0) {
    return null
  }

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      <div className="relative aspect-[4/3] bg-muted">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            onClick={resetAutoPlay}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            {items[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {showControls && itemCount > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              goToPrev()
              resetAutoPlay()
            }}
            disabled={!loop && currentIndex === 0}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background/95 disabled:opacity-0',
              'transition-all duration-200 hover:scale-110 active:scale-95'
            )}
          >
            <CaretLeft size={20} weight="bold" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              goToNext()
              resetAutoPlay()
            }}
            disabled={!loop && currentIndex === itemCount - 1}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background/95 disabled:opacity-0',
              'transition-all duration-200 hover:scale-110 active:scale-95'
            )}
          >
            <CaretRight size={20} weight="bold" />
          </Button>
        </>
      )}

      {showIndicators && itemCount > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                goToSlide(index, index > currentIndex ? 'right' : 'left')
                resetAutoPlay()
              }}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'w-8 bg-primary shadow-lg shadow-primary/50'
                  : 'w-2 bg-background/60 hover:bg-background/80 backdrop-blur-sm'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {itemCount > 1 && (
        <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium shadow-lg">
          {currentIndex + 1} / {itemCount}
        </div>
      )}
    </div>
  )
}
