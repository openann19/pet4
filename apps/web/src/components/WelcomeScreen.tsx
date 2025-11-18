import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Heart, CheckCircle, _Translate, Sun, Moon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/AppContext'
import { haptics } from '@/lib/haptics'
import { analytics } from '@/lib/analytics'
import { motion, type Variants } from '@petspark/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { isTruthy } from '@petspark/shared'
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography'
import { cn } from '@/lib/utils'

interface WelcomeScreenProps {
  onGetStarted: () => void
  onSignIn: () => void
  onExplore: () => void
  isOnline?: boolean
  deepLinkMessage?: string
}

interface FadeInConfig {
  delay?: number
  distance?: number
}

const MOTION_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const createFadeInUpVariants = (shouldReduceMotion: boolean, { delay = 0, distance = 20 }: FadeInConfig = {}): Variants => {
  if (shouldReduceMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0, transition: { duration: 0 } }
    }
  }

  return {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration: 0.35,
        ease: MOTION_EASE
      }
    }
  }
}

const track = (name: string, props?: Record<string, string | number | boolean>) => {
  try {
    analytics.track(name, props)
  } catch {
    // Ignore analytics errors
  }
}

export default function WelcomeScreen({ onGetStarted, onSignIn, onExplore, isOnline = true, deepLinkMessage }: WelcomeScreenProps) {
  const { t, language, setLanguage, theme, setTheme } = useApp()
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

  const handleLanguageSelect = (targetLanguage: 'en' | 'bg') => {
    if (language === targetLanguage) return
    haptics.trigger('selection')
    const from = language || 'en'
    const to = targetLanguage
    track('welcome_language_changed', { from, to })
    void setLanguage(targetLanguage)
  }

  const handleThemeSelect = (nextTheme: 'light' | 'dark') => {
    if (theme === nextTheme) return
    haptics.trigger('light')
    track('welcome_theme_toggled', { from: theme, to: nextTheme })
    setTheme(nextTheme)
  }

  const handleLegalClick = (type: 'terms' | 'privacy') => {
    track(`welcome_${String(type ?? '')}_opened`)
  }

  // Animation variants using Framer Motion
  const shouldReduceMotion = useReducedMotion()

  const loadingVariants = useMemo<Variants>(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: MOTION_EASE }
    }
  }), [shouldReduceMotion])

  const languageButtonVariants = useMemo<Variants>(() => (
    createFadeInUpVariants(shouldReduceMotion, { delay: 0.05, distance: 8 })
  ), [shouldReduceMotion])

  const logoVariants = useMemo<Variants>(() => ({
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
            opacity: { duration: 0.4, ease: MOTION_EASE },
            scale: { duration: 0.45, ease: MOTION_EASE },
            y: { duration: 0.45, ease: MOTION_EASE }
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
  }), [shouldReduceMotion])

  const titleVariants = useMemo<Variants>(() => (
    createFadeInUpVariants(shouldReduceMotion, { delay: 0.1, distance: 24 })
  ), [shouldReduceMotion])

  const proofItemsVariants = useMemo<Variants>(() => (
    createFadeInUpVariants(shouldReduceMotion, { delay: 0.18 })
  ), [shouldReduceMotion])

  const deepLinkVariants = useMemo<Variants>(() => (
    createFadeInUpVariants(shouldReduceMotion, { delay: 0.24 })
  ), [shouldReduceMotion])

  const offlineVariants = useMemo<Variants>(() => (
    createFadeInUpVariants(shouldReduceMotion, { delay: 0.24 })
  ), [shouldReduceMotion])

  const buttonsVariants = useMemo<Variants>(() => (
    createFadeInUpVariants(shouldReduceMotion, { delay: 0.28 })
  ), [shouldReduceMotion])

  const legalVariants = useMemo<Variants>(() => (
    createFadeInUpVariants(shouldReduceMotion, { delay: 0.34 })
  ), [shouldReduceMotion])

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
          className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent shadow-lg shadow-primary/30"
        >
          <Heart size={32} className="text-primary-foreground" weight="fill" aria-hidden="true" />
          <span className="sr-only">{t.common.loading}</span>
        </motion.div>
      </div>
    )
  }

  return (
    <main 
      className="fixed inset-0 bg-background overflow-auto"
      aria-label="Welcome screen"
    >
      <div className="min-h-screen flex flex-col">
        <nav 
          className="absolute top-6 right-6 z-10"
          aria-label="Theme and language settings"
        >
          <motion.div
            variants={languageButtonVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-2 rounded-full border border-border/40 bg-card/90 px-3 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.25)] backdrop-blur supports-backdrop-filter:bg-card/70"
          >
            <div className="flex items-center gap-1" role="group" aria-label="Theme selection">
              {[
                { value: 'light', label: 'Light', Icon: Sun },
                { value: 'dark', label: 'Dark', Icon: Moon }
              ].map(({ value, label, Icon }) => {
                const isActive = theme === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleThemeSelect(value as 'light' | 'dark')}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                      isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-pressed={isActive}
                    aria-label={`Switch to ${label.toLowerCase()} mode`}
                  >
                    <Icon size={16} weight="bold" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>

            <span className="h-5 w-px bg-border/60" aria-hidden="true" />

            <div className="flex items-center gap-1" role="group" aria-label="Language selection">
              {[
                { value: 'en', label: 'EN' },
                { value: 'bg', label: 'БГ' }
              ].map(({ value, label }) => {
                const isActive = language === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleLanguageSelect(value as 'en' | 'bg')}
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                      isActive ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-pressed={isActive}
                    aria-label={value === 'en' ? 'Switch to English' : 'Превключи на български'}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
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
                  'flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary via-accent to-secondary shadow-2xl shadow-primary/40',
                  getSpacingClassesFromConfig({ marginY: 'xl' })
                )}
                aria-hidden="true"
              >
                <Heart size={40} className="text-primary-foreground" weight="fill" aria-hidden="true" />
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
                onClick={() => void handleGetStarted()}
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
                  onClick={() => void handleSignIn()}
                  className="flex-1 rounded-xl"
                  onMouseEnter={() => !shouldReduceMotion && haptics.trigger('selection')}
                  aria-label="Sign in to your account"
                >
                  {t.welcome.signIn}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => void handleExplore()}
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
                  className="rounded underline text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                  className="rounded underline text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
