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
import { BottomNavBar } from '@/components/navigation/BottomNavBar'
import { Toaster } from '@/components/ui/sonner'
import { AppHeader } from './AppHeader'
import { AppNavigation } from './AppNavigation'
import { AppMainContent } from './AppMainContent'
import { AppModals } from './AppModals'
import type { Playdate } from '@/lib/playdate-types'
import type { View } from '@/lib/routes'

interface MainAppLayoutProps {
  currentView: View
  setCurrentView: (view: View) => void
  navigation: {
    navigateToView: (view: View) => void
    navigate?: (config: any) => void
    routes?: any
  }
  animations: any
  t: any
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

export function MainAppLayout({
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

