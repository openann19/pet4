import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion, type Variants } from '@petspark/motion'
import { Heart, CheckCircle, Translate } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/AppContext'
import { haptics } from '@/lib/haptics'
import { analytics } from '@/lib/analytics'

type WelcomeScreenProps = {
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
  const shouldReduceMotion = useReducedMotion()
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
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
    track(`welcome_${type}_opened`)
  }

  const fadeVariant: Variants = useMemo(
    () =>
      shouldReduceMotion
        ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
        : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
    [shouldReduceMotion]
  )

  const scaleVariant: Variants = useMemo(
    () =>
      shouldReduceMotion
        ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
        : { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } },
    [shouldReduceMotion]
  )

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center" role="status" aria-live="polite">
        <MotionView
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
        >
          <Heart size={32} className="text-white" weight="fill" aria-hidden />
          <span className="sr-only">{t.common.loading}</span>
        </MotionView>
      </div>
    )
  }

  return (
    <main className="fixed inset-0 bg-background overflow-auto">
      <div className="min-h-screen flex flex-col">
        <MotionView
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="absolute top-6 right-6 z-10"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleLanguageToggle}
            className="rounded-full h-11 px-4 border-[1.5px] font-semibold text-sm"
            aria-pressed={language === 'bg'}
            aria-label={language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'}
          >
            <Translate size={20} weight="bold" aria-hidden />
            <span>{language === 'en' ? 'БГ' : 'EN'}</span>
          </Button>
        </MotionView>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <MotionView
              initial="hidden"
              animate="visible"
              variants={scaleVariant}
              transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
              className="flex flex-col items-center mb-12"
            >
              <MotionView
                className="w-20 h-20 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center shadow-2xl mb-6"
                animate={shouldReduceMotion ? {} : {
                  boxShadow: [
                    '0 10px 40px rgba(0,0,0,0.15)',
                    '0 20px 60px rgba(245,158,11,0.3)',
                    '0 10px 40px rgba(0,0,0,0.15)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              >
                <Heart size={40} className="text-white" weight="fill" aria-hidden />
              </MotionView>

              <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-3">
                {t.welcome.title}
              </h1>

              <p className="text-lg text-muted-foreground text-center">
                {t.welcome.subtitle}
              </p>
            </MotionView>

            <MotionView
              initial="hidden"
              animate="visible"
              variants={fadeVariant}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-3 mb-10"
            >
              {[t.welcome.proof1, t.welcome.proof2, t.welcome.proof3].map((text, idx) => (
                <MotionView
                  key={idx}
                  initial="hidden"
                  animate="visible"
                  variants={fadeVariant}
                  transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle size={20} weight="fill" className="text-primary shrink-0" aria-hidden />
                  <span className="text-foreground/80 text-sm">{text}</span>
                </MotionView>
              ))}
            </MotionView>

            {deepLinkMessage && (
              <MotionView
                initial="hidden"
                animate="visible"
                variants={fadeVariant}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20"
                role="note"
              >
                <p className="text-sm text-foreground/70 text-center">
                  {deepLinkMessage}
                </p>
              </MotionView>
            )}

            {!isOnline && (
              <MotionView
                initial="hidden"
                animate="visible"
                variants={fadeVariant}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                role="alert"
                aria-live="polite"
              >
                <p className="text-sm text-destructive text-center">
                  {t.welcome.offlineMessage}
                </p>
              </MotionView>
            )}

            <MotionView
              initial="hidden"
              animate="visible"
              variants={fadeVariant}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="space-y-3"
            >
              <Button
                ref={primaryBtnRef}
                size="lg"
                onClick={handleGetStarted}
                disabled={!isOnline}
                className="w-full text-base font-semibold shadow-lg"
                style={{
                  transform: shouldReduceMotion ? 'none' : undefined
                }}
                onMouseEnter={() => !shouldReduceMotion && haptics.trigger('selection')}
              >
                {t.welcome.getStarted}
              </Button>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSignIn}
                  className="flex-1 h-12 text-sm font-medium"
                >
                  {t.welcome.signIn}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleExplore}
                  className="flex-1 h-12 text-sm font-medium"
                >
                  {t.welcome.explore}
                </Button>
              </div>
            </MotionView>

            <MotionView
              initial="hidden"
              animate="visible"
              variants={fadeVariant}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="mt-8 text-center"
            >
              <p className="text-xs text-muted-foreground">
                {t.welcome.legal}{' '}
                <a
                  href="https://github.com/site/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLegalClick('terms')}
                  className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  {t.welcome.terms}
                </a>
                {' '}{t.welcome.and}{' '}
                <a
                  href="https://github.com/site/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLegalClick('privacy')}
                  className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  {t.welcome.privacy}
                </a>
                .
              </p>
            </MotionView>
          </div>
        </div>
      </div>
    </main>
  )
}
