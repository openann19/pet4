/**
 * Service Worker Registration
 * Handles PWA service worker lifecycle
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(
  config: ServiceWorkerConfig = {}
): Promise<ServiceWorkerRegistration | null> {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  // Only register in production
  if (import.meta.env.DEV) {
    console.log('Service worker registration skipped in development');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          config.onUpdate?.(registration);
        } else if (newWorker.state === 'activated') {
          // Service worker activated
          config.onSuccess?.(registration);
        }
      });
    });

    // Check for updates every hour
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    return registration;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Service worker registration failed:', err);
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
    if (registration) {
      return await registration.unregister();
    }
    return false;
  } catch (error) {
    console.error('Service worker unregistration failed:', error);
    return false;
  }
}

/**
 * Check if app is running as PWA
 */
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
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
    promptEvent.prompt();
    const result = await promptEvent.userChoice;
    return result;
  } catch (error) {
    console.error('PWA install prompt failed:', error);
    return null;
  }
}

// BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
