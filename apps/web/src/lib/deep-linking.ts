/**
 * Deep Linking System
 *
 * Handles universal links (iOS) and app links (Android) for routing
 * to correct screens when app is closed, backgrounded, or foreground.
 */

import { createLogger } from './logger';
import { isTruthy } from '@petspark/shared';

const logger = createLogger('deep-linking');

export interface DeepLinkRoute {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

export type DeepLinkHandler = (route: DeepLinkRoute) => Promise<void> | void;

export interface DeepLinkConfig {
  baseUrl: string;
  routes: Map<string, DeepLinkHandler>;
  defaultRoute?: string;
  onUnhandledRoute?: (route: DeepLinkRoute) => void;
}

class DeepLinkManager {
  private config: DeepLinkConfig;
  private isInitialized = false;
  private pendingRoute: DeepLinkRoute | null = null;
  private appState: 'closed' | 'background' | 'foreground' = 'foreground';
  private popstateHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;
  private blurHandler: (() => void) | null = null;
  private visibilityChangeHandler: (() => void) | null = null;

  constructor(config: DeepLinkConfig) {
    this.config = config;
  }

  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    // Handle initial URL if app opened from link
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    try {
      this.handleCurrentUrl();

      // Listen for URL changes (popstate for browser, focus for app)
      this.popstateHandler = () => {
        try {
          this.handleCurrentUrl();
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('DeepLinkManager popstate handler error', err);
        }
      };
      window.addEventListener('popstate', this.popstateHandler);

      // Listen for app focus (when coming from background)
      this.focusHandler = () => {
        try {
          this.appState = 'foreground';
          this.processPendingRoute();
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('DeepLinkManager focus handler error', err);
        }
      };
      window.addEventListener('focus', this.focusHandler);

      this.blurHandler = () => {
        try {
          this.appState = 'background';
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('DeepLinkManager blur handler error', err);
        }
      };
      window.addEventListener('blur', this.blurHandler);

      // Listen for visibility changes
      this.visibilityChangeHandler = () => {
        try {
          if (document.visibilityState === 'visible') {
            this.appState = 'foreground';
            this.processPendingRoute();
          } else {
            this.appState = 'background';
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('DeepLinkManager visibilitychange handler error', err);
        }
      };
      document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('DeepLinkManager initialize error', err);
    }
  }

