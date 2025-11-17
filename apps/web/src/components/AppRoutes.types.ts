import type { Playdate } from '@/lib/playdate-types';
import type { UseAppAnimationsReturn } from '@/hooks/use-app-animations';
import type { UseNavigationReturn } from '@/hooks/use-navigation';
import type { View } from '@/lib/routes';
import type { AppContextType } from '@/contexts/AppContext';

export interface AppRoutesProps {
  appState: 'welcome' | 'auth' | 'main';
  authMode: 'signin' | 'signup';
  currentView: View;
  setCurrentView: (view: View) => void;
  navigation: UseNavigationReturn;
  animations: UseAppAnimationsReturn;
  t: AppContextType['t'];
  theme: string;
  toggleTheme: () => void;
  language: string;
  toggleLanguage: () => void;
  showGenerateProfiles: boolean;
  showStats: boolean;
  showMap: boolean;
  showAdminConsole: boolean;
  showThemeSettings: boolean;
  setShowGenerateProfiles: (show: boolean) => void;
  setShowStats: (show: boolean) => void;
  setShowMap: (show: boolean) => void;
  setShowAdminConsole: (show: boolean) => void;
  setShowThemeSettings: (show: boolean) => void;
  totalMatches: number;
  totalSwipes: number;
  successRate: number;
  playdates: Playdate[];
  isOnline: boolean;
  onWelcomeGetStarted: () => void;
  onWelcomeSignIn: () => void;
  onWelcomeExplore: () => void;
  onAuthSuccess: () => void;
  onAuthBack: () => void;
}

