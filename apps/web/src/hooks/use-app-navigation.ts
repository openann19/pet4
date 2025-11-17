/**
 * useAppNavigation Hook
 *
 * Manages view navigation state and handlers.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { useState } from 'react';
import { getDefaultView } from '@/lib/routes';
import type { View } from '@/lib/routes';

interface UseAppNavigationReturn {
  currentView: View;
  setCurrentView: (view: View) => void;
  navigateToChat: () => void;
}

export function useAppNavigation(): UseAppNavigationReturn {
  const [currentView, setCurrentView] = useState<View>(getDefaultView());

  const navigateToChat = (): void => {
    setCurrentView('chat');
  };

  return {
    currentView,
    setCurrentView,
    navigateToChat,
  };
}
