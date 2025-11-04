import { useState, useEffect, lazy, Suspense, useMemo } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useStorage } from '@/hooks/useStorage'
import { Toaster } from '@/components/ui/sonner'
import { Heart, User, ChatCircle, Sparkle, Moon, Sun, Users, Translate, ShieldCheck } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { butterySmoothTransition, smoothPageTransition } from '@/effects/animations'
import SeedDataInitializer from '@/components/SeedDataInitializer'
import WelcomeScreen from '@/components/WelcomeScreen'
import AuthScreen from '@/components/AuthScreen'
import AdminConsole from '@/components/AdminConsole'
import LoadingState from '@/components/LoadingState'
import { BillingIssueBanner } from '@/components/payments/BillingIssueBanner'
import { PremiumNotificationBell } from '@/components/notifications/PremiumNotificationBell'
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator'
import QuickActionsMenu from '@/components/QuickActionsMenu'
import GenerateProfilesButton from '@/components/GenerateProfilesButton'
import StatsCard from '@/components/StatsCard'
import PetsDemoPage from '@/components/demo/PetsDemoPage'
import '@/lib/profile-generator-helper' // Expose generateProfiles to window
import type { Pet, Match, SwipeAction } from '@/lib/types'
import type { Playdate } from '@/lib/playdate-types'
import { useApp } from '@/contexts/AppContext'
import { haptics } from '@/lib/haptics'

const DiscoverView = lazy(() => import('@/components/views/DiscoverView'))
const MatchesView = lazy(() => import('@/components/views/MatchesView'))
const ProfileView = lazy(() => import('@/components/views/ProfileView'))
const ChatView = lazy(() => import('@/components/views/ChatView'))
const CommunityView = lazy(() => import('@/components/views/CommunityView'))
const AdoptionView = lazy(() => import('@/components/views/AdoptionView'))
const PlaydateMap = lazy(() => import('@/components/playdate/PlaydateMap'))

type View = 'discover' | 'matches' | 'chat' | 'community' | 'profile' | 'adoption' | 'admin'
type AppState = 'welcome' | 'auth' | 'main'

