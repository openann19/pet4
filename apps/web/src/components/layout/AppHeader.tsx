/**
 * App Header Component
 * Premium glassmorphic header with logo, navigation buttons, and theme controls
 */

import { Suspense } from 'react'
import { MotionView } from '@petspark/motion'
import { Button } from '@/components/ui/button'
import {
  Heart,
  Sun,
  Moon,
  Palette,
  ShieldCheck,
  Translate,
} from '@phosphor-icons/react'
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator'
import { PremiumNotificationBell } from '@/components/notifications/PremiumNotificationBell'
import { haptics } from '@/lib/haptics'

interface AppHeaderProps {
  animations: {
    headerAnimation: {
      headerStyle: unknown
      shimmerStyle: unknown
    }
    logoButtonHover: {
      scale: unknown
      translateY: unknown
      handleEnter: () => void
      handleLeave: () => void
    }
    logoAnimation: {
      style: unknown
    }
    logoGlow: {
      style: unknown
    }
    headerButtonsContainer: {
      opacity: unknown
      x: unknown
    }
    headerButton1: {
      buttonStyle: unknown
      handleEnter: () => void
      handleLeave: () => void
      handleTap: () => void
    }
    headerButton2: {
      buttonStyle: unknown
      handleEnter: () => void
      handleLeave: () => void
      handleTap: () => void
    }
    headerButton3: {
      buttonStyle: unknown
      handleEnter: () => void
      handleLeave: () => void
      handleTap: () => void
    }
    headerButton4: {
      buttonStyle: unknown
      handleEnter: () => void
      handleLeave: () => void
      handleTap: () => void
    }
    headerButton5: {
      buttonStyle: unknown
      handleEnter: () => void
      handleLeave: () => void
      handleTap: () => void
    }
    headerButton6: {
      buttonStyle: unknown
      handleEnter: () => void
      handleLeave: () => void
      handleTap: () => void
    }
    languageIconRotation: {
      style: unknown
    }
  }
  t: {
    app: {
      title: string
    }
  }
  theme: string
  toggleTheme: () => void
  language: string
  toggleLanguage: () => void
  setShowAdminConsole: (show: boolean) => void
  setShowThemeSettings: (show: boolean) => void
}

export function AppHeader({
  animations,
  t,
  theme,
  toggleTheme,
  language,
  toggleLanguage,
  setShowAdminConsole,
  setShowThemeSettings,
}: AppHeaderProps) {
  return (
    <MotionView
      className="backdrop-blur-2xl bg-card/90 border-b border-border/50 sticky top-0 z-40 shadow-2xl shadow-primary/20"
      animatedStyle={animations.headerAnimation.headerStyle}
    >
      <div className="absolute inset-0 bg-linear-to-r from-primary/8 via-accent/8 to-secondary/8 pointer-events-none" />
      <MotionView
        className="absolute inset-0 bg-linear-to-r from-transparent via-primary/5 to-transparent pointer-events-none"
        animatedStyle={animations.headerAnimation.shimmerStyle}
      >
        <div />
      </MotionView>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <MotionView
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            animatedStyle={{
              scale: animations.logoButtonHover.scale,
              y: animations.logoButtonHover.translateY,
            }}
            onMouseEnter={animations.logoButtonHover.handleEnter}
            onMouseLeave={animations.logoButtonHover.handleLeave}
          >
            <MotionView className="relative" animatedStyle={animations.logoAnimation.style}>
              <MotionView
                className="absolute inset-0 bg-linear-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-xl"
                animatedStyle={animations.logoGlow.style}
              >
                <div />
              </MotionView>
              <Heart
                className="text-primary drop-shadow-2xl relative z-10 group-hover:scale-125 transition-transform duration-300"
                size={24}
                weight="fill"
              />
            </MotionView>
            <h1 className="text-base sm:text-xl font-bold bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient-x drop-shadow-sm">
              {t.app.title}
            </h1>
          </MotionView>
          <MotionView
            className="flex items-center gap-1 sm:gap-2"
            animatedStyle={{
              opacity: animations.headerButtonsContainer.opacity,
              x: animations.headerButtonsContainer.x,
            }}
          >
            <HeaderButton
              animation={animations.headerButton1}
              children={
                <Suspense fallback={<div className="w-9 h-9" />}>
                  <SyncStatusIndicator />
                </Suspense>
              }
            />
            <HeaderButton
              animation={animations.headerButton2}
              children={
                <Suspense fallback={<div className="w-9 h-9" />}>
                  <PremiumNotificationBell />
                </Suspense>
              }
            />
            <HeaderButton
              animation={animations.headerButton3}
              children={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    haptics.trigger('selection')
                    toggleLanguage()
                  }}
                  className="rounded-full h-9 px-3 hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20 flex items-center gap-1.5"
                  aria-label={language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'}
                  aria-pressed={language === 'bg'}
                  title={language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'}
                >
                  <MotionView animatedStyle={animations.languageIconRotation.style}>
                    <Translate size={18} weight="bold" className="text-foreground" />
                  </MotionView>
                  <span className="text-xs font-semibold">{language === 'en' ? 'БГ' : 'EN'}</span>
                </Button>
              }
            />
            <HeaderButton
              animation={animations.headerButton4}
              children={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    haptics.impact('medium')
                    setShowAdminConsole(true)
                  }}
                  className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                  aria-label="Admin Console"
                  title="Admin Console"
                >
                  <ShieldCheck size={20} weight="bold" className="text-foreground" />
                </Button>
              }
            />
            <HeaderButton
              animation={animations.headerButton5}
              children={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    haptics.impact('light')
                    toggleTheme()
                  }}
                  className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? (
                    <Sun size={20} weight="bold" className="text-foreground" />
                  ) : (
                    <Moon size={20} weight="bold" className="text-foreground" />
                  )}
                </Button>
              }
            />
            <HeaderButton
              animation={animations.headerButton6}
              children={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    haptics.impact('medium')
                    setShowThemeSettings(true)
                  }}
                  className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Theme Settings"
                  title="Ultra Theme Settings"
                >
                  <Palette size={20} weight="bold" className="text-foreground" />
                </Button>
              }
            />
          </MotionView>
        </div>
      </div>
    </MotionView>
  )
}

function HeaderButton({
  animation,
  children,
}: {
  animation: {
    buttonStyle: unknown
    handleEnter: () => void
    handleLeave: () => void
    handleTap: () => void
  }
  children: React.ReactNode
}) {
  return (
    <MotionView
      animatedStyle={animation.buttonStyle}
      onMouseEnter={animation.handleEnter}
      onMouseLeave={animation.handleLeave}
      onClick={animation.handleTap}
    >
      {children}
    </MotionView>
  )
}
