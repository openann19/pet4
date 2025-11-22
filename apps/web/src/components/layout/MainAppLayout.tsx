/**
 * Main App Layout Component
 * Wraps the main app view with all layout components
 */

import { Suspense } from 'react'
import HoloBackground from '@/components/chrome/HoloBackground'
import GlowTrail from '@/effects/cursor/GlowTrail'
import { AmbientAuroraBackground, ScrollProgressBar, PageChangeFlash } from '@/effects/ultra-web-overlays'
import SeedDataInitializer from '@/components/SeedDataInitializer'
import { BillingIssueBanner } from '@/components/payments/BillingIssueBanner'
import QuickActionsMenu from '@/components/QuickActionsMenu'
import BottomNavBar from '@/components/navigation/BottomNavBar'
import { Toaster } from '@/components/ui/sonner'
import { AppHeader } from './AppHeader'
import { AppNavigation } from './AppNavigation'
import { AppMainContent } from './AppMainContent'
import { AppModals } from './AppModals'
import type { Playdate } from '@/lib/playdate-types'
import type { View } from '@/lib/routes'
import type { UseNavigationReturn } from '@/hooks/use-navigation'
import type { MotionStyle, MotionValue } from '@petspark/motion'

interface MainAppLayoutAnimations {
  headerAnimation: {
    headerStyle: MotionStyle
    shimmerStyle: MotionStyle
  }
  logoButtonHover: {
    scale: MotionValue<number>
    translateY: MotionValue<number>
    handleEnter: () => void
    handleLeave: () => void
  }
  logoAnimation: {
    style: MotionStyle
  }
  logoGlow: {
    style: MotionStyle
  }
  headerButtonsContainer: {
    opacity: MotionValue<number>
    x: MotionValue<number>
  }
  headerButton1: {
    buttonStyle: MotionStyle
    handleEnter: () => void
    handleLeave: () => void
    handleTap: () => void
  }
  headerButton2: {
    buttonStyle: MotionStyle
    handleEnter: () => void
    handleLeave: () => void
    handleTap: () => void
  }
  headerButton3: {
    buttonStyle: MotionStyle
    handleEnter: () => void
    handleLeave: () => void
    handleTap: () => void
  }
  headerButton4: {
    buttonStyle: MotionStyle
    handleEnter: () => void
    handleLeave: () => void
    handleTap: () => void
  }
  headerButton5: {
    buttonStyle: MotionStyle
    handleEnter: () => void
    handleLeave: () => void
    handleTap: () => void
  }
  headerButton6: {
    buttonStyle: MotionStyle
    handleEnter: () => void
    handleLeave: () => void
    handleTap: () => void
  }
  languageIconRotation: {
    style: MotionStyle
  }
  loadingTransition: {
    style: MotionStyle
  }
  pageTransition: {
    style: MotionStyle
  }
  generateProfilesModal: {
    opacity: MotionValue<number>
    scale: MotionValue<number>
    y: MotionValue<number>
  }
  generateProfilesContent: {
    opacity: MotionValue<number>
    scale: MotionValue<number>
    y: MotionValue<number>
  }
  statsModal: {
    opacity: MotionValue<number>
    scale: MotionValue<number>
    y: MotionValue<number>
  }
  statsContent: {
    opacity: MotionValue<number>
    scale: MotionValue<number>
    y: MotionValue<number>
  }
  mapModal: {
    opacity: MotionValue<number>
    scale: MotionValue<number>
    y: MotionValue<number>
  }
  mapContent: {
    opacity: MotionValue<number>
    scale: MotionValue<number>
    y: MotionValue<number>
  }
  adminModal: {
    opacity: MotionValue<number>
    scale: MotionValue<number>
    y: MotionValue<number>
  }
  adminContent: {
    style: MotionStyle
  }
  themeContent: {
    style: MotionStyle
  }
  closeButtonBounce: {
    scale: MotionValue<number>
  }
  navBarAnimation: {
    navStyle: MotionStyle
    shimmerStyle: MotionStyle
  }
  lostFoundAnimation: {
    scale: MotionValue<number>
    translateY: MotionValue<number>
    iconScale: MotionValue<number>
    iconRotation: MotionValue<number>
    indicatorOpacity: MotionValue<number>
    indicatorWidth: MotionValue<number>
    handleHover: () => void
    handleLeave: () => void
    handlePress: () => void
  }
}

