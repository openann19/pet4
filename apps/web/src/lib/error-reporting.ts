import { isTruthy, isDefined } from '@petspark/shared';

/**
 * Error Reporting (Sentry/Crashlytics)
 *
 * Initialize error reporting with DSN from environment variable.
 * Source maps uploaded in CI.
 */

interface ErrorReportingConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  enabled?: boolean;
}

let errorReportingInitialized = false;

/**
 * Initialize error reporting
 */
export function initErrorReporting(config: ErrorReportingConfig = {}): void {
  if (errorReportingInitialized) return;
  if (!config.enabled && !import.meta.env.PROD) return;

  const dsn = config.dsn ?? import.meta.env['VITE_SENTRY_DSN'];
  if (!dsn) {
    // No DSN configured, skip initialization
    return;
  }

  try {
    // Dynamically import Sentry only if DSN is available
    // Fire-and-forget: initialize asynchronously without blocking
    void import('@sentry/browser')
      .then((Sentry) => {
        Sentry.init({
          dsn,
          environment: config.environment ?? import.meta.env.MODE ?? 'production',
          release: config.release ?? import.meta.env['VITE_APP_VERSION'],
          integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
          tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
          replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
          replaysOnErrorSampleRate: 1.0,
          beforeSend(event) {
            // Filter out development errors
            if (!import.meta.env.PROD) {
              return null;
            }
            return event;
          },
        });

        errorReportingInitialized = true;
      })
      .catch(() => {
        // Sentry not installed or failed to load, silently fail
      });
  } catch {
    // Silently fail if Sentry is unavailable
  }
}

/**
 * Report an error manually
 */
export function reportError(error: Error, context?: Record<string, unknown>): void {
  if (!errorReportingInitialized) return;

  try {
    // Fire-and-forget: report error asynchronously without blocking
    void import('@sentry/browser')
      .then((Sentry) => {
        Sentry.captureException(error, {
          contexts: {
            custom: context,
          },
        });
      })
      .catch(() => {
        // Silently fail
      });
  } catch {
    // Silently fail
  }
}

/**
 * Set user context for error reporting
 */
export function setErrorReportingUser(userId: string, email?: string): void {
  if (!errorReportingInitialized) return;

  try {
    // Fire-and-forget: set user context asynchronously without blocking
    void import('@sentry/browser')
      .then((Sentry) => {
        Sentry.setUser({
          id: userId,
          ...(email !== undefined ? { email } : {}),
        });
      })
      .catch(() => {
        // Silently fail
      });
  } catch {
    // Silently fail
  }
}
