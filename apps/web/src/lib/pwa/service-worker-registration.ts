/**
 * Service Worker Registration
 * Handles PWA service worker lifecycle
 */

import { createLogger } from '../logger';
import { isTruthy } from '@petspark/shared';

const logger = createLogger('ServiceWorkerRegistration');

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

interface ServiceWorkerRegistrationResult {
  registration: ServiceWorkerRegistration;
  cleanup: () => void;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(
  config: ServiceWorkerConfig = {}
): Promise<ServiceWorkerRegistration | null> {
  const result = await registerServiceWorkerWithCleanup(config);
  return result?.registration ?? null;
}

/**
 * Register service worker with cleanup function
 */
export async function registerServiceWorkerWithCleanup(
  config: ServiceWorkerConfig = {}
): Promise<ServiceWorkerRegistrationResult | null> {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    logger.warn('Service workers are not supported in this browser');
    return null;
  }

  // Only register in production
  if (isTruthy(import.meta.env.DEV)) {
    logger.debug('Service worker registration skipped in development');
    return null;
  }

  try {
    // Try enhanced service worker first, fallback to basic one
    const swPath = '/sw-enhanced.js'
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: '/',
    }).catch(async () => {
      // Fallback to basic service worker
      logger.warn('Enhanced service worker failed, using basic one')
      return await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })
    });

    const updateFoundHandler = () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      const stateChangeHandler = () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          config.onUpdate?.(registration);
        } else if (newWorker.state === 'activated') {
          // Service worker activated
          config.onSuccess?.(registration);
        }
      };

      newWorker.addEventListener('statechange', stateChangeHandler);
    };

    registration.addEventListener('updatefound', updateFoundHandler);

    // Check for updates every hour
    const intervalId = window.setInterval(
      () => {
        void registration.update();
      },
      60 * 60 * 1000
    );

    // Cleanup function
    const cleanup = (): void => {
      clearInterval(intervalId);
      registration.removeEventListener('updatefound', updateFoundHandler);
    };

    return {
      registration,
      cleanup,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Service worker registration failed', {
      message: err.message,
      stack: err.stack,
    });
    config.onError?.(err);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (isTruthy(registration)) {
      return await registration.unregister();
    }
    return false;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Service worker unregistration failed', {
      message: err.message,
      stack: err.stack,
    });
    return false;
  }
}

/**
 * Check if app is running as PWA
 */
export function isPWA(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

/**
 * Check if app can be installed as PWA
 */
export function canInstallPWA(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}

/**
 * Prompt PWA installation
 */
export async function promptPWAInstall(
  event: Event
): Promise<{ outcome: 'accepted' | 'dismissed' } | null> {
  if (!('prompt' in event)) {
    return null;
  }

  const promptEvent = event as BeforeInstallPromptEvent;

  try {
    await promptEvent.prompt();
    const result = await promptEvent.userChoice;
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('PWA install prompt failed', {
      message: err.message,
      stack: err.stack,
    });
    return null;
  }
}

// BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
