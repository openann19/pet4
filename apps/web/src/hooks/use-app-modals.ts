/**
 * useAppModals Hook
 *
 * Manages modal visibility state for all app modals.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { useState } from 'react';

interface UseAppModalsReturn {
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
  openGenerateProfiles: () => void;
  openStats: () => void;
  openMap: () => void;
  openAdminConsole: () => void;
  openThemeSettings: () => void;
  closeAllModals: () => void;
}

export function useAppModals(): UseAppModalsReturn {
  const [showGenerateProfiles, setShowGenerateProfiles] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showAdminConsole, setShowAdminConsole] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);

  const openGenerateProfiles = (): void => {
    setShowGenerateProfiles(true);
  };

  const openStats = (): void => {
    setShowStats(true);
  };

  const openMap = (): void => {
    setShowMap(true);
  };

  const openAdminConsole = (): void => {
    setShowAdminConsole(true);
  };

  const openThemeSettings = (): void => {
    setShowThemeSettings(true);
  };

  const closeAllModals = (): void => {
    setShowGenerateProfiles(false);
    setShowStats(false);
    setShowMap(false);
    setShowAdminConsole(false);
    setShowThemeSettings(false);
  };

  return {
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
    openGenerateProfiles,
    openStats,
    openMap,
    openAdminConsole,
    openThemeSettings,
    closeAllModals,
  };
}
