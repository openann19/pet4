import { useState } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { Button } from '@/components/ui/button'
import { Sparkle, Plus } from '@phosphor-icons/react'
import { motion } from '@petspark/motion'
import { toast } from 'sonner'
import { generateSamplePets } from '@/lib/seedData'
import type { Pet } from '@/lib/types'
import { haptics } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'

interface GenerateProfilesButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  showLabel?: boolean
}

export default function GenerateProfilesButton({ 
  variant = 'default', 
  size = 'default',
  showLabel = true 
}: GenerateProfilesButtonProps) {
  const [_allPets, setAllPets] = useStorage<Pet[]>('all-pets', [])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateProfiles = async () => {
    if (isGenerating) return
    
    setIsGenerating(true)
    haptics.trigger('selection')
    
    try {
      const newPets = await generateSamplePets(15)
      setAllPets((current) => [...(current || []), ...newPets])
      
      haptics.trigger('success')
      toast.success('Profiles Generated!', {
        description: `${newPets.length} new pet profiles added to discovery`,
      })
    } catch (error) {
      const logger = createLogger('GenerateProfilesButton')
      logger.error('Failed to generate profiles', error instanceof Error ? error : new Error(String(error)))
      haptics.trigger('error')
      toast.error('Error', {
        description: 'Failed to generate new profiles. Please try again.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <MotionView
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={showLabel ? 'w-full' : ''}
    >
      <Button
        onClick={handleGenerateProfiles}
        disabled={isGenerating}
        variant={variant}
        size={size}
        className={showLabel 
          ? "w-full h-12 bg-gradient-to-r from-primary via-accent to-secondary hover:from-primary/90 hover:via-accent/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
          : "relative overflow-hidden"
        }
      >
        {showLabel && (
          <MotionView
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: isGenerating ? ['-100%', '200%'] : '-100%',
            }}
            transition={{ 
              duration: 1.5, 
              repeat: isGenerating ? Infinity : 0, 
              ease: 'linear' 
            }}
          />
        )}
        <MotionView
          animate={isGenerating ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className={showLabel ? "mr-2" : ""}
        >
          {isGenerating ? (
            <Sparkle size={20} weight="fill" />
          ) : (
            <Plus size={20} weight="bold" />
          )}
        </MotionView>
        {showLabel && (
          <span className="relative z-10 font-semibold">
            {isGenerating ? 'Generating Profiles...' : 'Generate More Profiles'}
          </span>
        )}
      </Button>
    </MotionView>
  )
}
