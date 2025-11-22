import type { NavigationError } from './navigation-error-types';

/**
 * Generates a standardized bug title for navigation errors
 * Format: Navigation error: /from → /to — {ErrorType}
 */
export function generateNavigationErrorBugTitle(error: NavigationError): string {
  const errorTypeLabel = getErrorTypeLabel(error.type);
  return `Navigation error: ${error.fromPath} → ${error.toPath} — ${errorTypeLabel}`;
}

/**
 * Gets a human-readable label for error types
 */
function getErrorTypeLabel(type: NavigationError['type']): string {
  switch (type) {
    case 'chunk-load-error':
      return 'ChunkLoadError';
    case 'hydration-mismatch':
      return 'Hydration mismatch';
    case '404':
      return '404';
    case '500':
      return 'Route-level 500';
    case 'data-fetch-error':
      return 'Data-fetch error';
    default:
      return 'Unknown error';
  }
}

/**
 * Creates a navigation error report for tracking/analytics
 */
export function createNavigationErrorReport(error: NavigationError): {
  title: string;
  error: NavigationError;
  userAgent: string;
  url: string;
  timestamp: string;
} {
  return {
    title: generateNavigationErrorBugTitle(error),
    error,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    timestamp: new Date().toISOString(),
  };
}
