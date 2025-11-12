/**
 * Enhanced Announcements Hook (WCAG 2.2 AAA)
 *
 * Hook to provide enhanced screen reader announcements for complex interactions.
 *
 * Location: apps/web/src/hooks/use-enhanced-announcements.ts
 */

import { useCallback } from 'react';
import {
  announceEnhanced,
  announceStateChange,
  announceActionCompletion,
  announceError,
  announceSuccess,
  announceNavigation,
  announceFormSubmission,
  announceLoading,
  announceLoaded,
  type EnhancedAnnouncement,
} from '@/core/a11y/screen-reader-announcements';

/**
 * Return type for enhanced announcements hook
 */
export interface UseEnhancedAnnouncementsReturn {
  readonly announce: (announcement: EnhancedAnnouncement) => void;
  readonly announceStateChange: (element: string, oldState: string, newState: string, context?: string) => void;
  readonly announceActionCompletion: (action: string, result?: string, context?: string) => void;
  readonly announceError: (error: string, context?: string, nextSteps?: readonly string[]) => void;
  readonly announceSuccess: (message: string, context?: string, nextSteps?: readonly string[]) => void;
  readonly announceNavigation: (to: string, from?: string) => void;
  readonly announceFormSubmission: (formName: string, success: boolean) => void;
  readonly announceLoading: (action: string, context?: string) => void;
  readonly announceLoaded: (action: string, context?: string) => void;
}

/**
 * Hook to provide enhanced screen reader announcements
 */
export function useEnhancedAnnouncements(): UseEnhancedAnnouncementsReturn {
  const announce = useCallback((announcement: EnhancedAnnouncement) => {
    announceEnhanced(announcement);
  }, []);

  const handleStateChange = useCallback(
    (element: string, oldState: string, newState: string, context?: string) => {
      announceStateChange(element, oldState, newState, context);
    },
    []
  );

  const handleActionCompletion = useCallback(
    (action: string, result?: string, context?: string) => {
      announceActionCompletion(action, result, context);
    },
    []
  );

  const handleError = useCallback(
    (error: string, context?: string, nextSteps?: readonly string[]) => {
      announceError(error, context, nextSteps);
    },
    []
  );

  const handleSuccess = useCallback(
    (message: string, context?: string, nextSteps?: readonly string[]) => {
      announceSuccess(message, context, nextSteps);
    },
    []
  );

  const handleNavigation = useCallback((to: string, from?: string) => {
    announceNavigation(to, from);
  }, []);

  const handleFormSubmission = useCallback((formName: string, success: boolean) => {
    announceFormSubmission(formName, success);
  }, []);

  const handleLoading = useCallback((action: string, context?: string) => {
    announceLoading(action, context);
  }, []);

  const handleLoaded = useCallback((action: string, context?: string) => {
    announceLoaded(action, context);
  }, []);

  return {
    announce,
    announceStateChange: handleStateChange,
    announceActionCompletion: handleActionCompletion,
    announceError: handleError,
    announceSuccess: handleSuccess,
    announceNavigation: handleNavigation,
    announceFormSubmission: handleFormSubmission,
    announceLoading: handleLoading,
    announceLoaded: handleLoaded,
  };
}
