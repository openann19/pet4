import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingState from '@/components/LoadingState';
import PetsDemoPage from '@/components/demo/PetsDemoPage';
import type { AppRoutesProps } from './AppRoutes.types';

const WelcomeScreen = lazy(() => import('@/components/WelcomeScreen'));
const AuthScreen = lazy(() => import('@/components/AuthScreen'));
const MainAppLayout = lazy(() => import('@/components/layout/MainAppLayout'));

export function AppRoutesContent({
  appState,
  authMode,
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
  isOnline,
  onWelcomeGetStarted,
  onWelcomeSignIn,
  onWelcomeExplore,
  onAuthSuccess,
  onAuthBack,
}: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/demo/pets" element={
        <Suspense fallback={<LoadingState />}>
          <PetsDemoPage />
        </Suspense>
      } />
      <Route path="*" element={
        <>
          {appState === 'welcome' && (
            <Suspense fallback={<LoadingState />}>
              <WelcomeScreen
                onGetStarted={onWelcomeGetStarted}
                onSignIn={onWelcomeSignIn}
                onExplore={onWelcomeExplore}
                isOnline={isOnline}
              />
            </Suspense>
          )}
          {appState === 'auth' && (
            <Suspense fallback={<LoadingState />}>
              <AuthScreen
                initialMode={authMode}
                onBack={onAuthBack}
                onSuccess={onAuthSuccess}
              />
            </Suspense>
          )}
          {appState === 'main' && (
            <Suspense fallback={<LoadingState />}>
              <MainAppLayout
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
                NAV_BUTTON_BASE_CLASSES="flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px] sm:min-w-[70px]"
              />
            </Suspense>
          )}
        </>
      } />
    </Routes>
  );
}
