import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import LoadingState from '@/components/LoadingState';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { ConsentManager, AgeVerification } from '@/components/compliance';
import '@/lib/profile-generator-helper';
import { useStorage } from '@/hooks/use-storage';
import { useAppAnimations } from '@/hooks/use-app-animations';
import { useAppModals } from '@/hooks/use-app-modals';
import { useAppState } from '@/hooks/use-app-state';
import { useAppStats } from '@/hooks/use-app-stats';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useNavigation } from '@/hooks/use-navigation';
import type { Playdate } from '@/lib/playdate-types';
import { useAppEffects } from '@/hooks/use-app-effects';
import { AppRoutesContent } from '@/components/AppRoutes';

const OfflineIndicator = lazy(() => import('@/components/network/OfflineIndicator').then(module => ({ default: module.OfflineIndicator })));
const InstallPrompt = lazy(() => import('@/components/pwa/InstallPrompt').then(module => ({ default: module.InstallPrompt })));

function App() {
  const { currentView, setCurrentView } = useAppNavigation();
  const navigation = useNavigation(setCurrentView);
  const { appState, authMode, handleWelcomeGetStarted, handleWelcomeSignIn, handleWelcomeExplore, handleAuthSuccess, handleAuthBack } = useAppState();
  const { t, theme, toggleTheme, language, toggleLanguage } = useApp();
  const { user } = useAuth();
  const [playdates] = useStorage<Playdate[]>('playdates', []);
  const { showGenerateProfiles, showStats, showMap, showAdminConsole, showThemeSettings, setShowGenerateProfiles, setShowStats, setShowMap, setShowAdminConsole, setShowThemeSettings } = useAppModals();
  const { totalMatches, totalSwipes, successRate } = useAppStats();
  const animations = useAppAnimations({ currentView, language, showGenerateProfiles, showStats, showMap, showAdminConsole, showThemeSettings });
  const { ageVerified, setAgeVerified, isOnline } = useAppEffects(user);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingState />}>
        <OfflineIndicator />
      </Suspense>
      <Suspense fallback={null}>
        <InstallPrompt />
      </Suspense>
      <AppRoutesContent
        appState={appState}
        authMode={authMode}
        currentView={currentView}
        setCurrentView={setCurrentView}
        navigation={navigation}
        animations={animations}
        t={t}
        theme={theme}
        toggleTheme={toggleTheme}
        language={language}
        toggleLanguage={toggleLanguage}
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
        totalMatches={totalMatches}
        totalSwipes={totalSwipes}
        successRate={successRate}
        playdates={playdates}
        isOnline={isOnline}
        onWelcomeGetStarted={handleWelcomeGetStarted}
        onWelcomeSignIn={handleWelcomeSignIn}
        onWelcomeExplore={handleWelcomeExplore}
        onAuthSuccess={handleAuthSuccess}
        onAuthBack={handleAuthBack}
      />
      {!ageVerified && (
        <AgeVerification
          onVerified={(verified) => setAgeVerified(verified)}
          requiredAge={13}
        />
      )}
      <ConsentManager />
    </ErrorBoundary>
  );
}

export default App;
