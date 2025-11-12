/**
 * usePWA - React hook for PWA functionality
 * Provides install prompt and PWA status
 */

import { useState, useEffect, useCallback } from 'react';
import { isPWA, canInstallPWA, promptPWAInstall } from '../lib/pwa/service-worker-registration';

interface UsePWAResult {
  isInstalled: boolean;
  canInstall: boolean;
  promptInstall: () => Promise<boolean>;
  isInstallPromptSupported: boolean;
}

export function usePWA(): UsePWAResult {
  const [isInstalled, setIsInstalled] = useState(isPWA());
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if PWA is installed
    setIsInstalled(isPWA());

    // Check if installation is supported
    const isSupported = canInstallPWA();
    if (!isSupported) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    const result = await promptPWAInstall(deferredPrompt);

    if (result?.outcome === 'accepted') {
      setDeferredPrompt(null);
      setCanInstall(false);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  return {
    isInstalled,
    canInstall,
    promptInstall,
    isInstallPromptSupported: canInstallPWA(),
  };
}