  private handleCurrentUrl(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const route = this.parseUrl(url);

    if (route) {
      void this.handleRoute(route).catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to handle current URL', err);
      });
    }
  }

  private parseUrl(url: URL): DeepLinkRoute | null {
    try {
      const baseUrl = new URL(this.config.baseUrl);
      if (url.origin !== baseUrl.origin) {
        return null;
      }

      const path = url.pathname;
      const params: Record<string, string> = {};
      const query: Record<string, string> = {};

      // Parse query parameters
      url.searchParams.forEach((value, key) => {
        query[key] = value;
      });

      // Parse path parameters (e.g., /chat/:id -> { id: "123" })
      const pathParts = path.split('/').filter(Boolean);

      // Try to match routes
      for (const [routePath] of this.config.routes.entries()) {
        const routeParts = routePath.split('/').filter(Boolean);

        if (routeParts.length === pathParts.length) {
          let matches = true;
          const extractedParams: Record<string, string> = {};

          for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const pathPart = pathParts[i];

            if (!routePart) {
              matches = false;
              break;
            }

            if (routePart.startsWith(':')) {
              // Parameter
              const paramName = routePart.slice(1);
              if (pathPart) {
                extractedParams[paramName] = decodeURIComponent(pathPart);
              }
            } else if (routePart !== pathPart) {
              matches = false;
              break;
            }
          }

          if (isTruthy(matches)) {
            return {
              path: routePath,
              params: { ...extractedParams, ...params },
              query,
            };
          }
        }
      }

      // If no route matched, return generic route
      return {
        path,
        params,
        query,
      };
    } catch (error) {
      logger.error(
        'Failed to parse URL',
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  async handleRoute(route: DeepLinkRoute): Promise<void> {
    const handler = this.config.routes.get(route.path);

    if (isTruthy(handler)) {
      try {
        await handler(route);
        logger.info('Deep link handled', { path: route.path, appState: this.appState });
      } catch (error) {
        logger.error(
          'Deep link handler failed',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    } else {
      // Try default route
      if (this.config.defaultRoute) {
        const defaultHandler = this.config.routes.get(this.config.defaultRoute);
        if (defaultHandler) {
          try {
            await defaultHandler(route);
            return;
          } catch (error) {
            logger.error(
              'Default route handler failed',
              error instanceof Error ? error : new Error(String(error))
            );
          }
        }
      }

      // Unhandled route
      if (this.config.onUnhandledRoute) {
        this.config.onUnhandledRoute(route);
      } else {
        logger.warn('Unhandled deep link', { path: route.path });
      }
    }
  }

  private processPendingRoute(): void {
    if (this.pendingRoute && this.appState === 'foreground') {
      const route = this.pendingRoute;
      this.pendingRoute = null;
      void this.handleRoute(route).catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to process pending route', err);
      });
    }
  }

  navigate(route: DeepLinkRoute): void {
    if (this.appState === 'foreground') {
      void this.handleRoute(route).catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to navigate to route', err);
      });
    } else {
      // Store for when app becomes foreground
      this.pendingRoute = route;
    }
  }

  registerRoute(path: string, handler: DeepLinkHandler): void {
    this.config.routes.set(path, handler);
  }

  unregisterRoute(path: string): void {
    this.config.routes.delete(path);
  }

  getAppState(): 'closed' | 'background' | 'foreground' {
    return this.appState;
  }

  destroy(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.isInitialized = false;
      this.pendingRoute = null;
      return;
    }

    try {
      if (this.popstateHandler) {
        window.removeEventListener('popstate', this.popstateHandler);
        this.popstateHandler = null;
      }
      if (this.focusHandler) {
        window.removeEventListener('focus', this.focusHandler);
        this.focusHandler = null;
      }
      if (this.blurHandler) {
        window.removeEventListener('blur', this.blurHandler);
        this.blurHandler = null;
      }
      if (this.visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
        this.visibilityChangeHandler = null;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('DeepLinkManager destroy error', err);
    }

    this.isInitialized = false;
    this.pendingRoute = null;
  }
}

// Common route handlers
export const createChatRouteHandler = (onNavigate: (chatId: string) => void): DeepLinkHandler => {
  return (route: DeepLinkRoute): Promise<void> => {
    const chatId = route.params.id ?? route.query.chatId;
    if (chatId) {
      onNavigate(chatId);
    }
    return Promise.resolve();
  };
};

export const createMatchRouteHandler = (onNavigate: (matchId: string) => void): DeepLinkHandler => {
  return (route: DeepLinkRoute): Promise<void> => {
    const matchId = route.params.id ?? route.query.matchId;
    if (matchId) {
      onNavigate(matchId);
    }
    return Promise.resolve();
  };
};

export const createProfileRouteHandler = (
  onNavigate: (profileId: string) => void
): DeepLinkHandler => {
  return (route: DeepLinkRoute): Promise<void> => {
    const profileId = route.params.id ?? route.query.profileId;
    if (profileId) {
      onNavigate(profileId);
    }
    return Promise.resolve();
  };
};

export const createAdoptionRouteHandler = (
  onNavigate: (listingId: string) => void
): DeepLinkHandler => {
  return (route: DeepLinkRoute): Promise<void> => {
    const listingId = route.params.id ?? route.query.listingId;
    if (listingId) {
      onNavigate(listingId);
    }
    return Promise.resolve();
  };
};

// Singleton instance
let managerInstance: DeepLinkManager | null = null;

export function createDeepLinkManager(config: DeepLinkConfig): DeepLinkManager {
  if (managerInstance) {
    managerInstance.destroy();
  }
  managerInstance = new DeepLinkManager(config);
  managerInstance.initialize();
  return managerInstance;
}

export function getDeepLinkManager(): DeepLinkManager | null {
  return managerInstance;
}
