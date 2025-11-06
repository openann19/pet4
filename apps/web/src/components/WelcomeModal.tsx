import { useState, useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { motion } from '@petspark/motion'
import { Heart, Sparkle, PawPrint, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useApp } from '@/contexts/AppContext'

export default function WelcomeModal() {
  const { t } = useApp()
  const [hasSeenWelcome, setHasSeenWelcome] = useStorage<boolean>('has-seen-welcome', false)
  const [open, setOpen] = useState(false)
  const [_step, _setStep] = useState(0)

  useEffect(() => {
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setOpen(true)
      }, 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [hasSeenWelcome])

  const handleClose = () => {
    setHasSeenWelcome(true)
    setOpen(false)
  }

  const features = [
    {
      icon: PawPrint,
      title: t.welcome.proof1,
      description: 'AI-powered matching algorithm finds perfect companions for your pet',
      color: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
    },
    {
      icon: Sparkle,
      title: t.welcome.proof2,
      description: 'Secure messaging platform to connect with other pet owners',
      color: 'from-accent/20 to-accent/5',
      iconColor: 'text-accent',
    },
    {
      icon: Heart,
      title: t.welcome.proof3,
      description: 'Join thousands of verified pet owners in our community',
      color: 'from-secondary/20 to-secondary/5',
      iconColor: 'text-secondary',
    },
  ]

  if (hasSeenWelcome) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-0">
        <MotionView 
          className="relative bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 p-8 md:p-12 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <MotionView
            className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
          />
          
          <MotionView as="button"
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10 shadow-md"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={16} />
          </MotionView>

          <MotionView
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10"
          >
            <MotionView
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
            >
              <Heart size={40} className="text-white" weight="fill" />
            </MotionView>
            <MotionView
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </MotionView>

          <MotionView
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-center mb-4 relative z-10"
          >
            {t.welcome.title} 🐾
          </MotionView>

          <MotionView
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center text-muted-foreground text-lg mb-8 max-w-xl mx-auto relative z-10"
          >
            {t.welcome.subtitle}
          </MotionView>

          <div className="grid md:grid-cols-3 gap-6 mb-8 relative z-10">
            {features.map((feature, idx) => (
              <MotionView
                key={feature.title}
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.15, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="text-center"
              >
                <MotionView 
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <feature.icon size={32} className={feature.iconColor} weight="fill" />
                </MotionView>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </MotionView>
            ))}
          </div>

          <MotionView
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex justify-center relative z-10"
          >
            <MotionView whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                onClick={handleClose} 
                className="px-8 shadow-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {t.welcome.getStarted}
                <MotionText
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="ml-2"
                >
                  →
                </MotionText>
              </Button>
            </MotionView>
          </MotionView>
        </MotionView>
      </DialogContent>
    </Dialog>
  )
}
