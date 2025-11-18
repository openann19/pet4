/**
 * useAppState Hook
 *
 * Manages the main application state (welcome/auth/main) and authentication flow.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useAppState');

type AppState = 'welcome' | 'auth' | 'main';
type AuthMode = 'signin' | 'signup';

interface UseAppStateReturn {
  appState: AppState;
  authMode: AuthMode;
  hasSeenWelcome: boolean;
  setAuthMode: (mode: AuthMode) => void;
  setHasSeenWelcome: (value: boolean) => Promise<void>;
  handleWelcomeGetStarted: () => void;
  handleWelcomeSignIn: () => void;
  handleWelcomeExplore: () => void;
  handleAuthSuccess: () => void;
  handleAuthBack: () => void;
}

export function useAppState(): UseAppStateReturn {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [hasSeenWelcome, setHasSeenWelcome] = useStorage<boolean>('has-seen-welcome-v2', false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isGuestMode) {
      setAppState('main');
    } else if (hasSeenWelcome && isAuthenticated) {
      setAppState('main');
    } else if (hasSeenWelcome) {
      setAppState('auth');
    } else {
      setAppState('welcome');
    }
  }, [hasSeenWelcome, isAuthenticated, isGuestMode]);

  const handleWelcomeGetStarted = (): void => {
    setHasSeenWelcome(true).catch((error: unknown) => {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to set hasSeenWelcome', err);
    });
    setAuthMode('signup');
    setAppState('auth');
  };

  const handleWelcomeSignIn = (): void => {
    setHasSeenWelcome(true).catch((error: unknown) => {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to set hasSeenWelcome', err);
    });
    setAuthMode('signin');
    setAppState('auth');
  };

  const handleWelcomeExplore = (): void => {
    setHasSeenWelcome(true).catch((error: unknown) => {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to set hasSeenWelcome', err);
    });
    setIsGuestMode(true);
    setAppState('main');
  };

  const handleAuthSuccess = (): void => {
    setIsGuestMode(false);
    setAppState('main');
  };

  const handleAuthBack = (): void => {
    setIsGuestMode(false);
    setAppState('welcome');
  };

  return {
    appState,
    authMode,
    hasSeenWelcome,
    setAuthMode,
    setHasSeenWelcome,
    handleWelcomeGetStarted,
    handleWelcomeSignIn,
    handleWelcomeExplore,
    handleAuthSuccess,
    handleAuthBack,
  };
}
