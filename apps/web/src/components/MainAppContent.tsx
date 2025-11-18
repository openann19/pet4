import { MotionView } from '@petspark/motion';
import { lazy, Suspense } from 'react';
import HoloBackground from '@/components/chrome/HoloBackground';
import GlowTrail from '@/effects/cursor/GlowTrail';
import { AmbientAuroraBackground, ScrollProgressBar, PageChangeFlash } from '@/effects/ultra-web-overlays';
import LoadingState from '@/components/LoadingState';
import { AppHeader } from './AppHeader';
import { AppNavBar } from './AppNavBar';
import { AppModals } from './AppModals';
import type { UseAppAnimationsReturn } from '@/hooks/use-app-animations';
import { haptics } from '@/lib/haptics';

// Route components - lazy loaded
const DiscoverView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/DiscoverView'));
const MatchesView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/MatchesView'));
const ProfileView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/ProfileView'));
const ChatView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/ChatView'));
const CommunityView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/CommunityView'));
const AdoptionView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/AdoptionView'));
const LostFoundView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/LostFoundView'));

const SeedDataInitializer = lazy(() => import('@/components/SeedDataInitializer'));
const BillingIssueBanner = lazy(() => import('@/components/payments/BillingIssueBanner').then(module => ({ default: module.BillingIssueBanner })));
const QuickActionsMenu = lazy(() => import('@/components/QuickActionsMenu'));
const BottomNavBar = lazy(() => import('@/components/navigation/BottomNavBar'));
const Toaster = lazy(() => import('@/components/ui/sonner').then(module => ({ default: module.Toaster })));

import type { Playdate } from '@/lib/playdate-types';

export interface MainAppContentProps {
  currentView: string;
  t: { app: { title: string }; nav: Record<string, string> };
  theme: 'light' | 'dark';
  language: 'en' | 'bg';
  playdates: Playdate[];
  totalMatches: number;
  totalSwipes: number;
  successRate: number;
  animations: UseAppAnimationsReturn;
  showGenerateProfiles: boolean;
  showStats: boolean;
  showMap: boolean;
  showAdminConsole: boolean;
  showThemeSettings: boolean;
  onNavigate: (view: string) => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onOpenAdminConsole: () => void;
  onOpenThemeSettings: () => void;
  onCloseGenerateProfiles: () => void;
  onCloseStats: () => void;
  onCloseMap: () => void;
  onCloseAdminConsole: () => void;
  onCloseThemeSettings: () => void;
  onNavigateToProfile: () => void;
  onNavigateToMatches: () => void;
  onNavigateToDiscover: () => void;
  onNavigateToChat: () => void;
}

export function MainAppContent({
  currentView,
  t,
  theme,
  language,
  playdates,
  totalMatches,
  totalSwipes,
  successRate,
  animations,
  showGenerateProfiles,
  showStats,
  showMap,
  showAdminConsole,
  showThemeSettings,
  onNavigate,
  onToggleTheme,
  onToggleLanguage,
  onOpenAdminConsole,
  onOpenThemeSettings,
  onCloseGenerateProfiles,
  onCloseStats,
  onCloseMap,
  onCloseAdminConsole,
  onCloseThemeSettings,
  onNavigateToProfile,
  onNavigateToMatches,
  onNavigateToDiscover,
  onNavigateToChat,
}: MainAppContentProps) {
  const renderView = () => {
    switch (currentView) {
      case 'discover':
        return <DiscoverView />;
      case 'matches':
        return <MatchesView onNavigateToChat={onNavigateToChat} />;
      case 'chat':
        return <ChatView />;
      case 'community':
        return <CommunityView />;
      case 'adoption':
        return <AdoptionView />;
      case 'lost-found':
        return <LostFoundView />;
      case 'profile':
        return <ProfileView />;
      default:
        return null;
    }
  };
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
        t={t}
        theme={theme}
        language={language}
        animations={animations}
        onToggleTheme={onToggleTheme}
        onToggleLanguage={onToggleLanguage}
        onOpenAdminConsole={onOpenAdminConsole}
        onOpenThemeSettings={onOpenThemeSettings}
      />

      <Suspense fallback={null}>
        <BillingIssueBanner />
      </Suspense>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 relative z-10">
        <Suspense fallback={
          <MotionView style={animations.loadingTransition.style}>
            <LoadingState />
          </MotionView>
        }>
          <MotionView
            key={currentView}
            style={animations.pageTransition.style}
          >
            {renderView()}
          </MotionView>
        </Suspense>
      </main>

      <AppNavBar
        currentView={currentView}
        t={t}
        animations={animations}
        onNavigate={(view) => {
          haptics.impact('light');
          onNavigate(view);
        }}
      />

      <Suspense fallback={null}>
        <QuickActionsMenu
          onCreatePet={onNavigateToProfile}
          onViewHealth={onNavigateToProfile}
          onSchedulePlaydate={onNavigateToMatches}
          onSavedSearches={onNavigateToDiscover}
          onGenerateProfiles={() => {}}
          onViewStats={() => {}}
          onViewMap={() => {}}
        />
      </Suspense>

      <AppModals
        showGenerateProfiles={showGenerateProfiles}
        showStats={showStats}
        showMap={showMap}
        showAdminConsole={showAdminConsole}
        showThemeSettings={showThemeSettings}
        playdates={playdates}
        totalMatches={totalMatches}
        totalSwipes={totalSwipes}
        successRate={successRate}
        animations={animations}
        onCloseGenerateProfiles={onCloseGenerateProfiles}
        onCloseStats={onCloseStats}
        onCloseMap={onCloseMap}
        onCloseAdminConsole={onCloseAdminConsole}
        onCloseThemeSettings={onCloseThemeSettings}
      />

      <Suspense fallback={null}>
        <Toaster />
      </Suspense>
      <Suspense fallback={null}>
        <BottomNavBar
          currentView={currentView as any}
          setCurrentView={(view) => {
            haptics.impact('light');
            onNavigate(view);
          }}
        />
      </Suspense>
    </div>
  );
}