function App() {
  const NAV_BUTTON_BASE_CLASSES = 'flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px] sm:min-w-[70px]'
  
  const [currentView, setCurrentView] = useState<View>('discover')
  const [appState, setAppState] = useState<AppState>('welcome')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const { t, theme, toggleTheme, language, toggleLanguage } = useApp()
  const [hasSeenWelcome, setHasSeenWelcome] = useStorage<boolean>('has-seen-welcome-v2', false)
  const [isAuthenticated] = useStorage<boolean>('is-authenticated', false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [_userPets] = useStorage<Pet[]>('user-pets', [])
  const [matches] = useStorage<Match[]>('matches', [])
  const [swipeHistory] = useStorage<SwipeAction[]>('swipe-history', [])
  const [playdates] = useStorage<Playdate[]>('playdates', [])
  const [showGenerateProfiles, setShowGenerateProfiles] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [showAdminConsole, setShowAdminConsole] = useState(false)

  // Memoize computed values to prevent unnecessary re-renders
  const totalMatches = useMemo(() => 
    Array.isArray(matches) ? matches.filter(m => m.status === 'active').length : 0,
    [matches]
  )
  const totalSwipes = useMemo(() => 
    Array.isArray(swipeHistory) ? swipeHistory.length : 0,
    [swipeHistory]
  )
  const likeCount = useMemo(() => 
    Array.isArray(swipeHistory) ? swipeHistory.filter(s => s.action === 'like').length : 0,
    [swipeHistory]
  )
  const successRate = useMemo(() => 
    likeCount > 0 ? Math.round((totalMatches / likeCount) * 100) : 0,
    [likeCount, totalMatches]
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (hasSeenWelcome && isAuthenticated) {
      setAppState('main')
    } else if (hasSeenWelcome) {
      setAppState('auth')
    } else {
      setAppState('welcome')
    }
  }, [hasSeenWelcome, isAuthenticated])

  const handleWelcomeGetStarted = () => {
    setHasSeenWelcome(true)
    setAuthMode('signup')
    setAppState('auth')
  }

  const handleWelcomeSignIn = () => {
    setHasSeenWelcome(true)
    setAuthMode('signin')
    setAppState('auth')
  }

  const handleWelcomeExplore = () => {
    setHasSeenWelcome(true)
    setAppState('main')
  }

  const handleAuthSuccess = () => {
    setAppState('main')
  }

  const handleAuthBack = () => {
    setAppState('welcome')
  }

  return (
    <Routes>
      <Route path="/demo/pets" element={<PetsDemoPage />} />
      <Route path="*" element={
        <>
          {appState === 'welcome' && (
            <WelcomeScreen 
              onGetStarted={handleWelcomeGetStarted}
              onSignIn={handleWelcomeSignIn}
              onExplore={handleWelcomeExplore}
              isOnline={isOnline} 
            />
          )}
          {appState === 'auth' && (
            <AuthScreen
              initialMode={authMode}
              onBack={handleAuthBack}
              onSuccess={handleAuthSuccess}
            />
          )}
          {appState === 'main' && (
    <div className="min-h-screen pb-20 sm:pb-24 bg-background text-foreground relative overflow-hidden">
      {/* Ultra-premium ambient background with layered animated gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Floating particles - reduced count for performance */}
        {typeof window !== 'undefined' && Array.from({ length: 8 }).map((_, i) => {
          const width = window.innerWidth || 1920
          const height = window.innerHeight || 1080
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/20 blur-sm"
              style={{ willChange: 'transform', transform: 'translateZ(0)' }}
              initial={{
                x: Math.random() * width,
                y: Math.random() * height,
                opacity: 0,
              }}
              animate={{
                x: [
                  Math.random() * width,
                  Math.random() * width,
                  Math.random() * width,
                ],
                y: [
                  Math.random() * height,
                  Math.random() * height,
                  Math.random() * height,
                ],
                opacity: [0, 0.6, 0.3, 0.6, 0],
                scale: [0.5, 1, 0.8, 1, 0.5],
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 5,
              }}
            />
          )
        })}
        <motion.div 
          className="absolute top-0 left-1/4 w-[900px] h-[900px] bg-gradient-radial from-primary/18 via-primary/10 to-transparent rounded-full filter blur-[150px]"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 0.9, 0.6],
            x: [0, 100, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1]
          }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-[900px] h-[900px] bg-gradient-radial from-accent/18 via-accent/10 to-transparent rounded-full filter blur-[150px]"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0.8, 0.5],
            x: [0, -100, 0],
            y: [0, -60, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1],
            delay: 1.5
          }}
        />
        <motion.div 
          className="absolute top-1/3 right-1/3 w-[800px] h-[800px] bg-gradient-radial from-secondary/15 via-secondary/8 to-transparent rounded-full filter blur-[130px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute top-2/3 left-1/3 w-[700px] h-[700px] bg-gradient-conic from-primary/12 via-accent/12 to-secondary/12 rounded-full filter blur-[110px]"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "linear",
            delay: 2.5
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-gradient-radial from-lavender/12 via-lavender/6 to-transparent rounded-full filter blur-[120px]"
          animate={{
            scale: [1, 1.25],
            opacity: [0.3, 0.6],
            x: [-50, 50],
            y: [-50, 50],
          }}
          transition={{
            type: 'tween',
            duration: 16,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: [0.45, 0, 0.55, 1],
            delay: 4
          }}
        />
      </div>
      
      <SeedDataInitializer />
      
      {/* Ultra-premium glassmorphic header with layered effects */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
        className="backdrop-blur-2xl bg-card/90 border-b border-border/50 sticky top-0 z-40 shadow-2xl shadow-primary/20"
      >
        <div className="absolute inset-0 bg-linear-to-r from-primary/8 via-accent/8 to-secondary/8 pointer-events-none" />
        <motion.div 
          className="absolute inset-0 bg-linear-to-r from-transparent via-primary/5 to-transparent pointer-events-none"
          animate={{
            x: ['-100%', '100%'],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <motion.div 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
              whileHover={{ scale: 1.06, x: 5 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <motion.div
                className="relative"
                animate={{ 
                  scale: [1, 1.12, 1],
                }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: [0.45, 0, 0.55, 1]
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-xl"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <Heart className="text-primary drop-shadow-2xl relative z-10 group-hover:scale-125 transition-transform duration-300" size={24} weight="fill" />
              </motion.div>
              <h1 className="text-base sm:text-xl font-bold bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient-x drop-shadow-sm">
                {t.app.title}
              </h1>
            </motion.div>
            <motion.div 
              className="flex items-center gap-1 sm:gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, staggerChildren: 0.1 }}
            >
              <motion.div 
                whileHover={{ scale: 1.12, y: -3, rotate: -5 }} 
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.3 }}
              >
                <SyncStatusIndicator />
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.12, y: -3, rotate: -5 }} 
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.35 }}
              >
                <PremiumNotificationBell />
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.1, y: -2, rotate: -3 }} 
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.4 }}
              >
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
                  <motion.div
                    animate={{ rotate: language === 'bg' ? [0, 360] : 0 }}
                    transition={butterySmoothTransition}
                  >
                    <Translate size={18} weight="bold" className="text-foreground" />
                  </motion.div>
                  <motion.span 
                    className="text-xs font-semibold"
                    key={language}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                  >
                    {language === 'en' ? 'БГ' : 'EN'}
                  </motion.span>
                </Button>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.12, y: -3, rotate: -5 }} 
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.45 }}
              >
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
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.12, y: -3, rotate: -5 }} 
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.5 }}
              >
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
                  <motion.div
                    initial={false}
                    animate={{ 
                      rotate: theme === 'dark' ? 0 : 180,
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 0.5, ease: "easeInOut" },
                      scale: { duration: 0.3 }
                    }}
                  >
                    {theme === 'dark' ? (
                      <Sun size={20} weight="bold" className="text-foreground" />
                    ) : (
                      <Moon size={20} weight="bold" className="text-foreground" />
                    )}
                  </motion.div>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <BillingIssueBanner />

      {/* Enhanced main content with premium transitions */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 relative z-10">
        <Suspense fallback={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingState />
          </motion.div>
        }>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ 
                opacity: 0, 
                y: 30, 
                scale: 0.98
              }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: smoothPageTransition
              }}
              exit={{ 
                opacity: 0, 
                y: -30, 
                scale: 0.98,
                transition: {
                  duration: 0.3,
                  ease: [0.4, 0, 1, 1]
                }
              }}
            >
              {currentView === 'discover' && <DiscoverView />}
              {currentView === 'matches' && <MatchesView onNavigateToChat={() => setCurrentView('chat')} />}
              {currentView === 'chat' && <ChatView />}
              {currentView === 'community' && <CommunityView />}
              {currentView === 'adoption' && <AdoptionView />}
              {currentView === 'profile' && <ProfileView />}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>

      <motion.nav 
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ 
                ...butterySmoothTransition,
                delay: 0.2,
                scale: { duration: 0.3 }
              }}
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-2xl border-t border-border/50 z-40 shadow-2xl shadow-primary/20 safe-area-inset-bottom"
      >
        <div className="absolute inset-0 bg-linear-to-t from-primary/8 via-accent/4 to-transparent pointer-events-none" />
        <motion.div 
          className="absolute inset-0 bg-linear-to-r from-transparent via-accent/5 to-transparent pointer-events-none"
          animate={{
            x: ['-100%', '100%'],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
            delay: 1,
          }}
        />
        <div className="max-w-7xl mx-auto px-1 sm:px-2 relative">
          <div className="flex items-center justify-around py-2 sm:py-3 gap-1">
            <motion.button
              layout
              onClick={() => {
                haptics.impact('light')
                setCurrentView('discover')
              }}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.92 }}
              className={`${NAV_BUTTON_BASE_CLASSES} ${
                currentView === 'discover'
                  ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <motion.div
                animate={currentView === 'discover' ? { 
                  scale: [1, 1.25],
                  rotate: [0, 10, -10, 0]
                } : {}}
                transition={{
                  scale: {
                    type: 'tween',
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: [0.4, 0, 0.2, 1]
                  },
                  rotate: {
                    type: 'tween',
                    duration: 1.2,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.2, 1]
                  }
                }}
              >
                <Sparkle size={22} weight={currentView === 'discover' ? 'fill' : 'regular'} />
              </motion.div>
              <span className="text-[10px] sm:text-xs font-semibold leading-tight">{t.nav.discover}</span>
              {currentView === 'discover' && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
                  initial={{ width: 0 }}
                  animate={{ width: '2rem' }}
                  transition={butterySmoothTransition}
                />
              )}
            </motion.button>

            <motion.button
              layout
              onClick={() => {
                haptics.impact('light')
                setCurrentView('matches')
              }}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.92 }}
              className={`${NAV_BUTTON_BASE_CLASSES} ${
                currentView === 'matches'
                  ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <motion.div
                animate={currentView === 'matches' ? { 
                  scale: [1, 1.3],
                } : {}}
                transition={{
                  type: 'tween',
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                <Heart size={22} weight={currentView === 'matches' ? 'fill' : 'regular'} />
              </motion.div>
              <span className="text-[10px] sm:text-xs font-semibold leading-tight">{t.nav.matches}</span>
              {currentView === 'matches' && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
                  initial={{ width: 0 }}
                  animate={{ width: '2rem' }}
                  transition={butterySmoothTransition}
                />
              )}
            </motion.button>

            <motion.button
              layout
              onClick={() => {
                haptics.impact('light')
                setCurrentView('chat')
              }}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.92 }}
              className={`${NAV_BUTTON_BASE_CLASSES} ${
                currentView === 'chat'
                  ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <motion.div
                animate={currentView === 'chat' ? { 
                  scale: [1, 1.3],
                } : {}}
                transition={{
                  type: 'tween',
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                <ChatCircle size={22} weight={currentView === 'chat' ? 'fill' : 'regular'} />
              </motion.div>
              <span className="text-[10px] sm:text-xs font-semibold leading-tight">{t.nav.chat}</span>
              {currentView === 'chat' && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
                  initial={{ width: 0 }}
                  animate={{ width: '2rem' }}
                  transition={butterySmoothTransition}
                />
              )}
            </motion.button>

            <motion.button
              layout
              onClick={() => {
                haptics.impact('light')
                setCurrentView('community')
              }}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.92 }}
              className={`${NAV_BUTTON_BASE_CLASSES} ${
                currentView === 'community'
                  ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <motion.div
                animate={currentView === 'community' ? { 
                  scale: [1, 1.3],
                } : {}}
                transition={{
                  type: 'tween',
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                <Users size={22} weight={currentView === 'community' ? 'fill' : 'regular'} />
              </motion.div>
              <span className="text-[10px] sm:text-xs font-semibold leading-tight">{t.nav.community || 'Community'}</span>
              {currentView === 'community' && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
                  initial={{ width: 0 }}
                  animate={{ width: '2rem' }}
                  transition={butterySmoothTransition}
                />
              )}
            </motion.button>

            <motion.button
              layout
              onClick={() => {
                haptics.impact('light')
                setCurrentView('adoption')
              }}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.92 }}
              className={`${NAV_BUTTON_BASE_CLASSES} ${
                currentView === 'adoption'
                  ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <motion.div
                animate={currentView === 'adoption' ? { 
                  scale: [1, 1.3],
                } : {}}
                transition={{
                  type: 'tween',
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                <Heart size={22} weight={currentView === 'adoption' ? 'fill' : 'duotone'} />
              </motion.div>
              <span className="text-[10px] sm:text-xs font-semibold leading-tight">{t.nav.adoption || 'Adopt'}</span>
              {currentView === 'adoption' && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
                  initial={{ width: 0 }}
                  animate={{ width: '2rem' }}
                  transition={butterySmoothTransition}
                />
              )}
            </motion.button>

            <motion.button
              layout
              onClick={() => {
                haptics.impact('light')
                setCurrentView('profile')
              }}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.92 }}
              className={`${NAV_BUTTON_BASE_CLASSES} ${
                currentView === 'profile'
                  ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <motion.div
                animate={currentView === 'profile' ? { 
                  scale: [1, 1.3],
                } : {}}
                transition={{
                  type: 'tween',
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                <User size={22} weight={currentView === 'profile' ? 'fill' : 'regular'} />
              </motion.div>
              <span className="text-[10px] sm:text-xs font-semibold leading-tight">{t.nav.profile}</span>
              {currentView === 'profile' && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
                  initial={{ width: 0 }}
                  animate={{ width: '2rem' }}
                  transition={butterySmoothTransition}
                />
              )}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <QuickActionsMenu
        onCreatePet={() => setCurrentView('profile')}
        onViewHealth={() => setCurrentView('profile')}
        onSchedulePlaydate={() => setCurrentView('matches')}
        onSavedSearches={() => setCurrentView('discover')}
        onGenerateProfiles={() => setShowGenerateProfiles(true)}
        onViewStats={() => setShowStats(true)}
        onViewMap={() => setShowMap(true)}
      />

      <AnimatePresence>
        {showGenerateProfiles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowGenerateProfiles(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.3
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card p-6 rounded-2xl shadow-2xl max-w-md w-full border border-border/50"
            >
              <GenerateProfilesButton />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setShowGenerateProfiles(false)}
                >
                  Close
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStats && totalSwipes > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowStats(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.4
              }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <StatsCard
                  totalMatches={totalMatches}
                  totalSwipes={totalSwipes}
                  successRate={successRate}
                />
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setShowStats(false)}
                >
                  Close
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50"
          >
            <Suspense fallback={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <LoadingState />
              </motion.div>
            }>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  duration: 0.4
                }}
                className="h-full w-full"
              >
                <PlaydateMap
                  playdates={playdates || []}
                  onClose={() => setShowMap(false)}
                />
              </motion.div>
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminConsole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.4
              }}
              className="h-full w-full"
            >
              <AdminConsole onClose={() => setShowAdminConsole(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster />
    </div>
          )}
        </>
      } />
    </Routes>
  )
}

export default App