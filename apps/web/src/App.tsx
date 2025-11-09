import { lazy, Suspense, useState, useMemo, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  Heart,
  Translate,
  ShieldCheck,
  Sun,
  Moon,
  Palette,
  Sparkle,
  ChatCircle,
  Users,
  User,
  MapPin,
} from '@phosphor-icons/react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import LoadingState from '@/components/LoadingState';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useBounceOnTap,
  useHeaderAnimation,
  useHeaderButtonAnimation,
  useHoverLift,
  useIconRotation,
  useLogoAnimation,
  useLogoGlow,
  useModalAnimation,
  useNavBarAnimation,
  usePageTransition,
  useStaggeredContainer,
} from '@/effects/reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useNavButtonAnimation } from '@/hooks/use-nav-button-animation';
import { useStorage } from '@/hooks/use-storage';
import { haptics } from '@/lib/haptics';
import type { Playdate } from '@/lib/playdate-types';
import '@/lib/profile-generator-helper'; // Expose generateProfiles to window
import type { Match, SwipeAction } from '@/lib/types';
import HoloBackground from '@/components/chrome/HoloBackground';
import GlowTrail from '@/effects/cursor/GlowTrail';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/sonner';
import { NavButton } from '@/components/navigation/NavButton';

type View = 'discover' | 'matches' | 'chat' | 'community' | 'adoption' | 'lost-found' | 'profile';

// Helper function to create lazy loader for named exports
function createLazyNamed<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<Record<string, T>>,
  exportName: string
) {
  return lazy(async () => {
    const module = await importFn();
    const Component = module[exportName];
    if (!Component) {
      throw new Error(`Component ${exportName} not found in module`);
    }
    return { default: Component };
  });
}

// Route components - lazy loaded
const DiscoverView = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/views/DiscoverView')
);
const MatchesView = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/views/MatchesView')
);
const ProfileView = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/views/ProfileView')
);
const ChatView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/ChatView'));
const CommunityView = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/views/CommunityView')
);
const AdoptionView = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/views/AdoptionView')
);
const LostFoundView = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/views/LostFoundView')
);
const PlaydateMap = lazy(
  () => import(/* webpackPrefetch: true */ '@/components/playdate/PlaydateMap')
);

// Modal components - lazy loaded
const AdminConsole = lazy(() => import('@/components/AdminConsole'));
const AuthScreen = lazy(() => import('@/components/AuthScreen'));
const PetsDemoPage = lazy(() => import('@/components/demo/PetsDemoPage'));
const GenerateProfilesButton = lazy(() => import('@/components/GenerateProfilesButton'));
const PremiumNotificationBell = createLazyNamed(
  () => import('@/components/notifications/PremiumNotificationBell'),
  'PremiumNotificationBell'
);
const UltraThemeSettings = createLazyNamed(
  () => import('@/components/settings/UltraThemeSettings'),
  'UltraThemeSettings'
);
const StatsCard = lazy(() => import('@/components/StatsCard'));
const SyncStatusIndicator = createLazyNamed(
  () => import('@/components/SyncStatusIndicator'),
  'SyncStatusIndicator'
);
const WelcomeScreen = lazy(() => import('@/components/WelcomeScreen'));
const QuickActionsMenu = lazy(() => import('@/components/QuickActionsMenu'));
const BottomNavBar = lazy(() => import('@/components/navigation/BottomNavBar'));
const BillingIssueBanner = createLazyNamed(
  () => import('@/components/payments/BillingIssueBanner'),
  'BillingIssueBanner'
);
const InstallPrompt = createLazyNamed(
  () => import('@/components/pwa/InstallPrompt'),
  'InstallPrompt'
);
const SeedDataInitializer = lazy(() => import('@/components/SeedDataInitializer'));
const OfflineIndicator = createLazyNamed(
  () => import('@/components/network/OfflineIndicator'),
  'OfflineIndicator'
);
type AppState = 'welcome' | 'auth' | 'main';

