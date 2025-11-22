/**
 * Typed Navigation Hook
 * Provides type-safe navigation for the app
 */

import { useCallback } from 'react';
import type { View, RouteConfig } from '@/lib/routes';
import { routes, getSafeRouteParams } from '@/lib/routes';

export interface UseNavigationReturn {
  navigate: (config: RouteConfig) => void;
  navigateToView: (view: View) => void;
  routes: typeof routes;
}

/**
 * Hook for type-safe navigation
 * Returns navigation functions and route helpers
 */
export function useNavigation(
  setCurrentView: (view: View) => void
): UseNavigationReturn {
  const navigate = useCallback(
    (config: RouteConfig) => {
      // Validate params if schema exists
      if (config.params) {
        getSafeRouteParams(config.view, config.params);
      }
      setCurrentView(config.view);
    },
    [setCurrentView]
  );

  const navigateToView = useCallback(
    (view: View) => {
      setCurrentView(view);
    },
    [setCurrentView]
  );

  return {
    navigate,
    navigateToView,
    routes,
  };
}

