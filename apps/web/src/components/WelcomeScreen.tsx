import React, { useEffect, useRef, useState } from 'react'
import { Heart, CheckCircle, Translate } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/AppContext'
import { haptics } from '@/lib/haptics'
import { analytics } from '@/lib/analytics'
import { motion, type Variants } from '@petspark/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { isTruthy } from '@petspark/shared'
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography'
import { getAriaButtonAttributes } from '@/lib/accessibility'
import { cn } from '@/lib/utils'

interface WelcomeScreenProps {
  onGetStarted: () => void
  onSignIn: () => void
  onExplore: () => void
  isOnline?: boolean
  deepLinkMessage?: string
}

const track = (name: string, props?: Record<string, string | number | boolean>) => {
  try {
    analytics.track(name, props)
  } catch {
    // Ignore analytics errors
  }
}

export default function WelcomeScreen({ onGetStarted, onSignIn, onExplore, isOnline = true, deepLinkMessage }: WelcomeScreenProps) {
  const { t, language, toggleLanguage: _toggleLanguage } = useApp()
  const [isLoading, setIsLoading] = useState(true)
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => { setIsLoading(false); }, 300)
    return () => { clearTimeout(timer); }
  }, [])

  useEffect(() => {
    track('welcome_viewed')
  }, [])

  useEffect(() => {
    if (!isOnline) track('welcome_offline_state_shown')
  }, [isOnline])

  useEffect(() => {
    if (!isLoading) primaryBtnRef.current?.focus()
  }, [isLoading])

  const handleGetStarted = () => {
    if (!isOnline) return
    haptics.trigger('light')
    track('welcome_get_started_clicked')
    onGetStarted()
  }

  const handleSignIn = () => {
    haptics.trigger('light')
    track('welcome_sign_in_clicked')
    onSignIn()
  }

  const handleExplore = () => {
    haptics.trigger('light')
    track('welcome_explore_clicked')
    onExplore()
  }

  const handleLanguageToggle = () => {
    haptics.trigger('selection')
    const from = language || 'en'
    const to = language === 'en' ? 'bg' : 'en'
    track('welcome_language_changed', { from, to })
  }

  const handleLegalClick = (type: 'terms' | 'privacy') => {
    track(`welcome_${String(type ?? '')}_opened`)
  }

  // Animation variants using Framer Motion
  const shouldReduceMotion = useReducedMotion()
  
  const loadingVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  }

  const languageButtonVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } }
  }

  const logoVariants: Variants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: shouldReduceMotion 
        ? { duration: 0 }
        : { 
            opacity: { duration: 0.5 },
            scale: { type: 'spring', damping: 20, stiffness: 300 },
            y: { type: 'spring', damping: 20, stiffness: 300 }
          }
    },
    pulsing: {
      boxShadow: [
        '0 10px 40px rgba(0,0,0,0.15)',
        '0 20px 60px rgba(0,0,0,0.3)',
        '0 10px 40px rgba(0,0,0,0.15)'
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: 'reverse' as const
      }
    }
  }

  const titleVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            delay: 0.2,
            opacity: { duration: 0.5 },
            y: { type: 'spring', damping: 20, stiffness: 300, delay: 0.2 }
          }
    }
  }

  const proofItemsVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            delay: 0.3,
            opacity: { duration: 0.4 },
            y: { type: 'spring', damping: 20, stiffness: 300, delay: 0.3 }
          }
    }
  }

  const deepLinkVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            delay: 0.6,
            opacity: { duration: 0.4 },
            y: { type: 'spring', damping: 20, stiffness: 300, delay: 0.6 }
          }
    }
  }

  const offlineVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            delay: 0.6,
            opacity: { duration: 0.4 },
            y: { type: 'spring', damping: 20, stiffness: 300, delay: 0.6 }
          }
    }
  }

  const buttonsVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            delay: 0.7,
            opacity: { duration: 0.5 },
            y: { type: 'spring', damping: 20, stiffness: 300, delay: 0.7 }
          }
    }
  }

  const legalVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            delay: 0.9,
            opacity: { duration: 0.5 },
            y: { type: 'spring', damping: 20, stiffness: 300, delay: 0.9 }
          }
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { setIsLoading(false); }, 300)
    return () => { clearTimeout(timer); }
  }, [])

  useEffect(() => {
    track('welcome_viewed')
  }, [])

  useEffect(() => {
    if (!isOnline) track('welcome_offline_state_shown')
  }, [isOnline])

  useEffect(() => {
    if (!isLoading) primaryBtnRef.current?.focus()
  }, [isLoading])

  if (isTruthy(isLoading)) {
    return (
      <div 
        className={cn(
          'fixed inset-0 bg-background flex items-center justify-center',
          getSpacingClassesFromConfig({ padding: 'xl' })
        )}
        role="status" 
        aria-live="polite"
        aria-label="Loading application"
      >                                           
        <motion.div
          variants={loadingVariants}
          initial="hidden"
          animate="visible"
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"                                          
        >
          <Heart size={32} className="text-white" weight="fill" aria-hidden="true" />
          <span className="sr-only">{t.common.loading}</span>
        </motion.div>
      </div>
    )
  }

  const languageButtonAria = getAriaButtonAttributes({
    label: language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English',
    pressed: language === 'bg',
  });

  return (
    <main 
      className="fixed inset-0 bg-background overflow-auto"
      aria-label="Welcome screen"
    >
      <div className="min-h-screen flex flex-col">
        <nav 
          className={cn(
            'absolute z-10',
            getSpacingClassesFromConfig({ marginY: 'xl', marginX: 'xl' })
          )}
          aria-label="Language selection"
        >
          <motion.div
            variants={languageButtonVariants}
            initial="hidden"
            animate="visible"
            className="top-6 right-6"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleLanguageToggle}
              className={cn(
                'rounded-full gap-2'
              )}
              {...languageButtonAria}
            >
              <Translate size={20} weight="bold" aria-hidden="true" />
              <span>{language === 'en' ? 'БГ' : 'EN'}</span>
            </Button>
          </motion.div>
        </nav>

        <div className={cn(
          'flex-1 flex items-center justify-center',
          getSpacingClassesFromConfig({ paddingX: 'xl', paddingY: '2xl' })
        )}>
          <div className="w-full max-w-md">
            <motion.div
              variants={titleVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                'flex flex-col items-center',
                getSpacingClassesFromConfig({ marginY: '2xl' })
              )}
            >
              <motion.div
                variants={logoVariants}
                initial="hidden"
                animate={shouldReduceMotion ? "visible" : ["visible", "pulsing"]}
                className={cn(
                  'w-20 h-20 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center shadow-2xl',
                  getSpacingClassesFromConfig({ marginY: 'xl' })
                )}
                aria-hidden="true"
              >
                <Heart size={40} className="text-white" weight="fill" aria-hidden="true" />                                                                            
              </motion.div>

              <h1 className={cn(
                getTypographyClasses('h1'),
                'text-center text-foreground',
                getSpacingClassesFromConfig({ marginY: 'md' })
              )}>
                {t.welcome.title}
              </h1>

              <p className={cn(
                getTypographyClasses('body'),
                'text-muted-foreground text-center'
              )}>
                {t.welcome.subtitle}
              </p>
            </motion.div>

            <motion.div
              variants={proofItemsVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                getSpacingClassesFromConfig({ spaceY: 'md', marginY: 'xl' })
              )}
              role="list"
              aria-label="Key features"
            >
              {[t.welcome.proof1, t.welcome.proof2, t.welcome.proof3].map((text, idx) => (                                                                      
                <div
                  key={idx}
                  className={cn(
                    'flex items-center',
                    getSpacingClassesFromConfig({ gap: 'md' })
                  )}
                  role="listitem"
                >
                  <CheckCircle size={20} weight="fill" className="text-primary shrink-0" aria-hidden="true" />                                                         
                  <span className={cn(
                    getTypographyClasses('caption'),
                    'text-foreground/80'
                  )}>
                    {text}
                  </span>
                </div>
              ))}
            </motion.div>

            {deepLinkMessage && (
              <motion.div
                variants={deepLinkVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                  'rounded-lg bg-primary/10 border border-primary/20',
                  getSpacingClassesFromConfig({ marginY: 'xl', padding: 'md' })
                )}
                role="note"
                aria-label="Deep link information"
              >
                <p className={cn(
                  getTypographyClasses('caption'),
                  'text-foreground/70 text-center'
                )}>
                  {deepLinkMessage}
                </p>
              </motion.div>
            )}

            {!isOnline && (
              <motion.div
                variants={offlineVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                  'rounded-lg bg-destructive/10 border border-destructive/20',
                  getSpacingClassesFromConfig({ marginY: 'xl', padding: 'md' })
                )}
                role="alert"
                aria-live="polite"
                aria-label="Offline status"
              >
                <p className={cn(
                  getTypographyClasses('caption'),
                  'text-destructive text-center'
                )}>
                  {t.welcome.offlineMessage}
                </p>
              </motion.div>
            )}

            <motion.div
              variants={buttonsVariants}
              initial="hidden"
              animate="visible"
              className={getSpacingClassesFromConfig({ spaceY: 'md' })}
              role="group"
              aria-label="Action buttons"
            >
              <Button
                ref={primaryBtnRef}
                variant="default"
                size="lg"
                onClick={handleGetStarted}
                disabled={!isOnline}
                className="w-full rounded-xl"
                onMouseEnter={() => !shouldReduceMotion && haptics.trigger('selection')}
                aria-label="Get started with PawfectMatch"
              >
                {t.welcome.getStarted}
              </Button>

              <div className={cn(
                'flex flex-col sm:flex-row',
                getSpacingClassesFromConfig({ gap: 'sm' })
              )}>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSignIn}
                  className="flex-1 rounded-xl"
                  onMouseEnter={() => !shouldReduceMotion && haptics.trigger('selection')}
                  aria-label="Sign in to your account"
                >
                  {t.welcome.signIn}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleExplore}
                  className="flex-1 rounded-xl"
                  onMouseEnter={() => !shouldReduceMotion && haptics.trigger('selection')}
                  aria-label="Explore PawfectMatch"
                >
                  {t.welcome.explore}
                </Button>
              </div>
            </motion.div>

            <motion.div
              variants={legalVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                'text-center',
                getSpacingClassesFromConfig({ marginY: 'xl' })
              )}
            >
              <p className={getTypographyClasses('caption')}>
                {t.welcome.legal}{' '}
                <a
                  href="https://github.com/site/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { handleLegalClick('terms'); }}
                  className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded underline"
                  aria-label="Terms of Service"                       
                >
                  {t.welcome.terms}
                </a>
                {' '}{t.welcome.and}{' '}
                <a
                  href="https://github.com/site/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { handleLegalClick('privacy'); }}
                  className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded underline"
                  aria-label="Privacy Policy"                       
                >
                  {t.welcome.privacy}
                </a>
                .
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}