function App(): JSX.Element {
  const NAV_BUTTON_BASE_CLASSES =
    'flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px] sm:min-w-[70px]';

  const [currentView, setCurrentView] = useState<View>('discover');
  const [appState, setAppState] = useState<AppState>('welcome');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const { t, theme, toggleTheme, language, toggleLanguage } = useApp();
  const { isAuthenticated } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = useStorage<boolean>('has-seen-welcome-v2', false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // User pets available via useStorage if needed: useStorage<Pet[]>('user-pets', [])
  const [matches] = useStorage<Match[]>('matches', []);
  const [swipeHistory] = useStorage<SwipeAction[]>('swipe-history', []);
  const [playdates] = useStorage<Playdate[]>('playdates', []);
  const [showGenerateProfiles, setShowGenerateProfiles] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showAdminConsole, setShowAdminConsole] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);

  // Reanimated navigation button animation for Lost & Found
  const lostFoundAnimation = useNavButtonAnimation({
    isActive: currentView === 'lost-found',
    enablePulse: true,
    enableRotation: true,
    hapticFeedback: true,
  });

  // Logo animations
  const logoAnimation = useLogoAnimation();
  const logoGlow = useLogoGlow();

  // Header button hover animations
  const logoButtonHover = useHoverLift({ scale: 1.06 });

  // Header button animations
  const headerButtonsContainer = useStaggeredContainer({ delay: 0.2 });
  const headerButton1 = useHeaderButtonAnimation({
    delay: 0.3,
    scale: 1.12,
    translateY: -3,
    rotation: -5,
  });
  const headerButton2 = useHeaderButtonAnimation({
    delay: 0.35,
    scale: 1.12,
    translateY: -3,
    rotation: -5,
  });
  const headerButton3 = useHeaderButtonAnimation({
    delay: 0.4,
    scale: 1.1,
    translateY: -2,
    rotation: -3,
  });
  const headerButton4 = useHeaderButtonAnimation({
    delay: 0.45,
    scale: 1.12,
    translateY: -3,
    rotation: -5,
  });
  const headerButton5 = useHeaderButtonAnimation({
    delay: 0.5,
    scale: 1.12,
    translateY: -3,
    rotation: -5,
  });
  const headerButton6 = useHeaderButtonAnimation({
    delay: 0.55,
    scale: 1.12,
    translateY: -3,
    rotation: -5,
  });

  // Language button icon rotation
  const languageIconRotation = useIconRotation({ enabled: language === 'bg', targetRotation: 360 });

  // Page transition animation
  const pageTransition = usePageTransition({
    isVisible: true,
    direction: 'up',
  });
  const loadingTransition = usePageTransition({
    isVisible: true,
    direction: 'fade',
    duration: 300,
  });

  // Modal animations
  const generateProfilesModal = useModalAnimation({
    isVisible: showGenerateProfiles,
    duration: 200,
  });
  const generateProfilesContent = useModalAnimation({
    isVisible: showGenerateProfiles,
    duration: 300,
  });
  const statsModal = useModalAnimation({ isVisible: showStats, duration: 200 });
  const statsContent = useModalAnimation({ isVisible: showStats, duration: 300 });
  const mapModal = useModalAnimation({ isVisible: showMap, duration: 200 });
  const mapContent = useModalAnimation({ isVisible: showMap, duration: 300 });
  const adminModal = useModalAnimation({ isVisible: showAdminConsole, duration: 200 });
  const adminContent = useModalAnimation({ isVisible: showAdminConsole, duration: 300 });
  const themeContent = useModalAnimation({ isVisible: showThemeSettings, duration: 300 });

  // Reanimated animations for main app
  const headerAnimation = useHeaderAnimation({ delay: 0.1 });
  const navBarAnimation = useNavBarAnimation({ delay: 0.2 });

  // Button animations
  const closeButtonBounce = useBounceOnTap({ hapticFeedback: true });

  // Memoize computed values to prevent unnecessary re-renders
  const totalMatches = useMemo(
    () => (Array.isArray(matches) ? matches.filter((m) => m.status === 'active').length : 0),
    [matches]
  );
  const totalSwipes = useMemo(
    () => (Array.isArray(swipeHistory) ? swipeHistory.length : 0),
    [swipeHistory]
  );
  const likeCount = useMemo(
    () =>
      Array.isArray(swipeHistory) ? swipeHistory.filter((s) => s.action === 'like').length : 0,
    [swipeHistory]
  );
  const successRate = useMemo(
    () => (likeCount > 0 ? Math.round((totalMatches / likeCount) * 100) : 0),
    [likeCount, totalMatches]
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Initialize performance monitoring in production
    if (import.meta.env['NODE_ENV'] === 'production') {
      void (async () => {
        try {
          const [{ initPerformanceMonitoring }, { createLogger }] = await Promise.all([
            import('@/lib/monitoring/performance'),
            import('@/lib/logger')
          ]);
          const logger = createLogger('PerformanceMonitoring');
          initPerformanceMonitoring((metric) => {
            // Log performance metrics (could send to analytics service)
            if (metric.rating === 'poor') {
              logger.warn(`Poor ${metric.name}: ${metric.value}ms`, { metric });
            }
          });
        } catch {
          // Silently fail performance monitoring initialization
          // Error is intentionally swallowed as monitoring is non-critical
        }
      })();
    }
  }, []);

  useEffect(() => {
    if (hasSeenWelcome && isAuthenticated) {
      setAppState('main');
    } else if (hasSeenWelcome) {
      setAppState('auth');
    } else {
      setAppState('welcome');
    }
  }, [hasSeenWelcome, isAuthenticated]);

  const handleWelcomeGetStarted = () => {
    void setHasSeenWelcome(true);
    setAuthMode('signup');
    setAppState('auth');
  };

  const handleWelcomeSignIn = () => {
    void setHasSeenWelcome(true);
    setAuthMode('signin');
    setAppState('auth');
  };

  const handleWelcomeExplore = () => {
    void setHasSeenWelcome(true);
    setAppState('main');
  };

  const handleAuthSuccess = () => {
    setAppState('main');
  };

  const handleAuthBack = () => {
    setAppState('welcome');
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingState />}>
        <OfflineIndicator />
      </Suspense>
      <Suspense fallback={null}>
        <InstallPrompt />
      </Suspense>
      <Routes>
        <Route
          path="/demo/pets"
          element={
            <Suspense fallback={<LoadingState />}>
              <PetsDemoPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <>
              {appState === 'welcome' && (
                <Suspense fallback={<LoadingState />}>
                  <WelcomeScreen
                    onGetStarted={handleWelcomeGetStarted}
                    onSignIn={handleWelcomeSignIn}
                    onExplore={handleWelcomeExplore}
                    isOnline={isOnline}
                  />
                </Suspense>
              )}
              {appState === 'auth' && (
                <Suspense fallback={<LoadingState />}>
                  <AuthScreen
                    initialMode={authMode}
                    onBack={handleAuthBack}
                    onSuccess={handleAuthSuccess}
                  />
                </Suspense>
              )}
              {appState === 'main' && (
                <div className="min-h-screen pb-20 sm:pb-24 bg-background text-foreground relative overflow-hidden">
                  {/* Ultra-premium ambient background with layered animated gradients */}
                  <HoloBackground intensity={0.6} />
                  <GlowTrail />

                  <Suspense fallback={null}>
                    <SeedDataInitializer />
                  </Suspense>

                  {/* Ultra-premium glassmorphic header with layered effects */}
                  <AnimatedView
                    className="backdrop-blur-2xl bg-card/90 border-b border-border/50 sticky top-0 z-40 shadow-2xl shadow-primary/20"
                    style={headerAnimation.headerStyle}
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-primary/8 via-accent/8 to-secondary/8 pointer-events-none" />
                    <AnimatedView
                      className="absolute inset-0 bg-linear-to-r from-transparent via-primary/5 to-transparent pointer-events-none"
                      style={headerAnimation.shimmerStyle}
                    >
                      <div />
                    </AnimatedView>
                    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative">
                      <div className="flex items-center justify-between h-14 sm:h-16">
                        <AnimatedView
                          className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
                          style={logoButtonHover.animatedStyle}
                          onMouseEnter={logoButtonHover.handleEnter}
                          onMouseLeave={logoButtonHover.handleLeave}
                        >
                          <AnimatedView className="relative" style={logoAnimation.style}>
                            <AnimatedView
                              className="absolute inset-0 bg-linear-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-xl"
                              style={logoGlow.style}
                            >
                              <div />
                            </AnimatedView>
                            <Heart
                              className="text-primary drop-shadow-2xl relative z-10 group-hover:scale-125 transition-transform duration-300"
                              size={24}
                              weight="fill"
                            />
                          </AnimatedView>
                          <h1 className="text-base sm:text-xl font-bold bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient-x drop-shadow-sm">
                            {t.app.title}
                          </h1>
                        </AnimatedView>
                        <AnimatedView
                          className="flex items-center gap-1 sm:gap-2"
                          style={headerButtonsContainer.containerStyle}
                        >
                          <AnimatedView
                            style={headerButton1.buttonStyle}
                            onMouseEnter={headerButton1.handleEnter}
                            onMouseLeave={headerButton1.handleLeave}
                            onClick={headerButton1.handleTap}
                          >
                            <Suspense fallback={<div className="w-9 h-9" />}>
                              <SyncStatusIndicator />
                            </Suspense>
                          </AnimatedView>
                          <AnimatedView
                            style={headerButton2.buttonStyle}
                            onMouseEnter={headerButton2.handleEnter}
                            onMouseLeave={headerButton2.handleLeave}
                            onClick={headerButton2.handleTap}
                          >
                            <Suspense fallback={<div className="w-9 h-9" />}>
                              <PremiumNotificationBell />
                            </Suspense>
                          </AnimatedView>
                          <AnimatedView
                            style={headerButton3.buttonStyle}
                            onMouseEnter={headerButton3.handleEnter}
                            onMouseLeave={headerButton3.handleLeave}
                            onClick={headerButton3.handleTap}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                haptics.trigger('selection');
                                toggleLanguage();
                              }}
                              className="rounded-full h-9 px-3 hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20 flex items-center gap-1.5"
                              aria-label={
                                language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'
                              }
                              aria-pressed={language === 'bg'}
                              title={
                                language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'
                              }
                            >
                              <AnimatedView style={languageIconRotation.style}>
                                <Translate size={18} weight="bold" className="text-foreground" />
                              </AnimatedView>
                              <span className="text-xs font-semibold">
                                {language === 'en' ? 'БГ' : 'EN'}
                              </span>
                            </Button>
                          </AnimatedView>
                          <AnimatedView
                            style={headerButton4.buttonStyle}
                            onMouseEnter={headerButton4.handleEnter}
                            onMouseLeave={headerButton4.handleLeave}
                            onClick={headerButton4.handleTap}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                haptics.impact('medium');
                                setShowAdminConsole(true);
                              }}
                              className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                              aria-label="Admin Console"
                              title="Admin Console"
                            >
                              <ShieldCheck size={20} weight="bold" className="text-foreground" />
                            </Button>
                          </AnimatedView>
                          <AnimatedView
                            style={headerButton5.buttonStyle}
                            onMouseEnter={headerButton5.handleEnter}
                            onMouseLeave={headerButton5.handleLeave}
                            onClick={headerButton5.handleTap}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                haptics.impact('light');
                                toggleTheme();
                              }}
                              className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                              aria-label={
                                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
                              }
                            >
                              {theme === 'dark' ? (
                                <Sun size={20} weight="bold" className="text-foreground" />
                              ) : (
                                <Moon size={20} weight="bold" className="text-foreground" />
                              )}
                            </Button>
                          </AnimatedView>
                          <AnimatedView
                            style={headerButton6.buttonStyle}
                            onMouseEnter={headerButton6.handleEnter}
                            onMouseLeave={headerButton6.handleLeave}
                            onClick={headerButton6.handleTap}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                haptics.impact('medium');
                                setShowThemeSettings(true);
                              }}
                              className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                              aria-label="Theme Settings"
                              title="Ultra Theme Settings"
                            >
                              <Palette size={20} weight="bold" className="text-foreground" />
                            </Button>
                          </AnimatedView>
                        </AnimatedView>
                      </div>
                    </div>
                  </AnimatedView>

                  <Suspense fallback={null}>
                    <BillingIssueBanner />
                  </Suspense>

                  {/* Enhanced main content with premium transitions */}
                  <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 relative z-10">
                    <Suspense
                      fallback={
                        <AnimatedView style={loadingTransition.style}>
                          <LoadingState />
                        </AnimatedView>
                      }
                    >
                      <AnimatedView key={currentView} style={pageTransition.style}>
                        {currentView === 'discover' && <DiscoverView />}
                        {currentView === 'matches' && (
                          <MatchesView onNavigateToChat={() => setCurrentView('chat')} />
                        )}
                        {currentView === 'chat' && <ChatView />}
                        {currentView === 'community' && <CommunityView />}
                        {currentView === 'adoption' && <AdoptionView />}
                        {currentView === 'lost-found' && <LostFoundView />}
                        {currentView === 'profile' && <ProfileView />}
                      </AnimatedView>
                    </Suspense>
                  </main>

                  <AnimatedView
                    style={navBarAnimation.navStyle}
                    className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-2xl border-t border-border/50 z-40 shadow-2xl shadow-primary/20 safe-area-inset-bottom"
                  >
                    <div className="absolute inset-0 bg-linear-to-t from-primary/8 via-accent/4 to-transparent pointer-events-none" />
                    <AnimatedView
                      style={navBarAnimation.shimmerStyle}
                      className="absolute inset-0 bg-linear-to-r from-transparent via-accent/5 to-transparent pointer-events-none"
                    >
                      <div />
                    </AnimatedView>
                    <div className="max-w-7xl mx-auto px-1 sm:px-2 relative">
                      <div className="flex items-center justify-around py-2 sm:py-3 gap-1">
                        <NavButton
                          isActive={currentView === 'discover'}
                          onClick={() => setCurrentView('discover')}
                          icon={
                            <Sparkle
                              size={22}
                              weight={currentView === 'discover' ? 'fill' : 'regular'}
                            />
                          }
                          label={t.nav.discover}
                          enablePulse={currentView === 'discover'}
                          enableIconAnimation={true}
                        />

                        <NavButton
                          isActive={currentView === 'matches'}
                          onClick={() => setCurrentView('matches')}
                          icon={
                            <Heart
                              size={22}
                              weight={currentView === 'matches' ? 'fill' : 'regular'}
                            />
                          }
                          label={t.nav.matches}
                          enablePulse={currentView === 'matches'}
                        />

                        <NavButton
                          isActive={currentView === 'chat'}
                          onClick={() => setCurrentView('chat')}
                          icon={
                            <ChatCircle
                              size={22}
                              weight={currentView === 'chat' ? 'fill' : 'regular'}
                            />
                          }
                          label={t.nav.chat}
                          enablePulse={currentView === 'chat'}
                        />

                        <NavButton
                          isActive={currentView === 'community'}
                          onClick={() => setCurrentView('community')}
                          icon={
                            <Users
                              size={22}
                              weight={currentView === 'community' ? 'fill' : 'regular'}
                            />
                          }
                          label={t.nav.community || 'Community'}
                          enablePulse={currentView === 'community'}
                        />

                        <NavButton
                          isActive={currentView === 'adoption'}
                          onClick={() => setCurrentView('adoption')}
                          icon={
                            <Heart
                              size={22}
                              weight={currentView === 'adoption' ? 'fill' : 'duotone'}
                            />
                          }
                          label={t.nav.adoption || 'Adopt'}
                          enablePulse={currentView === 'adoption'}
                        />

                        <AnimatedView
                          className={`${NAV_BUTTON_BASE_CLASSES} relative cursor-pointer ${currentView === 'lost-found'
                            ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                            }`}
                          style={lostFoundAnimation.buttonStyle}
                          onMouseEnter={lostFoundAnimation.handleHover}
                          onMouseLeave={lostFoundAnimation.handleLeave}
                          onClick={() => {
                            lostFoundAnimation.handlePress();
                            haptics.impact('light');
                            setCurrentView('lost-found');
                          }}
                        >
                          <AnimatedView style={lostFoundAnimation.iconStyle}>
                            <MapPin
                              size={22}
                              weight={currentView === 'lost-found' ? 'fill' : 'regular'}
                            />
                          </AnimatedView>
                          <span className="text-[10px] sm:text-xs font-semibold leading-tight">
                            {t.nav['lost-found'] || 'Lost & Found'}
                          </span>
                          {currentView === 'lost-found' && (
                            <AnimatedView
                              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
                              style={lostFoundAnimation.indicatorStyle}
                            >
                              <div />
                            </AnimatedView>
                          )}
                        </AnimatedView>

                        <NavButton
                          isActive={currentView === 'profile'}
                          onClick={() => setCurrentView('profile')}
                          icon={
                            <User
                              size={22}
                              weight={currentView === 'profile' ? 'fill' : 'regular'}
                            />
                          }
                          label={t.nav.profile}
                          enablePulse={currentView === 'profile'}
                        />
                      </div>
                    </div>
                  </AnimatedView>

                  <Suspense fallback={null}>
                    <QuickActionsMenu
                      onCreatePet={() => setCurrentView('profile')}
                      onViewHealth={() => setCurrentView('profile')}
                      onSchedulePlaydate={() => setCurrentView('matches')}
                      onSavedSearches={() => setCurrentView('discover')}
                      onGenerateProfiles={() => setShowGenerateProfiles(true)}
                      onViewStats={() => setShowStats(true)}
                      onViewMap={() => setShowMap(true)}
                    />
                  </Suspense>

                  {showGenerateProfiles && (
                    <AnimatedView
                      style={generateProfilesModal.style}
                      className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
                      onClick={() => setShowGenerateProfiles(false)}
                    >
                      <AnimatedView
                        style={generateProfilesContent.style}
                        onClick={(e?: React.MouseEvent<Element>) => e?.stopPropagation()}
                        className="bg-card p-6 rounded-2xl shadow-2xl max-w-md w-full border border-border/50"
                      >
                        <Suspense fallback={<LoadingState />}>
                          <GenerateProfilesButton />
                        </Suspense>
                        <AnimatedView style={closeButtonBounce.animatedStyle}>
                          <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => setShowGenerateProfiles(false)}
                          >
                            Close
                          </Button>
                        </AnimatedView>
                      </AnimatedView>
                    </AnimatedView>
                  )}
                  {showStats && totalSwipes > 0 && (
                    <AnimatedView
                      style={statsModal.style}
                      className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
                      onClick={() => setShowStats(false)}
                    >
                      <AnimatedView
                        style={statsContent.style}
                        onClick={(e?: React.MouseEvent<Element>) => e?.stopPropagation()}
                        className="max-w-2xl w-full"
                      >
                        <Suspense fallback={<LoadingState />}>
                          <StatsCard
                            totalMatches={totalMatches}
                            totalSwipes={totalSwipes}
                            successRate={successRate}
                          />
                        </Suspense>
                        <AnimatedView style={closeButtonBounce.animatedStyle}>
                          <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => setShowStats(false)}
                          >
                            Close
                          </Button>
                        </AnimatedView>
                      </AnimatedView>
                    </AnimatedView>
                  )}

                  {showMap && (
                    <AnimatedView style={mapModal.style} className="fixed inset-0 z-50">
                      <Suspense fallback={<LoadingState />}>
                        <AnimatedView style={mapContent.style} className="h-full w-full">
                          <PlaydateMap
                            playdates={playdates || []}
                            onClose={() => setShowMap(false)}
                          />
                        </AnimatedView>
                      </Suspense>
                    </AnimatedView>
                  )}

                  {showAdminConsole && (
                    <AnimatedView
                      style={adminModal.style}
                      className="fixed inset-0 z-50 bg-background"
                    >
                      <AnimatedView style={adminContent.style} className="h-full w-full">
                        <Suspense fallback={<LoadingState />}>
                          <AdminConsole onClose={() => setShowAdminConsole(false)} />
                        </Suspense>
                      </AnimatedView>
                    </AnimatedView>
                  )}

                  {showThemeSettings && (
                    <Dialog open={showThemeSettings} onOpenChange={setShowThemeSettings}>
                      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
                        <DialogTitle className="sr-only">Ultra Theme Settings</DialogTitle>
                        <AnimatedView style={themeContent.style}>
                          <Suspense fallback={<LoadingState />}>
                            <UltraThemeSettings />
                          </Suspense>
                        </AnimatedView>
                      </DialogContent>
                    </Dialog>
                  )}

                  <Toaster />
                  <Suspense fallback={null}>
                    <BottomNavBar />
                  </Suspense>
                </div>
              )}
            </>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