interface MainAppLayoutProps {
  currentView: View
  setCurrentView: (view: View) => void
  navigation: UseNavigationReturn
  animations: MainAppLayoutAnimations
  t: {
    app: {
      title: string
    }
    nav: {
      discover: string
      matches: string
      chat: string
      community?: string
      adoption?: string
      'lost-found'?: string
      profile: string
    }
  }
  theme: string
  toggleTheme: () => void
  language: string
  toggleLanguage: () => void
  showGenerateProfiles: boolean
  showStats: boolean
  showMap: boolean
  showAdminConsole: boolean
  showThemeSettings: boolean
  setShowGenerateProfiles: (show: boolean) => void
  setShowStats: (show: boolean) => void
  setShowMap: (show: boolean) => void
  setShowAdminConsole: (show: boolean) => void
  setShowThemeSettings: (show: boolean) => void
  totalMatches: number
  totalSwipes: number
  successRate: number
  playdates: Playdate[]
  NAV_BUTTON_BASE_CLASSES: string
}

export default function MainAppLayout({
  currentView,
  setCurrentView,
  navigation,
  animations,
  t,
  theme,
  toggleTheme,
  language,
  toggleLanguage,
  showGenerateProfiles,
  showStats,
  showMap,
  showAdminConsole,
  showThemeSettings,
  setShowGenerateProfiles,
  setShowStats,
  setShowMap,
  setShowAdminConsole,
  setShowThemeSettings,
  totalMatches,
  totalSwipes,
  successRate,
  playdates,
  NAV_BUTTON_BASE_CLASSES,
}: MainAppLayoutProps) {
  return (
    <div className="min-h-screen pb-20 sm:pb-24 bg-background text-foreground relative overflow-hidden">
      <HoloBackground intensity={0.6} />
      <GlowTrail />
      <AmbientAuroraBackground intensity={0.35} className="hidden md:block" />
      <PageChangeFlash key={currentView} />
      <ScrollProgressBar />

      <Suspense fallback={null}>
        <SeedDataInitializer />
      </Suspense>

      <AppHeader
        animations={animations}
        t={t}
        theme={theme}
        toggleTheme={toggleTheme}
        language={language}
        toggleLanguage={toggleLanguage}
        setShowAdminConsole={setShowAdminConsole}
        setShowThemeSettings={setShowThemeSettings}
      />

      <Suspense fallback={null}>
        <BillingIssueBanner />
      </Suspense>

      <AppMainContent currentView={currentView} navigation={navigation} animations={animations} />

      <AppNavigation
        currentView={currentView}
        setCurrentView={setCurrentView}
        animations={animations}
        t={t}
        NAV_BUTTON_BASE_CLASSES={NAV_BUTTON_BASE_CLASSES}
      />

      <Suspense fallback={null}>
        <QuickActionsMenu
          onCreatePet={() => {
            setCurrentView('profile')
          }}
          onViewHealth={() => {
            setCurrentView('profile')
          }}
          onSchedulePlaydate={() => {
            setCurrentView('matches')
          }}
          onSavedSearches={() => {
            setCurrentView('discover')
          }}
          onGenerateProfiles={() => {
            setShowGenerateProfiles(true)
          }}
          onViewStats={() => {
            setShowStats(true)
          }}
          onViewMap={() => {
            setShowMap(true)
          }}
        />
      </Suspense>

      <AppModals
        showGenerateProfiles={showGenerateProfiles}
        showStats={showStats}
        showMap={showMap}
        showAdminConsole={showAdminConsole}
        showThemeSettings={showThemeSettings}
        setShowGenerateProfiles={setShowGenerateProfiles}
        setShowStats={setShowStats}
        setShowMap={setShowMap}
        setShowAdminConsole={setShowAdminConsole}
        setShowThemeSettings={setShowThemeSettings}
        animations={animations}
        totalMatches={totalMatches}
        totalSwipes={totalSwipes}
        successRate={successRate}
        playdates={playdates}
      />

      <Toaster />
      <Suspense fallback={null}>
        <BottomNavBar />
      </Suspense>
    </div>
  )
}
